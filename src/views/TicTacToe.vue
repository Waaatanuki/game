<script setup lang="ts">
import type { Stone } from '~/games/tictactoe/logic'
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

const joinRoomInput = ref('')

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
    ElMessage.success(`${stoneLabel(win.stone)} 胜出 🎉${extra}`)
    return true
  }
  if (isFull(board.value)) {
    status.value = 'draw'
    stats.draw++
    ElMessage.info('平局')
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
      return ElMessage.warning('还未轮到你或连接未就绪')
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
      ElMessage.success(`已成功加入房间 ${rtc.roomId.value}`)
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
      return ElMessage.warning('未连接，无法同步重开')
    rtc.send({ type: 'reset' })
  }
  newGame()
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  }
  catch {
    ElMessage.error('复制失败，请手动选择文本')
  }
}

function isWinCell(r: number, c: number) {
  return winLine.value.some(p => p[0] === r && p[1] === c)
}

onMounted(newGame)
</script>

<template>
  <div class="page-wrap">
    <header class="mb-5 flex items-center justify-between gap-3">
      <div>
        <p class="m-0 text-xs text-[color:var(--app-text-muted)] font-bold tracking-[0.18em] uppercase">
          Tic Tac Toe · 井字棋
        </p>
        <h1 class="m-0 text-2xl text-[color:var(--app-text)] sm:text-3xl">
          3×3 · 三连即胜
        </h1>
      </div>
      <el-button text @click="$router.push('/')">
        <template #icon>
          <i class="i-carbon-arrow-left" />
        </template>
        返回大厅
      </el-button>
    </header>

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
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="flex items-center justify-between">
              <div fc gap-2>
                <span class="font-semibold">对局状态</span>
                <el-tag v-if="aiThinking" type="warning" effect="light">
                  AI 思考中…
                </el-tag>
              </div>
              <el-tag
                :type="status === 'win' ? 'success' : status === 'draw' ? 'info' : 'warning'"
                effect="light"
                round
              >
                {{ turnLabel }}
              </el-tag>
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
            <el-button type="primary" w-full @click="requestReset">
              <template #icon>
                <i class="i-carbon-restart" />
              </template>
              重新开始
            </el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="panel-card">
          <template #header>
            <span class="font-semibold">游戏模式</span>
          </template>
          <el-radio-group v-model="mode" w-full flex items-center justify-evenly gap-6>
            <el-radio
              v-for="opt in modeOptions"
              :key="opt.value"
              :value="opt.value"
              class="items-start !m-0 !h-auto"
            >
              <span class="font-medium">{{ opt.label }}</span>
            </el-radio>
          </el-radio-group>

          <div v-if="mode === 'pve'" class="mt-4 fc">
            <el-radio-group v-model="aiSelf">
              <el-radio-button :value="2">
                AI 执 O（你先手）
              </el-radio-button>
              <el-radio-button :value="1">
                AI 执 X（你后手）
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-card>

        <el-card v-if="mode === 'online'" shadow="never" class="panel-card">
          <template #header>
            <div class="flex items-center justify-between">
              <div fc gap-2>
                <span class="font-semibold">联机对战</span>
                <el-button
                  v-if="rtc.role.value"
                  size="small"
                  plain
                  type="danger"
                  @click="rtc.reset()"
                >
                  断开并重置
                </el-button>
              </div>
              <el-tag
                size="small"
                :type="rtc.status.value === 'connected' ? 'success' : rtc.status.value === 'error' ? 'danger' : 'info'"
                effect="light"
              >
                {{ rtc.status.value }}
              </el-tag>
            </div>
          </template>

          <el-alert
            v-if="rtc.errorMessage.value"
            type="error"
            :title="rtc.errorMessage.value"
            class="mb-3"
            :closable="false"
            show-icon
          />

          <p class="m-0 text-xs text-[color:var(--app-text-muted)] leading-[1.7]">
            通过 WebRTC 端到端直连，使用公共信令服务器交换房号。主机执 X 先手。
          </p>

          <div v-if="!rtc.role.value" class="mt-3 flex flex-wrap gap-2">
            <el-button type="primary" @click="rtc.createHost()">
              <template #icon>
                <i class="i-carbon-add-comment" />
              </template>
              创建房间
            </el-button>
            <el-button @click="rtc.role.value = 'guest'">
              <template #icon>
                <i class="i-carbon-link" />
              </template>
              加入房间
            </el-button>
          </div>

          <template v-if="rtc.role.value === 'host'">
            <div class="mt-4">
              <div class="room-id-pill">
                <template v-if="rtc.roomId.value">
                  <span class="select-none font-mono">房号: {{ rtc.roomId.value }}</span>
                  <i ml-2 cursor-pointer text-base class="i-carbon-copy" @click="copyText(rtc.roomId.value)" />
                </template>
                <el-icon v-else class="is-loading">
                  <i class="i-carbon-circle-dash" />
                </el-icon>
              </div>
              <div mt-4>
                <el-alert v-if="rtc.status.value === 'awaiting-peer'" :closable="false">
                  正在等待对方加入…
                </el-alert>
              </div>
            </div>
          </template>

          <template v-if="rtc.role.value === 'guest'">
            <div class="mt-2 fc gap-10">
              <el-input
                v-model="joinRoomInput"
                placeholder=" 输入主机分享的 6 位房号"
                maxlength="8"
                @keyup.enter="rtc.joinRoom(joinRoomInput)"
              />
              <el-button
                type="primary"
                :disabled="!joinRoomInput || rtc.status.value === 'connecting'"
                :loading="rtc.status.value === 'connecting'"
                @click="rtc.joinRoom(joinRoomInput)"
              >
                加入房间
              </el-button>
            </div>

            <div v-if="rtc.status.value === 'connecting'" class="mt-4">
              <el-alert
                type="info"
                :closable="false"
                show-icon
                title="正在加入房间，请稍候…"
              />
            </div>

            <div v-else-if="rtc.status.value === 'connected'" class="mt-4">
              <el-alert
                type="success"
                :closable="false"
                show-icon
                :title="`已加入房间 ${rtc.roomId.value}`"
                description="你当前执 O 后手，可以开始对局。"
              />
            </div>
          </template>
        </el-card>
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
  --cell: clamp(80px, 14vw, 120px);
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
.room-id-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  padding: 12px 20px;
  border-radius: 14px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.32em;
  font-family: 'SF Mono', 'JetBrains Mono', Menlo, monospace;
  user-select: all;
}
</style>
