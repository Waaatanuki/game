<script setup lang="ts">
import type { Stone } from '~/games/tictactoe/logic'
import { Button as IslandButton, Radio as IslandRadio, Tag as IslandTag, Title as IslandTitle, Notification } from 'animal-island-vue'
import { aiMove, checkWin, createBoard, isFull, SIZE } from '~/games/tictactoe/logic'

type GameMode = 'pvp-local' | 'pve' | 'online'
type GameStatus = 'playing' | 'win' | 'draw'

const mode = ref<GameMode>('pvp-local')
const board = ref(createBoard())
const current = ref<Stone>(1) // 1=X 先手 2=O
const status = ref<GameStatus>('playing')
const winLine = ref<Array<[number, number]>>([])
const lastMove = ref<[number, number] | null>(null)

const aiSelf = ref<Stone>(2) // AI 默认执 O 后手
const aiThinking = ref(false)

const rtc = useWebRTC()
const onlineMyStone = computed<Stone>(() => rtc.role.value === 'host' ? 1 : 2)
const onlineCanMove = computed(() => rtc.status.value === 'connected' && current.value === onlineMyStone.value)

const stats = reactive({ x: 0, o: 0, draw: 0 })

const modeOptions: Array<{ value: GameMode, label: string }> = [
  { value: 'pvp-local', label: '本地双人' },
  { value: 'pve', label: '人机对战' },
  { value: 'online', label: '联机对战' },
]

function stoneLabel(s: Stone) {
  return s === 1 ? 'X' : s === 2 ? 'O' : ''
}

const turnLabel = computed(() => {
  if (status.value === 'win')
    return `${stoneLabel(current.value)} 方胜出 🎉`
  if (status.value === 'draw')
    return '平局'
  return `${stoneLabel(current.value)} 方落子`
})

function newGame() {
  board.value = createBoard()
  current.value = 1
  status.value = 'playing'
  winLine.value = []
  lastMove.value = null
  aiThinking.value = false
}

function applyMove(r: number, c: number, stone: Stone): boolean {
  if (status.value !== 'playing')
    return false
  if (board.value[r][c] !== 0)
    return false
  const next = board.value.map(row => row.slice()) as typeof board.value
  next[r][c] = stone
  board.value = next
  lastMove.value = [r, c]

  const win = checkWin(board.value)
  if (win) {
    status.value = 'win'
    winLine.value = win.line
    if (win.stone === 1)
      stats.x++
    else
      stats.o++
    let extra = ''
    if (mode.value === 'pve')
      extra = win.stone === aiSelf.value ? '（AI 获胜）' : '（你赢了）'
    else if (mode.value === 'online' && rtc.status.value === 'connected')
      extra = win.stone === onlineMyStone.value ? '（你赢了）' : '（对手获胜）'
    Notification.success(`${stoneLabel(win.stone)} 胜出 🎉${extra}`)
    return true
  }
  if (isFull(board.value)) {
    status.value = 'draw'
    stats.draw++
    Notification.info('平局')
    return true
  }
  current.value = stone === 1 ? 2 : 1
  return true
}

function handleCellClick(r: number, c: number) {
  if (status.value !== 'playing')
    return

  if (mode.value === 'pve') {
    if (current.value === aiSelf.value || aiThinking.value)
      return
    applyMove(r, c, current.value)
    triggerAIIfNeeded()
    return
  }

  if (mode.value === 'online') {
    if (!onlineCanMove.value)
      return Notification.warning('还未轮到你或连接未就绪')
    const stone = onlineMyStone.value
    if (applyMove(r, c, stone))
      rtc.send({ type: 'move', payload: { r, c, stone } })
    return
  }

  // 本地双人
  applyMove(r, c, current.value)
}

function triggerAIIfNeeded() {
  if (mode.value !== 'pve' || status.value !== 'playing')
    return
  if (current.value !== aiSelf.value)
    return
  aiThinking.value = true
  setTimeout(() => {
    const move = aiMove(board.value.map(r => r.slice()) as typeof board.value, aiSelf.value)
    if (move)
      applyMove(move[0], move[1], aiSelf.value)
    aiThinking.value = false
  }, 220)
}

watch(mode, () => {
  newGame()
  if (mode.value !== 'online')
    rtc.reset()
  if (mode.value === 'pve')
    triggerAIIfNeeded()
})

watch(aiSelf, () => {
  if (mode.value === 'pve') {
    newGame()
    triggerAIIfNeeded()
  }
})

watch(
  [() => rtc.status.value, () => rtc.role.value],
  ([nextStatus, nextRole], [prevStatus]) => {
    if (nextRole === 'guest' && nextStatus === 'connected' && prevStatus !== 'connected')
      Notification.success(`已成功加入房间 ${rtc.roomId.value}`)
  },
)

rtc.onMessage((msg) => {
  if (msg.type === 'move') {
    const p = msg.payload as { r: number, c: number, stone: Stone }
    applyMove(p.r, p.c, p.stone)
  }
  else if (msg.type === 'reset') {
    newGame()
  }
})

function requestReset() {
  if (mode.value === 'online') {
    if (rtc.status.value !== 'connected')
      return Notification.warning('未连接，无法同步重开')
    rtc.send({ type: 'reset' })
  }
  newGame()
}

function isWinCell(r: number, c: number) {
  return winLine.value.some(p => p[0] === r && p[1] === c)
}

onMounted(newGame)
</script>

<template>
  <div class="page-wrap">
    <GamePageHeader title="井字棋" subtitle="3×3 · 三连即胜" color="app-blue" icon="Cat" />

    <div class="grid gap-5 lg:grid-cols-[auto_1fr]">
      <section class="board-wrap">
        <div class="board" :style="{ '--size': SIZE }">
          <template v-for="(row, r) in board" :key="r">
            <button
              v-for="(cell, c) in row"
              :key="`${r}-${c}`"
              class="cell"
              :class="{
                'cell-last': lastMove && lastMove[0] === r && lastMove[1] === c,
                'cell-win': isWinCell(r, c),
              }"
              :disabled="status !== 'playing' || cell !== 0"
              @click="handleCellClick(r, c)"
            >
              <span
                v-if="cell"
                class="mark"
                :class="cell === 1 ? 'mark-x' : 'mark-o'"
              >
                {{ stoneLabel(cell) }}
              </span>
            </button>
          </template>
        </div>
      </section>

      <aside class="flex flex-col gap-4">
        <GamePanel>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div fc gap-2>
                <IslandTitle variant="tab" color="app-teal" size="small">
                  对局状态
                </IslandTitle>
                <IslandTag v-if="aiThinking" color="app-orange" variant="soft">
                  AI 思考中…
                </IslandTag>
              </div>
              <IslandTag
                :color="status === 'win' ? 'app-green' : status === 'draw' ? 'app-blue' : 'app-orange'"
                variant="soft"
              >
                {{ turnLabel }}
              </IslandTag>
            </div>
          </template>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                X 胜
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ stats.x }}
              </div>
            </div>
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                O 胜
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ stats.o }}
              </div>
            </div>
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                平局
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ stats.draw }}
              </div>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <IslandButton type="primary" w-full @click="requestReset">
              <template #icon>
                <i class="i-carbon-restart" />
              </template>
              重新开始
            </IslandButton>
          </div>
        </GamePanel>

        <GamePanel>
          <template #header>
            <IslandTitle variant="tab" color="app-yellow" size="small">
              游戏模式
            </IslandTitle>
          </template>
          <IslandRadio v-model="mode" :options="modeOptions" aria-label="游戏模式" />

          <div v-if="mode === 'pve'" class="mt-4 fc">
            <IslandRadio
              v-model="aiSelf"
              :options="[
                { value: 2, label: 'AI 执 O（你先手）' },
                { value: 1, label: 'AI 执 X（你后手）' },
              ]"
              aria-label="AI 先后手"
            />
          </div>
        </GamePanel>

        <OnlineRoomPanel v-if="mode === 'online'" :rtc="rtc" host-label="执 X" guest-label="执 O" @join="rtc.role.value = 'guest'" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.board-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  align-self: start;
  justify-self: start;
  width: max-content;
  padding: 18px;
  border-radius: 22px;
  background: var(--gomoku-board-bg);
  border: 1px solid var(--app-border);
  box-shadow: 0 24px 40px rgba(40, 23, 8, 0.18);
}
.board {
  --cell: clamp(64px, calc((100vw - 98px) / 3), 120px);
  --gap: 8px;
  display: grid;
  grid-template-columns: repeat(var(--size), var(--cell));
  grid-template-rows: repeat(var(--size), var(--cell));
  gap: var(--gap);
  padding: 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: inset 0 0 0 1px rgba(46, 24, 8, 0.18);
}
html.dark .board {
  background: rgba(20, 22, 36, 0.55);
  box-shadow: inset 0 0 0 1px rgba(255, 220, 170, 0.18);
}
.cell {
  width: var(--cell);
  height: var(--cell);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--cell) * 0.55);
  font-weight: 700;
  color: var(--app-text);
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}
.cell:disabled {
  cursor: default;
}
.cell:hover:not(:disabled) {
  background: var(--app-accent-soft);
  transform: translateY(-2px);
}
.cell-last {
  outline: 2px solid var(--app-accent);
  outline-offset: -2px;
}
.cell-win {
  background: rgba(255, 196, 0, 0.18);
  box-shadow:
    0 0 0 2px rgba(255, 196, 0, 0.7),
    0 0 24px rgba(255, 196, 0, 0.35);
}
.mark {
  display: inline-block;
  line-height: 1;
}
.mark-x {
  color: #d9352e;
}
.mark-o {
  color: #1c4cba;
}
html.dark .mark-x {
  color: #ff8b8b;
}
html.dark .mark-o {
  color: #88b6ff;
}
</style>
