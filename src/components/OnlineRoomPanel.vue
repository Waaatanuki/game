<script setup lang="ts">
import type { TagColor } from 'animal-island-vue'
import type { ConnectionStatus } from '~/composables/useWebRTC'
import { Button as IslandButton, Input as IslandInput, Tag as IslandTag, Title as IslandTitle, Notification } from 'animal-island-vue'

const props = defineProps<{
  rtc: ReturnType<typeof useWebRTC>
  hostLabel: string
  guestLabel: string
}>()
const emit = defineEmits<{ join: [] }>()

const joinRoomInput = ref('')
const statusLabels: Record<ConnectionStatus, string> = {
  'idle': '未连接',
  'creating': '创建中',
  'awaiting-peer': '等待加入',
  'connecting': '连接中',
  'connected': '已连接',
  'closed': '已断开',
  'error': '连接失败',
}
const statusColor = computed<TagColor>(() => props.rtc.status.value === 'connected'
  ? 'app-green'
  : props.rtc.status.value === 'error' ? 'app-red' : 'app-blue')
const canJoin = computed(() => joinRoomInput.value.trim().length === 6
  && props.rtc.status.value !== 'connecting'
  && props.rtc.status.value !== 'connected')

function joinRoom() {
  if (canJoin.value)
    props.rtc.joinRoom(joinRoomInput.value)
}

async function copyRoomId() {
  try {
    await navigator.clipboard.writeText(props.rtc.roomId.value)
    Notification.success('房号已复制到剪贴板')
  }
  catch {
    Notification.error('复制失败，请手动选择房号')
  }
}
</script>

<template>
  <GamePanel>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <IslandTitle variant="tab" color="app-blue" size="small">
          联机对战
        </IslandTitle>
        <IslandTag size="small" :color="statusColor" variant="soft">
          {{ statusLabels[rtc.status.value] }}
        </IslandTag>
        <IslandButton v-if="rtc.role.value" size="small" danger @click="rtc.reset()">
          断开并重置
        </IslandButton>
      </div>
    </template>

    <RoomNotice v-if="rtc.errorMessage.value" type="error" :title="rtc.errorMessage.value" class="mb-3" />
    <p class="m-0 text-xs text-[color:var(--app-text-muted)] leading-[1.7]">
      创建房间后，把 6 位房号分享给朋友即可联机。主机{{ hostLabel }}先手。
    </p>

    <div v-if="!rtc.role.value" class="mt-4 flex flex-wrap gap-3">
      <IslandButton type="primary" @click="rtc.createHost()">
        <template #icon>
          <i class="i-carbon-add-comment" />
        </template>
        创建房间
      </IslandButton>
      <IslandButton @click="emit('join')">
        <template #icon>
          <i class="i-carbon-link" />
        </template>
        加入房间
      </IslandButton>
    </div>

    <div v-if="rtc.role.value === 'host'" class="mt-4">
      <div v-if="rtc.roomId.value" class="flex flex-wrap items-center gap-3">
        <code class="room-code">{{ rtc.roomId.value }}</code>
        <IslandButton size="small" aria-label="复制房号" @click="copyRoomId">
          <template #icon>
            <i class="i-carbon-copy" />
          </template>
          复制房号
        </IslandButton>
      </div>
      <p v-else-if="rtc.status.value === 'creating'" role="status" class="flex items-center gap-2 text-sm">
        <i class="i-carbon-circle-dash animate-spin" /> 正在创建房间…
      </p>
      <RoomNotice v-if="rtc.status.value === 'awaiting-peer'" class="mt-4" title="正在等待对方加入…" />
      <RoomNotice v-else-if="rtc.status.value === 'connected'" type="success" class="mt-4" title="朋友已加入，可以开始对局" />
    </div>

    <form v-if="rtc.role.value === 'guest'" class="mt-4" @submit.prevent="joinRoom">
      <div class="flex flex-wrap items-center gap-3">
        <label class="room-input">
          <span class="sr-only">6 位房号</span>
          <IslandInput
            v-model="joinRoomInput"
            placeholder="输入 6 位房号"
            :max-length="6"
            :disabled="rtc.status.value === 'connecting' || rtc.status.value === 'connected'"
          />
        </label>
        <IslandButton type="primary" html-type="submit" :disabled="!canJoin" :loading="rtc.status.value === 'connecting'">
          加入房间
        </IslandButton>
      </div>
      <RoomNotice v-if="rtc.status.value === 'connecting'" class="mt-4" title="正在加入房间，请稍候…" />
      <RoomNotice
        v-else-if="rtc.status.value === 'connected'"
        class="mt-4"
        type="success"
        :title="`已加入房间 ${rtc.roomId.value}`"
        :description="`你当前${guestLabel}后手，可以开始对局。`"
      />
    </form>
  </GamePanel>
</template>

<style scoped>
.room-input {
  flex: 1 1 160px;
  min-width: 0;
}
.room-code {
  padding: 8px 16px;
  border: 2px dashed var(--app-border);
  border-radius: 14px;
  color: var(--app-accent);
  font-size: 20px;
  letter-spacing: 0.15em;
  user-select: all;
}
</style>
