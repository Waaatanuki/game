<script setup lang="ts">
import type { AIMove, Pos, Stone } from '~/games/halma/logic'
import { Button as IslandButton, Radio as IslandRadio, Tag as IslandTag, Title as IslandTitle, Notification } from 'animal-island-vue'
import {
  aiMove,
  checkWin,
  createBoard,
  PLAYER1_HOME,
  PLAYER2_HOME,
  reachableJumps,
  SIZE,
  stepTargets,
} from '~/games/halma/logic'

type GameMode = 'pvp-local' | 'pve' | 'online'
type Status = 'playing' | 'win'

interface Piece {
  id: number
  stone: Stone
  r: number
  c: number
  hopping: boolean
}

const mode = ref<GameMode>('pvp-local')
const board = ref(createBoard())
const pieces = ref<Piece[]>([])
const current = ref<Stone>(1)
const status = ref<Status>('playing')
const winner = ref<Stone>(0)

const selected = ref<Pos | null>(null)
const animating = ref(false)

const aiSelf = ref<Stone>(2) // AI 默认执蓝
const aiThinking = ref(false)

const rtc = useWebRTC()
const onlineMyStone = computed<Stone>(() => rtc.role.value === 'host' ? 1 : 2)
const onlineCanMove = computed(() => rtc.status.value === 'connected' && current.value === onlineMyStone.value)

const stats = reactive({ red: 0, blue: 0 })

const modeOptions: Array<{ value: GameMode, label: string }> = [
  { value: 'pvp-local', label: '本地双人' },
  { value: 'pve', label: '人机对战' },
  { value: 'online', label: '联机对战' },
]

function initPieces() {
  let id = 0
  const list: Piece[] = []
  for (const [r, c] of PLAYER1_HOME)
    list.push({ id: id++, stone: 1, r, c, hopping: false })
  for (const [r, c] of PLAYER2_HOME)
    list.push({ id: id++, stone: 2, r, c, hopping: false })
  pieces.value = list
}

const stepSet = computed<Set<string>>(() => {
  if (!selected.value)
    return new Set()
  const [r, c] = selected.value
  return new Set(stepTargets(board.value, r, c).map(([sr, sc]) => `${sr},${sc}`))
})

const jumpMap = computed<Map<string, Pos[]>>(() => {
  if (!selected.value)
    return new Map()
  const [r, c] = selected.value
  return reachableJumps(board.value, r, c)
})

function isStepTarget(r: number, c: number) {
  return stepSet.value.has(`${r},${c}`)
}
function isJumpTarget(r: number, c: number) {
  return jumpMap.value.has(`${r},${c}`)
}

function isHome(stone: Stone, r: number, c: number) {
  const home = stone === 1 ? PLAYER1_HOME : PLAYER2_HOME
  return home.some(([hr, hc]) => hr === r && hc === c)
}

function isSelected(r: number, c: number) {
  return !!selected.value && selected.value[0] === r && selected.value[1] === c
}

function findPiece(r: number, c: number) {
  return pieces.value.find(p => p.r === r && p.c === c)
}

function commitMove(fr: number, fc: number, tr: number, tc: number) {
  const next = board.value.map(row => row.slice()) as typeof board.value
  next[tr][tc] = next[fr][fc]
  next[fr][fc] = 0
  board.value = next
}

function endTurn() {
  selected.value = null
  const w = checkWin(board.value)
  if (w) {
    status.value = 'win'
    winner.value = w
    if (w === 1)
      stats.red++
    else
      stats.blue++
    const winnerName = w === 1 ? '红方' : '蓝方'
    let extra = ''
    if (mode.value === 'pve')
      extra = w === aiSelf.value ? '（AI 获胜）' : '（你赢了）'
    else if (mode.value === 'online' && rtc.status.value === 'connected')
      extra = w === onlineMyStone.value ? '（你赢了）' : '（对手获胜）'
    Notification.success(`${winnerName}胜出 🎉${extra}`)
    return
  }
  current.value = current.value === 1 ? 2 : 1
  if (mode.value === 'pve')
    triggerAIIfNeeded()
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function playStep(piece: Piece, tr: number, tc: number) {
  animating.value = true
  const fr = piece.r
  const fc = piece.c
  piece.r = tr
  piece.c = tc
  await wait(260)
  commitMove(fr, fc, tr, tc)
  animating.value = false
  endTurn()
}

async function playJump(piece: Piece, path: Pos[]) {
  animating.value = true
  let fr = piece.r
  let fc = piece.c
  for (const [tr, tc] of path) {
    piece.hopping = false
    await nextTick()
    piece.r = tr
    piece.c = tc
    piece.hopping = true
    await wait(360)
    commitMove(fr, fc, tr, tc)
    fr = tr
    fc = tc
  }
  piece.hopping = false
  animating.value = false
  endTurn()
}

/** 局部执行一段动作（不广播） */
async function performMove(from: Pos, path: Pos[], kind: 'step' | 'jump') {
  const piece = findPiece(from[0], from[1])
  if (!piece)
    return
  if (kind === 'step') {
    const [tr, tc] = path[0]
    await playStep(piece, tr, tc)
  }
  else {
    await playJump(piece, path)
  }
}

function handleClick(r: number, c: number) {
  if (status.value !== 'playing' || animating.value)
    return
  if (mode.value === 'pve' && (current.value === aiSelf.value || aiThinking.value))
    return
  if (mode.value === 'online' && !onlineCanMove.value) {
    if (rtc.status.value === 'connected')
      Notification.warning('还未轮到你')
    return
  }

  const cell = board.value[r][c]
  const myStone
    = mode.value === 'online' ? onlineMyStone.value : current.value

  // 选自己的棋子；若再次点击已选中的棋子则取消
  if (cell === myStone) {
    if (mode.value === 'online' && current.value !== myStone)
      return
    if (isSelected(r, c)) {
      selected.value = null
      return
    }
    selected.value = [r, c]
    return
  }

  if (!selected.value || cell !== 0)
    return
  const [sr, sc] = selected.value

  if (isStepTarget(r, c)) {
    const path: Pos[] = [[r, c]]
    if (mode.value === 'online')
      rtc.send({ type: 'move', payload: { from: [sr, sc], path, kind: 'step' } })
    performMove([sr, sc], path, 'step')
    return
  }
  const path = jumpMap.value.get(`${r},${c}`)
  if (path && path.length) {
    if (mode.value === 'online')
      rtc.send({ type: 'move', payload: { from: [sr, sc], path, kind: 'jump' } })
    performMove([sr, sc], path, 'jump')
  }
}

function triggerAIIfNeeded() {
  if (mode.value !== 'pve' || status.value !== 'playing')
    return
  if (current.value !== aiSelf.value)
    return
  aiThinking.value = true
  setTimeout(async () => {
    const move: AIMove | null = aiMove(board.value, aiSelf.value)
    aiThinking.value = false
    if (!move)
      return endTurn()
    await performMove(move.from, move.path, move.kind)
  }, 260)
}

function newGame() {
  board.value = createBoard()
  initPieces()
  current.value = 1
  status.value = 'playing'
  winner.value = 0
  selected.value = null
  animating.value = false
  aiThinking.value = false
  if (mode.value === 'pve')
    triggerAIIfNeeded()
}

function requestReset() {
  if (mode.value === 'online') {
    if (rtc.status.value !== 'connected')
      return Notification.warning('未连接，无法同步重开')
    rtc.send({ type: 'reset' })
  }
  newGame()
}

watch(mode, () => {
  newGame()
  if (mode.value !== 'online')
    rtc.reset()
})

watch(aiSelf, () => {
  if (mode.value === 'pve') {
    newGame()
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
    const p = msg.payload as { from: Pos, path: Pos[], kind: 'step' | 'jump' }
    performMove(p.from, p.path, p.kind)
  }
  else if (msg.type === 'reset') {
    newGame()
  }
})

const turnLabel = computed(() => {
  if (status.value === 'win')
    return `${winner.value === 1 ? '红' : '蓝'}方胜出 🎉`
  return `${current.value === 1 ? '红' : '蓝'}方行动`
})

onMounted(newGame)
</script>

<template>
  <div class="page-wrap">
    <GamePageHeader title="跳棋" subtitle="9×9 · 先到对岸的小伙伴获胜" color="app-pink" icon="Rabbit" />

    <div class="grid gap-5 lg:grid-cols-[auto_1fr]">
      <section class="board-wrap">
        <div class="board" :style="{ '--size': SIZE }">
          <template v-for="(row, r) in board" :key="r">
            <div
              v-for="(_cell, c) in row"
              :key="`${r}-${c}`"
              class="cell"
              :class="{
                'home-red': isHome(1, r, c),
                'home-blue': isHome(2, r, c),
                'is-target-step': isStepTarget(r, c),
                'is-target-jump': isJumpTarget(r, c),
                'is-selected': isSelected(r, c),
              }"
              @click="handleClick(r, c)"
            />
          </template>
          <div class="pieces-layer">
            <span
              v-for="p in pieces"
              :key="p.id"
              class="piece"
              :style="{
                transform: `translate(calc((var(--cell) + var(--gap)) * ${p.c} + var(--cell) * 0.11), calc((var(--cell) + var(--gap)) * ${p.r} + var(--cell) * 0.11))`,
              }"
            >
              <span
                class="piece-inner"
                :class="[
                  p.stone === 1 ? 'piece-red' : 'piece-blue',
                  { 'is-hopping': p.hopping },
                ]"
              />
            </span>
          </div>
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
                :color="status === 'win' ? 'app-green' : 'app-orange'"
                variant="soft"
              >
                {{ turnLabel }}
              </IslandTag>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                红胜
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ stats.red }}
              </div>
            </div>
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                蓝胜
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ stats.blue }}
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
                { value: 2, label: 'AI 执蓝（你先手）' },
                { value: 1, label: 'AI 执红（你后手）' },
              ]"
              aria-label="AI 先后手"
            />
          </div>
        </GamePanel>

        <OnlineRoomPanel v-if="mode === 'online'" :rtc="rtc" host-label="执红" guest-label="执蓝" @join="rtc.role.value = 'guest'" />
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
  --cell: clamp(20px, calc((100vw - 122px) / 9), 48px);
  --gap: 4px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--size), var(--cell));
  grid-template-rows: repeat(var(--size), var(--cell));
  gap: var(--gap);
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
}
.cell {
  width: var(--cell);
  height: var(--cell);
  border-radius: 9999px;
  background: var(--app-surface-soft);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.2s ease,
    outline-color 0.2s ease;
  outline: 2px solid transparent;
}
.cell.home-red {
  background: rgba(232, 84, 84, 0.18);
}
.cell.home-blue {
  background: rgba(70, 132, 240, 0.18);
}
.cell.is-target-step {
  background: rgba(120, 200, 130, 0.5);
  outline: 2px dashed rgba(80, 160, 90, 0.8);
}
.cell.is-target-jump {
  background: rgba(255, 196, 0, 0.5);
  outline: 2px dashed rgba(255, 160, 0, 0.85);
}
.cell.is-selected {
  transform: scale(1.05);
  outline: 3px solid var(--app-accent);
}
.pieces-layer {
  position: absolute;
  top: 10px;
  left: 10px;
  width: calc(var(--cell) * var(--size) + var(--gap) * (var(--size) - 1));
  height: calc(var(--cell) * var(--size) + var(--gap) * (var(--size) - 1));
  pointer-events: none;
}
.piece {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--cell) * 0.78);
  height: calc(var(--cell) * 0.78);
  display: block;
  transform: translate(0, 0);
  transition: transform 0.32s cubic-bezier(0.34, 1.2, 0.5, 1);
  will-change: transform;
}
.piece-inner {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  transform-origin: 50% 80%;
}
.piece-inner.is-hopping {
  animation: halma-hop 0.36s ease-in-out;
}
@keyframes halma-hop {
  0% {
    transform: translateY(0) scale(1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  }
  45% {
    transform: translateY(-65%) scale(1.08);
    box-shadow: 0 14px 14px rgba(0, 0, 0, 0.18);
  }
  100% {
    transform: translateY(0) scale(1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  }
}
.piece-red {
  background: radial-gradient(circle at 35% 30%, #ff8b8b, #c11919 70%);
}
.piece-blue {
  background: radial-gradient(circle at 35% 30%, #88b6ff, #1c4cba 70%);
}
</style>
