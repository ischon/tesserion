<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <RouterView />
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
