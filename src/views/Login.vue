<script setup>
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async (provider = 'google') => {
  await authStore.login(provider)
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
        
        <button @click="handleLogin('google')" class="btn-primary login-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="google-icon" />
          Sign in with Google
        </button>

        <button @click="handleLogin('microsoft')" class="btn-microsoft login-btn">
          <div class="microsoft-icon-wrapper">
            <svg class="microsoft-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v23H0zM12 12h11v11H12z"/>
              <path fill="#f35325" d="M1 1h9v9H1z"/>
              <path fill="#81bc06" d="M12 1h9v9h-9z"/>
              <path fill="#05a6f0" d="M1 12h9v9H1z"/>
              <path fill="#ffba08" d="M12 12h9v9h-9z"/>
            </svg>
          </div>
          Sign in with Microsoft
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
  padding: 14px 24px;
  border-radius: 100px;
}

.google-icon {
  width: 24px;
  height: 24px;
  background: white;
  padding: 2px;
  border-radius: 50%;
}

.btn-microsoft {
  margin-top: 16px;
  background: linear-gradient(135deg, #0078d4, #00a4ef);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 100px;
  box-shadow: 0 4px 15px rgba(0, 120, 212, 0.3);
}

.btn-microsoft:hover {
  background: linear-gradient(135deg, #1088e4, #10b4ff);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 120, 212, 0.5);
}

.microsoft-icon-wrapper {
  width: 24px;
  height: 24px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 4px;
}

.microsoft-icon {
  width: 14px;
  height: 14px;
}

.footer {
  margin-top: 40px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.2);
}
</style>
