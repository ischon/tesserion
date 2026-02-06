<script setup>
import { useAuthStore } from '../store/auth'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { rtdb } from '../firebase'
import { ref as dbRef, onValue, update } from 'firebase/database'
import { trackPresence, leaveRoom } from '../services/presenceService'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const roomId = route.params.id
const room = ref(null)
const isEditingName = ref(false)
const editedName = ref('')

const cards = computed(() => {
  const type = room.value?.sequenceType || 'fibonacci'
  const max = room.value?.maxValue || 21
  
  let sequence = []
  if (type === 'fibonacci') {
    sequence = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]
    sequence = sequence.filter(n => n <= max)
  } else if (type === 'tshirt') {
    const tshirtValues = (import.meta.env.VITE_TSHIRT_VALUES || 'XXS,XS,S,M,L,XL,XXL').split(',')
    sequence = tshirtValues
  } else {
    for (let i = 0; i <= max; i++) {
      sequence.push(i)
    }
  }
  
  return ['☕', ...sequence.map(String), '?']
})

const myVote = computed(() => {
  const v = room.value?.votes?.[authStore.user?.uid]
  return typeof v === 'object' ? v?.value : v
})

onMounted(() => {
  const roomRef = dbRef(rtdb, `rooms/${roomId}`)
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) {
      router.push({ name: 'dashboard' })
      return
    }
    room.value = { id: snapshot.key, ...data }
  })

  // Track presence
  trackPresence(roomId, authStore.user?.uid, authStore.user?.displayName)

  const handleExiting = () => {
    leaveRoom(roomId, authStore.user?.uid)
  }

  // Handle tab/window close
  window.addEventListener('beforeunload', handleExiting)

  onUnmounted(() => {
    unsubscribe()
    window.removeEventListener('beforeunload', handleExiting)
    handleExiting() // Explicitly leave when navigating away in SPA
  })
  
  // Watch for auto-reveal
  watch(allVotedIn, async (newValue) => {
    if (newValue && room.value?.autoReveal && !room.value?.showVotes) {
      // Everyone has voted and auto-reveal is enabled
      const roomRef = dbRef(rtdb, `rooms/${roomId}`)
      await update(roomRef, {
        showVotes: true
      })
    }
  })
})


const castVote = async (value) => {
  const voteRef = dbRef(rtdb, `rooms/${roomId}/votes/${authStore.user.uid}`)
  await update(voteRef, {
    value,
    name: authStore.user.displayName
  })
}

const toggleReveal = async () => {
  const roomRef = dbRef(rtdb, `rooms/${roomId}`)
  await update(roomRef, {
    showVotes: !room.value.showVotes
  })
}

const nextRound = async () => {
  const roomRef = dbRef(rtdb, `rooms/${roomId}`)
  await update(roomRef, {
    showVotes: false,
    votes: {}
  })
}

const startEditingName = () => {
  editedName.value = room.value.name
  isEditingName.value = true
}

const saveName = async () => {
  if (!editedName.value.trim() || editedName.value === room.value.name) {
    isEditingName.value = false
    return
  }
  
  const roomRef = dbRef(rtdb, `rooms/${roomId}`)
  await update(roomRef, {
    name: editedName.value.trim()
  })
  isEditingName.value = false
}

const disableAutoReveal = async () => {
  if (!room.value?.autoReveal) return
  
  const roomRef = dbRef(rtdb, `rooms/${roomId}`)
  await update(roomRef, {
    autoReveal: false
  })
}

const inviteLink = computed(() => window.location.href)

const copyLink = () => {
  navigator.clipboard.writeText(inviteLink.value)
  alert('Invite link copied to clipboard!')
}

const allParticipants = computed(() => {
  if (!room.value?.online_users) return {}
  
  const participants = {}
  
  // Loop through all online users
  Object.entries(room.value.online_users).forEach(([uid, userData]) => {
    const voteData = room.value.votes?.[uid]
    
    participants[uid] = {
      uid,
      name: userData.name,
      hasVoted: !!voteData,
      vote: voteData ? (typeof voteData === 'object' ? voteData.value : voteData) : null
    }
  })
  
  return participants
})

const participantsCount = computed(() => {
  if (!room.value?.online_users) return 0
  return Object.keys(room.value.online_users).length
})

const stats = computed(() => {
  if (!room.value?.votes || Object.keys(room.value.votes).length === 0) return null
  const values = Object.values(room.value.votes)
    .map(v => typeof v === 'object' ? v.value : v)
    .filter(v => v !== '?' && v !== '☕')
  
  if (values.length === 0) return null

  // Check if we can calculate average (only if all values are numeric strings)
  const numericValues = values
    .filter(v => !isNaN(parseInt(v)) && String(parseInt(v)) === v)
    .map(v => parseInt(v))

  if (numericValues.length === values.length && values.length > 0) {
    const sum = numericValues.reduce((a, b) => a + b, 0)
    const avg = sum / numericValues.length
    return {
      avg: avg.toFixed(1),
      count: values.length
    }
  }

  return {
    avg: null,
    count: values.length
  }
})

const allVotedIn = computed(() => {
  if (!room.value?.online_users || !room.value?.votes) return false
  
  const onlineUserIds = Object.keys(room.value.online_users)
  const votedUserIds = Object.keys(room.value.votes)
  
  // Check if everyone who is online has voted
  if (onlineUserIds.length === 0) return false
  
  return onlineUserIds.every(uid => votedUserIds.includes(uid))
})

const allVoted = computed(() => {
  return false 
})

const hasPerfectConsensus = computed(() => {
  if (!room.value?.showVotes || !room.value?.votes) return false
  
  const voteValues = Object.values(room.value.votes).map(v => 
    typeof v === 'object' ? v.value : v
  )
  
  if (voteValues.length === 0) return false
  
  // Exclude coffee (☕) and question mark (?) from consensus effect
  const firstVote = voteValues[0]
  if (firstVote === '☕' || firstVote === '?') return false
  
  // Check if all votes are the same (works for both numeric and text values like t-shirt sizes)
  return voteValues.every(vote => vote === firstVote)
})

const consensusEffectActive = ref(false)

watch(hasPerfectConsensus, (newValue) => {
  if (newValue) {
    consensusEffectActive.value = true
    setTimeout(() => {
      consensusEffectActive.value = false
    }, 5000)
  } else {
    consensusEffectActive.value = false
  }
})
</script>

<template>
  <div v-if="room" class="room-view container">
    <header class="room-header">
      <div class="room-title">
        <button @click="router.push({ name: 'dashboard' })" class="btn-back">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div v-if="isEditingName" class="edit-name-flow">
          <input 
            v-model="editedName" 
            @keyup.enter="saveName" 
            @keyup.esc="isEditingName = false"
            @blur="saveName"
            ref="nameInput"
            class="edit-input"
            autofocus
          />
        </div>
        <h1 v-else @click="startEditingName" class="clickable-title" title="Click to edit">
          {{ room.name }}
          <span class="edit-icon">✎</span>
        </h1>
      </div>
      <div class="room-controls">
        <!-- Show "Disable Auto-Reveal" button when auto-reveal is active -->
        <button 
          v-if="room.autoReveal" 
          @click="disableAutoReveal" 
          class="btn-warning"
          title="Switch to manual reveal mode (cannot be undone)"
        >
          Disable Auto-Reveal
        </button>
        
        <!-- Show normal reveal button only when auto-reveal is disabled -->
        <button 
          v-else
          @click="toggleReveal" 
          class="btn-secondary"
        >
          {{ room.showVotes ? 'Hide Votes' : 'Show Votes' }}
        </button>
        
        <button @click="nextRound" class="btn-primary">Next Round</button>
      </div>
    </header>

    <main class="room-layout">
      <section class="table-area">
        <div class="poker-table glass">
          <div class="participants">
            <div v-for="(participant, uid) in allParticipants" :key="uid" class="participant">
              <div class="card-mini" :class="{ 
                'waiting': !participant.hasVoted,
                'voted': participant.hasVoted, 
                'revealed': room.showVotes && participant.hasVoted
              }">
                <!-- Revealed state: show the vote -->
                <span v-if="room.showVotes && participant.hasVoted">{{ participant.vote }}</span>
                
                <!-- Voted but not revealed: show checkmark -->
                <span v-else-if="participant.hasVoted">✓</span>
                
                <!-- Waiting state: show stopwatch SVG -->
                <svg v-else class="waiting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="13" r="7"></circle>
                  <polyline points="12 9 12 13 13.5 15"></polyline>
                  <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"></path>
                </svg>
              </div>
              <p class="name">
                {{ uid === authStore.user.uid ? 'You' : participant.name }}
              </p>
            </div>
          </div>
          
          <div class="table-center">
            <div v-if="room.showVotes" class="consensus-reveal" :class="{ 'perfect-consensus': consensusEffectActive }">
              <p>Consensus Revealed</p>
              <div v-if="stats" class="stats-box">
                <div v-if="stats.avg" class="stat-item">
                  <span class="stat-label">Average</span>
                  <span class="stat-value">{{ stats.avg }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Votes</span>
                  <span class="stat-value">{{ stats.count }}</span>
                </div>
              </div>
              
              <!-- Floating particles (only when perfect consensus) -->
              <div v-if="consensusEffectActive" class="particles">
                <span class="particle" v-for="i in 8" :key="i"></span>
              </div>
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
  height: 100%;
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

.clickable-title {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 12px;
  border-radius: 8px;
  transition: var(--transition);
}

.clickable-title:hover {
  background: rgba(255, 255, 255, 0.05);
}

.edit-icon {
  font-size: 1rem;
  opacity: 0;
  transition: var(--transition);
}

.clickable-title:hover .edit-icon {
  opacity: 0.5;
}

.edit-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--color-primary);
  color: white;
  font-size: 2rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  outline: none;
  width: 100%;
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
  padding: 0;
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

/* Polar distribution for up to 8 people (refined) */
.participant:nth-child(1) { top: 0; left: 50%; transform: translate(-50%, -50%); }
.participant:nth-child(2) { top: 25%; right: 0; transform: translate(50%, -50%); }
.participant:nth-child(3) { top: 75%; right: 0; transform: translate(50%, -50%); }
.participant:nth-child(4) { bottom: 0; left: 50%; transform: translate(-50%, 50%); }
.participant:nth-child(5) { top: 75%; left: 0; transform: translate(-50%, -50%); }
.participant:nth-child(6) { top: 25%; left: 0; transform: translate(-50%, -50%); }

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

.card-mini.waiting {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
}

.waiting-icon {
  width: 24px;
  height: 24px;
  opacity: 0.4;
  color: rgba(255, 255, 255, 0.6);
}

.card-mini.voted {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.2);
  transform: scale(1.1);
}

.card-mini.revealed {
  background: white;
  color: var(--color-bg);
  transform: scale(1.1); /* Removed rotateY which caused mirroring */
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.card-mini span {
  transition: var(--transition);
}

.card-mini.revealed span {
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
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

/* Perfect Consensus Effect */
.consensus-reveal {
  position: relative;
  padding: 24px;
  border-radius: 20px;
}

@keyframes radiant-pulse {
  0%, 100% {
    box-shadow: 
      0 0 15px rgba(168, 85, 247, 0.2),
      0 0 30px rgba(168, 85, 247, 0.15),
      0 0 45px rgba(168, 85, 247, 0.1);
    transform: scale(1);
  }
  50% {
    box-shadow: 
      0 0 25px rgba(168, 85, 247, 0.3),
      0 0 45px rgba(168, 85, 247, 0.2),
      0 0 65px rgba(168, 85, 247, 0.15);
    transform: scale(1.02);
  }
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

@keyframes float-up {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-200px) translateX(var(--drift));
    opacity: 0;
  }
}

.perfect-consensus {
  animation: radiant-pulse 2s ease-in-out infinite;
}

.perfect-consensus::before,
.perfect-consensus::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 120%;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 50%;
  animation: ripple 2.5s ease-out infinite;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.8);
  opacity: 0;
}

.perfect-consensus::after {
  animation-delay: 1s;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, rgba(255, 215, 0, 1) 0%, rgba(168, 85, 247, 0) 70%);
  border-radius: 50%;
  bottom: 50%;
  left: 50%;
  animation: float-up 3s ease-in infinite;
  opacity: 0;
}

.particle:nth-child(1) { --drift: -30px; animation-delay: 0s; left: 40%; }
.particle:nth-child(2) { --drift: 20px; animation-delay: 0.3s; left: 60%; }
.particle:nth-child(3) { --drift: -15px; animation-delay: 0.6s; left: 45%; }
.particle:nth-child(4) { --drift: 25px; animation-delay: 0.9s; left: 55%; }
.particle:nth-child(5) { --drift: -20px; animation-delay: 1.2s; left: 50%; }
.particle:nth-child(6) { --drift: 15px; animation-delay: 1.5s; left: 48%; }
.particle:nth-child(7) { --drift: -25px; animation-delay: 1.8s; left: 52%; }
.particle:nth-child(8) { --drift: 10px; animation-delay: 2.1s; left: 58%; }

.consensus-reveal p {
  color: var(--color-primary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.8rem;
  margin-bottom: 12px;
  animation: revealText 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stats-box {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-item span {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
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

.btn-warning {
  background: rgba(251, 146, 60, 0.1);
  border: 1px solid rgba(251, 146, 60, 0.3);
  color: rgb(251, 146, 60);
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-warning:hover {
  background: rgba(251, 146, 60, 0.2);
  border-color: rgba(251, 146, 60, 0.5);
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
