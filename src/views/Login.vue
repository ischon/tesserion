<script setup>
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  await authStore.login()
  if (authStore.isAuthenticated) {
    router.push({ name: 'dashboard' })
  }
}
</script>

<template>
  <div class="login-view container">
    <div class="login-card glass">
      <div class="logo-container">
        <img src="/logo.png" alt="Tesserion Logo" class="login-logo" />
        <h1>Tesserion</h1>
        <p class="subtitle">Revealing the Hidden Value</p>
      </div>
      
      <div class="login-content">
        <p>Enter the ritual of consensus. Sync with your team and uncover the truth of the sprint.</p>
        
        <button @click="handleLogin" class="btn-primary login-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="google-icon" />
          Sign in with Google
        </button>
      </div>
      
      <div class="footer">
        <p>Built for teams who seek clarity.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.login-card {
  padding: 48px;
  border-radius: 24px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.8s ease-out;
  position: relative;
  /* margin-top: 40px; removed as it's no longer half-above */
}

.login-logo {
  width: 120px;
  height: auto;
  margin: 0 auto 24px;
  display: block;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.logo-container h1 {
  font-size: 3rem;
  margin: 0;
  background: linear-gradient(135deg, #fff, var(--color-text-muted));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.05em;
}

.subtitle {
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 8px;
}

.login-content {
  margin-top: 40px;
}

.login-content p {
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 32px;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  font-size: 1.1rem;
}

.google-icon {
  width: 24px;
  height: 24px;
  background: white;
  padding: 2px;
  border-radius: 50%;
}

.footer {
  margin-top: 40px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.2);
}
</style>
