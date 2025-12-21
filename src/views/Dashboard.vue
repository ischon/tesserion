<script setup>
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { rtdb } from '../firebase'
import { ref as dbRef, query, orderByChild, equalTo, onValue, set, get, serverTimestamp, child } from 'firebase/database'

const authStore = useAuthStore()
const router = useRouter()
const rooms = ref([])
const newRoomName = ref('')
const isCreating = ref(false)
const sequenceType = ref('fibonacci')
const fibValues = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]
const fibMax = parseInt(import.meta.env.VITE_FIB_SEQ_MAX) || 8
const availableFibValues = fibValues.filter(v => v <= fibMax)

const fibIndex = ref(availableFibValues.indexOf(parseInt(import.meta.env.VITE_FIB_SEQ_DEFAULT) || 8))
if (fibIndex.value === -1) fibIndex.value = availableFibValues.length - 1

const sequentialMax = ref(parseInt(import.meta.env.VITE_SEQ_DEFAULT) || 10)
const globalSeqMax = parseInt(import.meta.env.VITE_SEQ_MAX) || 20

const tshirtValues = (import.meta.env.VITE_TSHIRT_VALUES || 'XXS,XS,S,M,L,XL,XXL').split(',')
const tshirtIndex = ref(0) // Not used for selection anymore since slider is gone

const maxValue = computed(() => {
  if (sequenceType.value === 'fibonacci') {
    return availableFibValues[fibIndex.value]
  }
  if (sequenceType.value === 'tshirt') {
    return tshirtValues[tshirtValues.length - 1] // Return the largest size as indicator
  }
  return sequentialMax.value
})

const changeSequence = (type) => {
  sequenceType.value = type
  if (type === 'fibonacci') {
    fibIndex.value = availableFibValues.indexOf(parseInt(import.meta.env.VITE_FIB_SEQ_DEFAULT) || 8)
    if (fibIndex.value === -1) fibIndex.value = availableFibValues.length - 1
  } else if (type === 'tshirt') {
    // No specific index needed for tshirt anymore
  } else {
    sequentialMax.value = parseInt(import.meta.env.VITE_SEQ_DEFAULT) || 10
  }
}


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

const generateRoomId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous O, 0, I, 1
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const createRoom = async () => {
  if (isCreating.value) return
  
  isCreating.value = true
  try {
    const finalRoomName = newRoomName.value.trim() || `${authStore.user.displayName}'s Room`
    const roomsRef = dbRef(rtdb, 'rooms')
    let customId = generateRoomId()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 5) {
      const snapshot = await get(child(roomsRef, customId))
      if (!snapshot.exists()) {
        isUnique = true
      } else {
        customId = generateRoomId()
        attempts++
      }
    }

    if (!isUnique) throw new Error("Could not generate unique ID")

    const newRoomRef = child(roomsRef, customId)
    
    await set(newRoomRef, {
      name: finalRoomName,
      domain: authStore.userDomain,
      createdBy: authStore.user.uid,
      creatorName: authStore.user.displayName,
      createdAt: serverTimestamp(),
      showVotes: false,
      votes: {},
      sequenceType: sequenceType.value,
      maxValue: maxValue.value
    })
    
    router.push({ name: 'room', params: { id: customId } })
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
        <div class="ritual-config">
          <div class="input-group">
            <input 
              v-model="newRoomName" 
              type="text" 
              placeholder="Room Name (e.g. Sprint 24 Planning)" 
              @keyup.enter="createRoom"
            />
          </div>
          
          <div class="ritual-config">
            <div class="config-item">
              <label>Sequence Type</label>
              <div class="segmented-control">
                <button 
                  :class="{ active: sequenceType === 'fibonacci' }" 
                  @click="changeSequence('fibonacci')"
                >Fibonacci</button>
                <button 
                  :class="{ active: sequenceType === 'sequential' }" 
                  @click="changeSequence('sequential')"
                >Sequential</button>
                <button 
                  :class="{ active: sequenceType === 'tshirt' }" 
                  @click="changeSequence('tshirt')"
                >T-Shirt</button>
              </div>
            </div>
            
            <div v-if="sequenceType !== 'tshirt'" class="config-item">
              <label>Max Value: {{ maxValue }}</label>
              <input 
                v-if="sequenceType === 'fibonacci'"
                v-model.number="fibIndex" 
                type="range" 
                min="0" 
                :max="availableFibValues.length - 1" 
                step="1"
              />
              <input 
                v-else
                v-model.number="sequentialMax" 
                type="range" 
                min="1" 
                :max="globalSeqMax" 
                step="1"
              />
            </div>
          </div>

          <button @click="createRoom" :disabled="isCreating" class="btn-primary w-full mt-4">
            {{ isCreating ? 'Creating...' : 'Begin the Ritual' }}
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

.ritual-config {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 24px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.segmented-control {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.segmented-control button {
  flex: 1;
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: var(--transition);
}

.segmented-control button.active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.w-full { width: 100%; }
.mt-4 { margin-top: 16px; }

.input-group input {
  flex: 1;
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  margin: 10px 0;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  border: none;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  border: none;
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
