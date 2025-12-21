<script setup>
import { useAuthStore } from '../store/auth'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { doc, onSnapshot, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebase'
import { trackPresence } from '../services/presenceService'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const roomId = route.params.id
const room = ref(null)
const cards = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?']

const myVote = computed(() => room.value?.votes?.[authStore.user?.uid] || null)

onMounted(() => {
  const roomRef = doc(db, 'rooms', roomId)
  
  const unsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      router.push({ name: 'dashboard' })
      return
    }
    room.value = { id: snapshot.id, ...snapshot.data() }
  })

  // Track presence
  trackPresence(roomId, authStore.user?.uid, authStore.user?.displayName)

  onUnmounted(() => {
    unsubscribe()
  })
})

const castVote = async (value) => {
  const roomRef = doc(db, 'rooms', roomId)
  const votePath = `votes.${authStore.user.uid}`
  
  await updateDoc(roomRef, {
    [votePath]: value
  })
}

const toggleReveal = async () => {
  const roomRef = doc(db, 'rooms', roomId)
  await updateDoc(roomRef, {
    showVotes: !room.value.showVotes
  })
}

const nextRound = async () => {
  const roomRef = doc(db, 'rooms', roomId)
  await updateDoc(roomRef, {
    showVotes: false,
    votes: {}
  })
}

const inviteLink = computed(() => window.location.href)

const copyLink = () => {
  navigator.clipboard.writeText(inviteLink.value)
  alert('Invite link copied to clipboard!')
}

const participantsCount = computed(() => {
  if (!room.value?.votes) return 0
  return Object.keys(room.value.votes).length
})

const stats = computed(() => {
  if (!room.value?.votes || Object.keys(room.value.votes).length === 0) return null
  const values = Object.values(room.value.votes).filter(v => v !== '?').map(v => parseInt(v))
  if (values.length === 0) return null
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / values.length
  return {
    avg: avg.toFixed(1),
    count: values.length
  }
})

const allVoted = computed(() => {
  // This is a naive check, ideally we'd compare against online users
  // For now, let's just use it as a visual indicator
  return false 
})
</script>

<template>
  <div v-if="room" class="room-view container">
    <header class="room-header">
      <div class="room-title">
        <button @click="router.push({ name: 'dashboard' })" class="btn-back">←</button>
        <h1>{{ room.name }}</h1>
      </div>
      <div class="room-controls">
        <button @click="toggleReveal" class="btn-secondary">
          {{ room.showVotes ? 'Hide Votes' : 'Show Votes' }}
        </button>
        <button @click="nextRound" class="btn-primary">Next Round</button>
      </div>
    </header>

    <main class="room-layout">
      <section class="table-area">
        <div class="poker-table glass">
          <div class="participants">
            <div v-for="(vote, uid) in room.votes" :key="uid" class="participant">
              <div class="card-mini" :class="{ 'voted': vote, 'revealed': room.showVotes }">
                <span v-if="room.showVotes">{{ vote }}</span>
                <span v-else-if="vote">✓</span>
              </div>
              <p class="name">{{ uid === authStore.user.uid ? 'You' : 'Member' }}</p>
            </div>
          </div>
          
          <div class="table-center">
            <div v-if="room.showVotes" class="consensus-reveal">
              <p>Consensus Revealed</p>
            </div>
            <div v-else class="waiting-state">
              <p>Waiting for votes...</p>
            </div>
          </div>
        </div>
      </section>

      <section class="voting-deck">
        <div class="deck-title">
          <h3>Your Estimation</h3>
          <p v-if="myVote">You selected: <strong>{{ myVote }}</strong></p>
        </div>
        <div class="cards-grid">
          <button 
            v-for="card in cards" 
            :key="card" 
            class="card-btn"
            :class="{ 'active': myVote === card }"
            @click="castVote(card)"
          >
            {{ card }}
          </button>
        </div>
      </section>
    </main>

    <footer class="room-footer">
      <div class="invite-container">
        <p class="invite-link">Invite colleagues to the ritual: <span>{{ inviteLink }}</span></p>
        <button @click="copyLink" class="btn-copy">Copy Link</button>
      </div>
    </footer>
  </div>
  <div v-else class="loading-full">
    <div class="spinner"></div>
    <p>Entering the ritual...</p>
  </div>
</template>

<style scoped>
.room-view {
  padding-top: 32px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.room-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: var(--transition);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
}

.room-controls {
  display: flex;
  gap: 12px;
}

.room-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.poker-table {
  height: 400px;
  border-radius: 200px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(99, 102, 241, 0.2);
}

.participants {
  position: absolute;
  width: 100%;
  height: 100%;
}

.participant {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Polar distribution for up to 8 people (simplified) */
.participant:nth-child(1) { top: -20px; left: 50%; transform: translateX(-50%); }
.participant:nth-child(2) { top: 20%; right: 5%; }
.participant:nth-child(3) { bottom: 20%; right: 5%; }
.participant:nth-child(4) { bottom: -20px; left: 50%; transform: translateX(-50%); }
.participant:nth-child(5) { bottom: 20%; left: 5%; }
.participant:nth-child(6) { top: 20%; left: 5%; }

.card-mini {
  width: 48px;
  height: 64px;
  background: var(--color-surface);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: var(--transition);
}

.card-mini.voted {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.2);
  transform: scale(1.1);
}

.card-mini.revealed {
  background: white;
  color: var(--color-bg);
  transform: rotateY(180deg) scale(1.1);
}

.name {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.waiting-state {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 1.1rem;
}

.consensus-reveal h2 {
  font-size: 3rem;
  margin: 0;
}

.voting-deck {
  text-align: center;
}

.cards-grid {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.card-btn {
  width: 60px;
  height: 90px;
  background: var(--color-surface);
  border: 2px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}

.card-btn:hover {
  transform: translateY(-8px);
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.card-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  transform: translateY(-12px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
}

.room-footer {
  padding: 24px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 40px;
}

.invite-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px 24px;
  border-radius: 12px;
}

.invite-link {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.invite-link span {
  color: var(--color-primary);
  margin-left: 8px;
}

.btn-copy {
  background: var(--color-primary);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-copy:hover {
  background: var(--color-secondary);
}

.btn-secondary {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: var(--color-secondary);
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-secondary:hover {
  background: rgba(168, 85, 247, 0.2);
}

.loading-full {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(99, 102, 241, 0.1);
  border-left-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
