<script setup lang="ts">
import type { TagColor } from 'animal-island-vue'
import { Tag as IslandTag } from 'animal-island-vue'

type NoticeType = 'info' | 'success' | 'error'

withDefaults(defineProps<{
  type?: NoticeType
  title: string
  description?: string
}>(), { type: 'info' })

const colors: Record<NoticeType, TagColor> = {
  info: 'app-blue',
  success: 'app-green',
  error: 'app-red',
}
</script>

<template>
  <div class="room-notice" :role="type === 'error' ? 'alert' : 'status'">
    <IslandTag :color="colors[type]" variant="soft">
      {{ type === 'error' ? '连接失败' : type === 'success' ? '已连接' : '提示' }}
    </IslandTag>
    <div>
      <p class="m-0 text-sm font-semibold">
        {{ title }}
      </p>
      <p v-if="description" class="mb-0 mt-1 text-xs text-[color:var(--app-text-muted)]">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.room-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: var(--app-surface-soft);
  overflow-wrap: anywhere;
}
</style>
