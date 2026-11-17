<script setup lang="ts">
import type { Stone } from '~/games/gomoku/logic'
import { Button as IslandButton, Radio as IslandRadio, Tag as IslandTag, Title as IslandTitle, Notification } from 'animal-island-vue'
import { aiMove, BOARD_SIZE, checkWin, createBoard, isFull } from '~/games/gomoku/logic'

type GameMode = 'pvp-local' | 'pve' | 'online'
type GameStatus = 'playing' | 'win' | 'draw'

const mode = ref<GameMode>('pvp-local')
const board = ref(createBoard())
const current = ref<Stone>(1) // 1=黑 2=白
const status = ref<GameStatus>('playing')
const winLine = ref<Array<[number, number]>>([])
const lastMove = ref<[number, number] | null>(null)
const moveCount = ref(0)

const aiSelf = ref<Stone>(2) // AI 默认执白
const aiThinking = ref(false)

const rtc = useWebRTC()
const onlineMyStone = computed<Stone>(() => rtc.role.value === 'host' ? 1 : 2)
const onlineCanMove = computed(() => rtc.status.value === 'connected' && current.value === onlineMyStone.value)

const stats = reactive({
  black: 0,
  white: 0,
  draw: 0,
})

const turnLabel = computed(() => {
  if (status.value === 'win')
    return `${current.value === 1 ? '黑' : '白'}方胜出 🎉`
  if (status.value === 'draw')
    return '和棋'
  return `${current.value === 1 ? '黑' : '白'}方落子`
})

const modeOptions: Array<{ value: GameMode, label: string }> = [
  { value: 'pvp-local', label: '本地双人' },
  { value: 'pve', label: '人机对战' },
  { value: 'online', label: '联机对战' },
]

function newGame() {
  board.value = createBoard()
  current.value = 1
  status.value = 'playing'
  winLine.value = []
  lastMove.value = null
  moveCount.value = 0
  aiThinking.value = false
}

function applyMove(r: number, c: number, stone: Stone): boolean {
  if (status.value !== 'playing')
    return false
  if (board.value[r][c] !== 0)
    return false
  // 创建新引用以触发响应式
  const next = board.value.map(row => row.slice()) as typeof board.value
  next[r][c] = stone
  board.value = next
  lastMove.value = [r, c]
  moveCount.value++

  const line = checkWin(board.value, r, c)
  if (line) {
    status.value = 'win'
    winLine.value = line
    if (stone === 1)
      stats.black++
    else
      stats.white++
    const winnerName = stone === 1 ? '黑方' : '白方'
    let extra = ''
    if (mode.value === 'pve')
      extra = stone === aiSelf.value ? '（AI 获胜）' : '（你赢了）'
    else if (mode.value === 'online' && rtc.status.value === 'connected')
      extra = stone === onlineMyStone.value ? '（你赢了）' : '（对手获胜）'
    Notification.success(`${winnerName}胜出 🎉${extra}`)
    return true
  }
  if (isFull(board.value)) {
    status.value = 'draw'
    stats.draw++
    Notification.info('和棋')
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
    const move = aiMove(board.value, aiSelf.value)
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

// 联机消息处理
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

onMounted(() => {
  newGame()
})
</script>

<template>
  <div class="page-wrap">
    <GamePageHeader title="五子棋" subtitle="15×15 · 五连即胜" color="app-yellow" icon="Bear" />

    <div class="grid gap-5 lg:grid-cols-[auto_1fr]">
      <section class="board-wrap">
        <div class="board" :style="{ '--size': BOARD_SIZE }">
          <template v-for="(row, r) in board" :key="r">
            <button
              v-for="(cell, c) in row"
              :key="`${r}-${c}`"
              class="cell"
              :class="{
                'cell-last': lastMove && lastMove[0] === r && lastMove[1] === c,
                'cell-win': winLine.some(p => p[0] === r && p[1] === c),
              }"
              :disabled="status !== 'playing' || cell !== 0"
              @click="handleCellClick(r, c)"
            >
              <span v-if="cell" class="stone" :class="cell === 1 ? 'stone-black' : 'stone-white'" />
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
                黑胜
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ stats.black }}
              </div>
            </div>
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                白胜
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ stats.white }}
              </div>
            </div>
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                和棋
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
                { value: 2, label: 'AI 执白（你先手）' },
                { value: 1, label: 'AI 执黑（你后手）' },
              ]"
              aria-label="AI 先后手"
            />
          </div>
        </GamePanel>

        <OnlineRoomPanel v-if="mode === 'online'" :rtc="rtc" host-label="执黑" guest-label="执白" @join="rtc.role.value = 'guest'" />
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
  --cell: clamp(16px, calc((100vw - 70px) / 15), 36px);
  --line: var(--gomoku-line);
  display: grid;
  grid-template-columns: repeat(var(--size), var(--cell));
  grid-template-rows: repeat(var(--size), var(--cell));
  position: relative;
  background-color: var(--gomoku-board);
  /* 网格线偏移到每个 cell 的中心，从而与按钮中心对齐 */
  background-image:
    linear-gradient(to right, var(--line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--line) 1px, transparent 1px);
  background-size: var(--cell) var(--cell);
  background-position: calc(var(--cell) / 2) calc(var(--cell) / 2);
  background-repeat: repeat;
  border-radius: 8px;
  box-sizing: content-box;
}
.cell {
  width: var(--cell);
  height: var(--cell);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell:disabled {
  cursor: default;
}
.cell:hover:not(:disabled)::after {
  content: '';
  position: absolute;
  inset: 18%;
  border-radius: 9999px;
  background: var(--app-accent-soft);
}
.cell-last .stone {
  outline: 2px solid var(--app-accent);
  outline-offset: 1px;
}
.cell-win .stone {
  box-shadow:
    0 0 0 3px rgba(255, 196, 0, 0.65),
    0 0 18px rgba(255, 196, 0, 0.4);
}
.stone {
  width: 78%;
  height: 78%;
  border-radius: 9999px;
  display: block;
  position: relative;
  z-index: 1;
}
.stone-black {
  background: radial-gradient(circle at 35% 30%, #555, #000 65%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.stone-white {
  background: radial-gradient(circle at 35% 30%, #fff, #c8c8d0 75%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
</style>
