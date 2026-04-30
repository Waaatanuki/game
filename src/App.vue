<script setup lang="ts">
const { mode, isDark, cycle } = useTheme()

const themeIcon = computed(() => {
  if (mode.value === 'system')
    return 'i-carbon-screen'
  return mode.value === 'dark' ? 'i-carbon-moon' : 'i-carbon-sun'
})
const themeLabel = computed(() => mode.value === 'system' ? '跟随系统' : mode.value === 'dark' ? '深色' : '浅色')
</script>

<template>
  <div class="app-shell" :class="{ dark: isDark }">
    <header class="app-header">
      <div class="page-wrap flex items-center justify-between !py-4">
        <router-link to="/" class="flex items-center gap-2 text-[color:var(--app-text)] no-underline">
          <span class="brand-mark">
            <i class="i-carbon-game-console" />
          </span>
          <span class="text-lg font-semibold">小游戏大厅</span>
        </router-link>

        <div class="flex items-center gap-2">
          <el-button round @click="cycle">
            <template #icon>
              <i :class="themeIcon" />
            </template>
            {{ themeLabel }}
          </el-button>
        </div>
      </div>
    </header>

    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  color: var(--app-text);
  background: var(--app-bg);
  transition:
    background 0.3s ease,
    color 0.3s ease;
}
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(14px);
  background: var(--app-header-bg);
  border-bottom: 1px solid var(--app-border);
}
.brand-mark {
  display: inline-flex;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
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
