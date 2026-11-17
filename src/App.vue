<script setup lang="ts">
import { Background as IslandBackground, Button as IslandButton, Icon as IslandIcon, NotificationContainer } from 'animal-island-vue'

const { mode, isDark, cycle } = useTheme()

const themeIcon = computed(() => {
  if (mode.value === 'system')
    return 'i-carbon-screen'
  return mode.value === 'dark' ? 'i-carbon-moon' : 'i-carbon-sun'
})
const themeLabel = computed(() => mode.value === 'system' ? '跟随系统' : mode.value === 'dark' ? '深色' : '浅色')
</script>

<template>
  <IslandBackground type="dots-dark-green" class="app-shell" :class="{ dark: isDark }">
    <header class="app-header">
      <div class="page-wrap flex items-center justify-between !py-4">
        <router-link to="/" class="flex items-center gap-2 text-[color:var(--app-text)] no-underline">
          <span class="brand-mark">
            <IslandIcon name="Leaf" :size="30" />
          </span>
          <span class="brand-name">小游戏岛<small>LITTLE GAME ISLAND</small></span>
        </router-link>

        <div class="flex items-center gap-2">
          <span class="header-note">快乐靠岸，随时开玩</span>
          <IslandButton size="small" @click="cycle">
            <template #icon>
              <i :class="themeIcon" />
            </template>
            {{ themeLabel }}
          </IslandButton>
        </div>
      </div>
    </header>

    <NotificationContainer />

    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </IslandBackground>
</template>

<style scoped>
.app-shell.animal-background {
  min-height: 100vh;
  color: var(--app-text);
  background-color: var(--app-bg);
  transition:
    background 0.3s ease,
    color 0.3s ease;
}
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--app-header-bg);
  border-bottom: 2px dashed #c9d2b7;
}
.brand-mark {
  display: inline-flex;
  width: 46px;
  height: 46px;
  border: 2px solid #b5cba5;
  border-radius: 50% 45% 50% 40%;
  transform: rotate(-8deg);
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #e8ecd3;
  color: var(--app-accent);
}
.brand-name {
  display: flex;
  flex-direction: column;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.brand-name small {
  margin-top: 2px;
  color: #93a17c;
  font-size: 8px;
  letter-spacing: 0.12em;
}
.header-note {
  margin-right: 18px;
  color: #8b987b;
  font-size: 12px;
}
@media (max-width: 600px) {
  .header-note {
    display: none;
  }
  .brand-name {
    font-size: 17px;
  }
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
