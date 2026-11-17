<script setup lang="ts">
import type { IconName, TitleColor } from 'animal-island-vue'
import { Button as IslandButton, Icon as IslandIcon, Title as IslandTitle } from 'animal-island-vue'

defineProps<{
  title: string
  subtitle: string
  color: TitleColor
  icon: IconName
}>()
</script>

<template>
  <header class="game-page-header">
    <div class="game-heading">
      <span class="game-mascot"><IslandIcon :name="icon" :size="54" /></span>
      <div>
        <h1>
          <IslandTitle :color="color" variant="layer">
            {{ title }}
          </IslandTitle>
        </h1>
        <p>{{ subtitle }}</p>
      </div>
    </div>
    <IslandButton type="dashed" @click="$router.push('/')">
      <template #icon>
        <IslandIcon name="ArrowLeft" :size="20" />
      </template>
      返回大厅
    </IslandButton>
  </header>
</template>

<style scoped>
.game-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 32px;
}
.game-heading {
  display: flex;
  align-items: center;
  gap: 22px;
}
.game-mascot {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border: 3px solid #fffef1;
  border-radius: 42% 58% 50% 45%;
  background: #e1dfc2;
  box-shadow: 0 4px 0 #aeb99c;
  transform: rotate(-8deg);
}
h1 {
  margin: 0;
  font-size: inherit;
}
p {
  margin: 14px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
}
@media (max-width: 480px) {
  .game-page-header {
    gap: 20px;
  }
  .game-heading {
    gap: 16px;
  }
  .game-mascot {
    width: 64px;
    height: 64px;
  }
}
</style>
