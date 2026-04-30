<script setup lang="ts">
import type { Stone } from '~/games/gomoku/logic'
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

const joinRoomInput = ref('')

const stats = reactive({
  black: 0,
  white: 0,
  draw: 0,
})

const turnLabel = computed(() => {
  if (status.value === 'win')
    return `${current.value === 1 ? '白' : '黑'}方胜出 🎉`
  if (status.value === 'draw')
    return '和棋'
  return `${current.value === 1 ? '黑' : '白'}方落子`
})

const modeOptions: Array<{ value: GameMode, label: string, hint: string }> = [
  { value: 'pvp-local', label: '本地双人', hint: '同一台设备轮流落子' },
  { value: 'pve', label: '人机对战', hint: '与简易 AI 对弈' },
  { value: 'online', label: '联机对战', hint: '基于 WebRTC 直连，无需服务器' },
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
    return true
  }
  if (isFull(board.value)) {
    status.value = 'draw'
    stats.draw++
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

onMounted(() => {
  newGame()
})
</script>

<template>
  <div class="page-wrap">
    <header class="mb-5 flex items-center justify-between gap-3">
      <div>
        <p class="m-0 text-xs text-[color:var(--app-text-muted)] font-bold tracking-[0.18em] uppercase">
          Gomoku · 五子棋
        </p>
        <h1 class="m-0 text-2xl text-[color:var(--app-text)] sm:text-3xl">
          15×15 · 五连即胜
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

          <div v-if="mode === 'pve'" class="mt-4">
            <div class="mb-2 text-sm text-[color:var(--app-text-muted)]">
              选择 AI 持子
            </div>
            <el-radio-group v-model="aiSelf">
              <el-radio-button :value="2">
                AI 执白（你先手）
              </el-radio-button>
              <el-radio-button :value="1">
                AI 执黑（你后手）
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
            通过 WebRTC 端到端直连，使用公共信令服务器交换房号。主机执黑先手。
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

          <!-- 主机视角：展示房号 -->
          <template v-if="rtc.role.value === 'host'">
            <div class="mt-4">
              <div class="room-id-pill">
                <span v-if="rtc.roomId.value" class="select-none font-mono">房号: {{ rtc.roomId.value }}</span>
                <el-icon v-else class="is-loading">
                  <i class="i-carbon-circle-dash" />
                </el-icon>
                <i ml-2 cursor-pointer text-base class="i-carbon-copy" @click="copyText(rtc.roomId.value)" />
              </div>
              <div mt-4>
                <el-alert v-if="rtc.status.value === 'awaiting-peer'" :closable="false">
                  正在等待对方加入…
                </el-alert>
              </div>
            </div>
          </template>

          <!-- 客机视角：输入房号 -->
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
  --cell: clamp(20px, 4.2vw, 36px);
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
