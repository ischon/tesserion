<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <div class="main-content">
      <RouterView />
    </div>
    <footer class="app-footer">
      <div class="footer-content">
        <div class="copyright">
          © 2025 <span class="author">Ian Schön</span>
        </div>
        <a href="https://github.com/ischon/tesserion" target="_blank" rel="noopener" class="github-link">
          <svg class="github-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>
    </footer>
  </div>
</template>

<style>
:root {
  --color-bg: #0b0e14;
  --color-surface: #1a1f29;
  --color-primary: #6366f1;
  --color-secondary: #a855f7;
  --color-text: #e2e8f0;
  --color-text-muted: #94a3b8;
  --border-radius: 12px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.app-footer {
  flex-shrink: 0;
  padding: 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(11, 14, 20, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.author {
  color: var(--color-text);
  font-weight: 500;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: var(--transition);
  padding: 4px 0;
}

.github-link:hover {
  color: var(--color-primary);
  transform: translateY(-1px);
}

.github-icon {
  transition: transform 0.3s ease;
}

.github-link:hover .github-icon {
  transform: rotate(360deg);
}

@media (max-width: 600px) {
  .footer-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
