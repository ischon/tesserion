<script setup>
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { rtdb } from '../firebase'
import { ref as dbRef, query, orderByChild, equalTo, onValue, push, set, serverTimestamp } from 'firebase/database'

const authStore = useAuthStore()
const router = useRouter()
const rooms = ref([])
const newRoomName = ref('')
const isCreating = ref(false)

onMounted(() => {
  if (authStore.userDomain) {
    const roomsRef = dbRef(rtdb, 'rooms')
    const q = query(roomsRef, orderByChild('domain'), equalTo(authStore.userDomain))
    
    onValue(q, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        rooms.value = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
      } else {
        rooms.value = []
      }
    })
  }
})

const createRoom = async () => {
  if (!newRoomName.value.trim() || isCreating.value) return
  
  isCreating.value = true
  try {
    const roomsRef = dbRef(rtdb, 'rooms')
    const newRoomRef = push(roomsRef)
    
    await set(newRoomRef, {
      name: newRoomName.value,
      domain: authStore.userDomain,
      createdBy: authStore.user.uid,
      creatorName: authStore.user.displayName,
      createdAt: serverTimestamp(),
      showVotes: false,
      votes: {}
    })
    
    router.push({ name: 'room', params: { id: newRoomRef.key } })
  } catch (error) {
    console.error("Error creating room:", error)
  } finally {
    isCreating.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="dashboard container">
    <header class="dashboard-header">
      <div class="user-info">
        <img :src="authStore.user?.photoURL" alt="Profile" class="avatar" />
        <div>
          <h3>Welcome, {{ authStore.user?.displayName }}</h3>
          <p class="domain-tag">{{ authStore.userDomain }}</p>
        </div>
      </div>
      <button @click="handleLogout" class="btn-text">Sign Out</button>
    </header>

    <main class="dashboard-content">
      <section class="create-room glass">
        <h2>Create a New Ritual</h2>
        <div class="input-group">
          <input 
            v-model="newRoomName" 
            type="text" 
            placeholder="Room Name (e.g. Sprint 24 Planning)" 
            @keyup.enter="createRoom"
          />
          <button @click="createRoom" :disabled="isCreating" class="btn-primary">
            {{ isCreating ? 'Creating...' : 'Create Room' }}
          </button>
        </div>
      </section>

      <section class="rooms-list">
        <h2>Active Rituals in {{ authStore.userDomain }}</h2>
        <div v-if="rooms.length === 0" class="empty-state">
          <p>No active rooms found. Start the first ritual.</p>
        </div>
        <div class="grid">
          <div v-for="room in rooms" :key="room.id" class="room-card glass" @click="router.push({ name: 'room', params: { id: room.id } })">
            <h3>{{ room.name }}</h3>
            <p class="meta">Created by {{ room.creatorName }}</p>
            <div class="room-action">
              <span>Join Ritual</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  padding-top: 40px;
  padding-bottom: 80px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
}

.domain-tag {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.btn-text:hover {
  color: white;
}

.create-room {
  padding: 32px;
  border-radius: 20px;
  margin-bottom: 60px;
}

.input-group {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.input-group input {
  flex: 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.room-card {
  padding: 24px;
  border-radius: 16px;
  cursor: pointer;
  transition: var(--transition);
}

.room-card:hover {
  transform: translateY(-4px);
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.room-card h3 {
  margin: 0 0 8px 0;
}

.meta {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.room-action {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.arrow {
  transition: var(--transition);
}

.room-card:hover .arrow {
  transform: translateX(4px);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}
</style>
