<script setup lang="ts">
import { Card as IslandCard, Divider as IslandDivider } from 'animal-island-vue'
</script>

<template>
  <IslandCard pattern="default" class="game-panel">
    <div v-if="$slots.header" class="game-panel-header">
      <slot name="header" />
      <IslandDivider class="mt-3" />
    </div>
    <slot />
  </IslandCard>
</template>

<style scoped>
.game-panel {
  min-width: 0;
  border: 2px solid #d7cfb0;
  border-radius: 12px 24px 12px 24px;
  box-shadow: 0 5px 0 #81936f22;
  padding: 22px;
}
.game-panel-header {
  margin-bottom: 16px;
}
</style>
