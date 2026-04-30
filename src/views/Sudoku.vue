<script setup lang="ts">
import type { Difficulty, SudokuBoard } from '~/games/sudoku/logic'
import {
  DIFFICULTY_META,
  generatePuzzle,
  isComplete,
  relatedCells,
} from '~/games/sudoku/logic'

interface HistoryEntry {
  r: number
  c: number
  prevValue: number
  prevNotes: number[]
  nextValue: number
  nextNotes: number[]
}

const MAX_MISTAKES = 3

const difficulty = ref<Difficulty>('easy')
const puzzle = ref<SudokuBoard>([])
const solution = ref<SudokuBoard>([])
const board = ref<SudokuBoard>([])
const notes = ref<number[][][]>([])
const selected = ref<[number, number] | null>(null)
const noteMode = ref(false)
const mistakes = ref(0)
const hintsUsed = ref(0)
const status = ref<'playing' | 'win' | 'lose'>('playing')
const history = ref<HistoryEntry[]>([])

const seconds = ref(0)
let timer: number | null = null

function startTimer() {
  stopTimer()
  timer = window.setInterval(() => {
    if (status.value === 'playing')
      seconds.value++
  }, 1000)
}
function stopTimer() {
  if (timer != null) {
    clearInterval(timer)
    timer = null
  }
}

const formattedTime = computed(() => {
  const m = Math.floor(seconds.value / 60).toString().padStart(2, '0')
  const s = (seconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

function emptyNotes(): number[][][] {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [] as number[]))
}

function newGame(diff: Difficulty = difficulty.value) {
  difficulty.value = diff
  const { puzzle: p, solution: s } = generatePuzzle(diff)
  puzzle.value = p
  solution.value = s
  board.value = p.map(row => row.slice())
  notes.value = emptyNotes()
  selected.value = null
  noteMode.value = false
  mistakes.value = 0
  hintsUsed.value = 0
  status.value = 'playing'
  history.value = []
  seconds.value = 0
  startTimer()
}

const selectedValue = computed(() => {
  if (!selected.value)
    return 0
  const [r, c] = selected.value
  return board.value[r]?.[c] ?? 0
})

const relatedSet = computed(() => {
  if (!selected.value)
    return new Set<string>()
  const [r, c] = selected.value
  return new Set(relatedCells(r, c).map(([rr, cc]) => `${rr},${cc}`))
})

const digitCount = computed(() => {
  const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board.value[r]?.[c]
      if (v)
        map[v]++
    }
  }
  return map
})

/** 选中格不能填入的数字（同行/列/宫已存在） */
const conflictDigits = computed(() => {
  const set = new Set<number>()
  if (!selected.value)
    return set
  const [r, c] = selected.value
  for (const [rr, cc] of relatedCells(r, c)) {
    if (rr === r && cc === c)
      continue
    const v = board.value[rr]?.[cc]
    if (v)
      set.add(v)
  }
  return set
})

function isDigitDisabled(n: number) {
  if (status.value !== 'playing')
    return true
  if (digitCount.value[n] >= 9)
    return true
  // 笔记模式下不限制冲突，方便记录候选
  if (noteMode.value)
    return false
  if (!selected.value)
    return false
  const [r, c] = selected.value
  if (isFixed(r, c))
    return true
  return conflictDigits.value.has(n)
}

function isFixed(r: number, c: number) {
  return puzzle.value[r]?.[c] !== 0
}

function isSelected(r: number, c: number) {
  return !!selected.value && selected.value[0] === r && selected.value[1] === c
}

function isRelated(r: number, c: number) {
  return relatedSet.value.has(`${r},${c}`)
}

function isSameDigit(r: number, c: number) {
  const v = selectedValue.value
  return v !== 0 && board.value[r]?.[c] === v
}

function isWrong(r: number, c: number) {
  const v = board.value[r]?.[c]
  if (!v || isFixed(r, c))
    return false
  return v !== solution.value[r][c]
}

function selectCell(r: number, c: number) {
  if (status.value !== 'playing')
    return
  selected.value = [r, c]
}

function pushHistory(entry: HistoryEntry) {
  history.value.push(entry)
  if (history.value.length > 200)
    history.value.shift()
}

function setValue(num: number) {
  if (status.value !== 'playing' || !selected.value)
    return
  const [r, c] = selected.value
  if (isFixed(r, c))
    return
  // 非笔记模式下，拦截明显冲突的数字（与同行/列/宫已有冲突）
  if (!noteMode.value && num !== 0 && conflictDigits.value.has(num))
    return

  const prevValue = board.value[r][c]
  const prevNotes = notes.value[r][c].slice()

  if (noteMode.value) {
    if (num === 0) {
      notes.value[r][c] = []
    }
    else {
      const list = notes.value[r][c]
      const idx = list.indexOf(num)
      if (idx >= 0)
        list.splice(idx, 1)
      else
        list.push(num)
    }
    pushHistory({
      r,
      c,
      prevValue,
      prevNotes,
      nextValue: prevValue,
      nextNotes: notes.value[r][c].slice(),
    })
    notes.value = notes.value.slice()
    return
  }

  if (prevValue === num)
    return

  if (num !== 0 && num !== solution.value[r][c]) {
    mistakes.value++
    ElMessage.warning(`填入有误（${mistakes.value}/${MAX_MISTAKES}）`)
    if (mistakes.value >= MAX_MISTAKES) {
      status.value = 'lose'
      stopTimer()
      ElMessage.error('错误次数已达上限，本局结束')
    }
    return
  }

  board.value[r][c] = num
  notes.value[r][c] = []
  if (num !== 0) {
    for (const [rr, cc] of relatedCells(r, c)) {
      const list = notes.value[rr][cc]
      const idx = list.indexOf(num)
      if (idx >= 0)
        list.splice(idx, 1)
    }
  }

  pushHistory({
    r,
    c,
    prevValue,
    prevNotes,
    nextValue: num,
    nextNotes: [],
  })

  board.value = board.value.slice()
  notes.value = notes.value.slice()

  checkWin()
}

function eraseSelected() {
  if (!selected.value)
    return
  const [r, c] = selected.value
  if (isFixed(r, c))
    return
  if (board.value[r][c] === 0 && notes.value[r][c].length === 0)
    return
  const prevValue = board.value[r][c]
  const prevNotes = notes.value[r][c].slice()
  board.value[r][c] = 0
  notes.value[r][c] = []
  pushHistory({ r, c, prevValue, prevNotes, nextValue: 0, nextNotes: [] })
  board.value = board.value.slice()
  notes.value = notes.value.slice()
}

function undo() {
  const entry = history.value.pop()
  if (!entry)
    return
  board.value[entry.r][entry.c] = entry.prevValue
  notes.value[entry.r][entry.c] = entry.prevNotes.slice()
  board.value = board.value.slice()
  notes.value = notes.value.slice()
  selected.value = [entry.r, entry.c]
}

function hint() {
  if (status.value !== 'playing')
    return
  let target: [number, number] | null = null
  if (selected.value) {
    const [r, c] = selected.value
    if (!isFixed(r, c) && board.value[r][c] !== solution.value[r][c])
      target = [r, c]
  }
  if (!target) {
    for (let r = 0; r < 9 && !target; r++) {
      for (let c = 0; c < 9; c++) {
        if (board.value[r][c] !== solution.value[r][c]) {
          target = [r, c]
          break
        }
      }
    }
  }
  if (!target)
    return
  const [r, c] = target
  const prevValue = board.value[r][c]
  const prevNotes = notes.value[r][c].slice()
  board.value[r][c] = solution.value[r][c]
  notes.value[r][c] = []
  pushHistory({ r, c, prevValue, prevNotes, nextValue: solution.value[r][c], nextNotes: [] })
  hintsUsed.value++
  selected.value = [r, c]
  board.value = board.value.slice()
  notes.value = notes.value.slice()
  checkWin()
}

function toggleNoteMode() {
  noteMode.value = !noteMode.value
}

function checkWin() {
  if (isComplete(board.value, solution.value)) {
    status.value = 'win'
    stopTimer()
    ElMessage.success(`🎉 完成！用时 ${formattedTime.value}`)
  }
}

function changeDifficulty(diff: Difficulty) {
  newGame(diff)
}

function onKey(e: KeyboardEvent) {
  if (status.value !== 'playing')
    return
  if (e.key >= '1' && e.key <= '9') {
    setValue(Number(e.key))
    e.preventDefault()
    return
  }
  if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    eraseSelected()
    e.preventDefault()
    return
  }
  if (e.key === 'n' || e.key === 'N') {
    toggleNoteMode()
    e.preventDefault()
    return
  }
  if (!selected.value)
    return
  const [r, c] = selected.value
  let nr = r
  let nc = c
  if (e.key === 'ArrowUp')
    nr = Math.max(0, r - 1)
  else if (e.key === 'ArrowDown')
    nr = Math.min(8, r + 1)
  else if (e.key === 'ArrowLeft')
    nc = Math.max(0, c - 1)
  else if (e.key === 'ArrowRight')
    nc = Math.min(8, c + 1)
  else return
  selected.value = [nr, nc]
  e.preventDefault()
}

onMounted(() => {
  newGame('easy')
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('keydown', onKey)
})

const statusLabel = computed(() => {
  if (status.value === 'win')
    return '已完成 🎉'
  if (status.value === 'lose')
    return '挑战失败'
  return '进行中'
})
</script>

<template>
  <div class="page-wrap">
    <header class="mb-5 flex items-center justify-between gap-3">
      <div>
        <p class="m-0 text-xs text-[color:var(--app-text-muted)] font-bold tracking-[0.18em] uppercase">
          Sudoku · 数独
        </p>
        <h1 class="m-0 text-2xl text-[color:var(--app-text)] sm:text-3xl">
          9×9 · 逻辑推理填空
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
      <section class="board-side">
        <div class="board-wrap">
          <div class="board">
            <template v-for="(row, r) in board" :key="r">
              <div
                v-for="(cell, c) in row"
                :key="`${r}-${c}`"
                class="cell"
                :class="{
                  'is-fixed': isFixed(r, c),
                  'is-selected': isSelected(r, c),
                  'is-related': isRelated(r, c) && !isSelected(r, c),
                  'is-same': isSameDigit(r, c) && !isSelected(r, c),
                  'is-wrong': isWrong(r, c),
                  'edge-right': c % 3 === 2 && c !== 8,
                  'edge-bottom': r % 3 === 2 && r !== 8,
                }"
                @click="selectCell(r, c)"
              >
                <span v-if="cell" class="cell-value">{{ cell }}</span>
                <div v-else-if="notes[r]?.[c]?.length" class="notes-grid">
                  <span
                    v-for="n in 9"
                    :key="n"
                    class="note-cell"
                  >{{ notes[r][c].includes(n) ? n : '' }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="numpad">
          <button
            v-for="n in 9"
            :key="n"
            class="num-btn"
            :class="{ done: digitCount[n] >= 9 }"
            :disabled="isDigitDisabled(n)"
            @click="setValue(n)"
          >
            {{ n }}
          </button>
        </div>
      </section>

      <aside class="flex flex-col gap-4">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">对局状态</span>
              <el-tag
                :type="status === 'win' ? 'success' : status === 'lose' ? 'danger' : 'warning'"
                effect="light"
                round
              >
                {{ statusLabel }}
              </el-tag>
            </div>
          </template>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                用时
              </div>
              <div class="mt-1 text-xl font-semibold font-mono">
                {{ formattedTime }}
              </div>
            </div>
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                错误
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ mistakes }} / {{ MAX_MISTAKES }}
              </div>
            </div>
            <div class="rounded-xl bg-[color:var(--app-surface-soft)] p-3">
              <div class="text-xs text-[color:var(--app-text-muted)]">
                提示
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ hintsUsed }}
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <el-button type="primary" w-full @click="newGame()">
              <template #icon>
                <i class="i-carbon-restart" />
              </template>
              重新开始
            </el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="panel-card">
          <template #header>
            <span class="font-semibold">难度</span>
          </template>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="d in DIFFICULTY_META"
              :key="d.value"
              class="diff-btn"
              :class="{ active: difficulty === d.value }"
              @click="changeDifficulty(d.value)"
            >
              <div class="font-semibold">
                {{ d.label }}
              </div>
              <div class="mt-1 text-xs opacity-70">
                {{ d.desc }}
              </div>
            </button>
          </div>
        </el-card>

        <div class="action-bar">
          <button class="action-btn" :disabled="!history.length" @click="undo">
            <i class="i-carbon-undo" />
            <span>撤销</span>
          </button>
          <button class="action-btn" @click="eraseSelected">
            <i class="i-carbon-erase" />
            <span>擦除</span>
          </button>
          <button
            class="action-btn"
            :class="{ active: noteMode }"
            @click="toggleNoteMode"
          >
            <i class="i-carbon-edit" />
            <span>笔记 {{ noteMode ? 'ON' : 'OFF' }}</span>
          </button>
          <button class="action-btn" @click="hint">
            <i class="i-carbon-idea" />
            <span>提示</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.board-side {
  display: flex;
  flex-direction: column;
  align-self: start;
  justify-self: start;
  gap: 14px;
  width: max-content;
}
.board-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: max-content;
  padding: 18px;
  border-radius: 22px;
  background: var(--gomoku-board-bg);
  border: 1px solid var(--app-border);
  box-shadow: 0 24px 40px rgba(40, 23, 8, 0.18);
}
.board {
  --cell: clamp(34px, 5.6vw, 54px);
  display: grid;
  grid-template-columns: repeat(9, var(--cell));
  grid-template-rows: repeat(9, var(--cell));
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 2px solid rgba(46, 24, 8, 0.55);
  overflow: hidden;
}
html.dark .board {
  background: rgba(20, 22, 36, 0.85);
  border-color: rgba(255, 220, 170, 0.45);
}
.cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--cell);
  height: var(--cell);
  border: 1px solid rgba(46, 24, 8, 0.18);
  cursor: pointer;
  user-select: none;
  background: transparent;
  color: var(--app-accent);
  font-size: calc(var(--cell) * 0.5);
  font-weight: 600;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
html.dark .cell {
  border-color: rgba(255, 220, 170, 0.18);
}
.cell.edge-right {
  border-right: 2px solid rgba(46, 24, 8, 0.55);
}
.cell.edge-bottom {
  border-bottom: 2px solid rgba(46, 24, 8, 0.55);
}
html.dark .cell.edge-right {
  border-right-color: rgba(255, 220, 170, 0.45);
}
html.dark .cell.edge-bottom {
  border-bottom-color: rgba(255, 220, 170, 0.45);
}

.cell.is-fixed {
  color: var(--app-text);
}
.cell.is-related {
  background: rgba(201, 122, 26, 0.08);
}
.cell.is-same {
  background: rgba(201, 122, 26, 0.22);
}
.cell.is-selected {
  background: rgba(201, 122, 26, 0.36);
  outline: 2px solid var(--app-accent);
  outline-offset: -2px;
  z-index: 1;
}
.cell.is-wrong {
  color: #d9352e;
  background: rgba(217, 53, 46, 0.16);
}

.cell-value {
  line-height: 1;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 2px;
  gap: 0;
}
.note-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--cell) * 0.22);
  font-weight: 500;
  color: var(--app-text-muted);
  line-height: 1;
}

.diff-btn {
  padding: 12px 8px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  color: var(--app-text);
  cursor: pointer;
  text-align: center;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}
.diff-btn:hover {
  transform: translateY(-1px);
  border-color: var(--app-accent);
}
.diff-btn.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  color: var(--app-accent);
}

.numpad {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 6px;
  padding: 0 4px;
}
.num-btn {
  height: 52px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-accent);
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    opacity 0.15s ease;
}
.num-btn:hover:not(:disabled) {
  background: var(--app-accent-soft);
  transform: translateY(-1px);
}
.num-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
  background: var(--app-surface-soft);
}
.num-btn.done {
  color: var(--app-text-muted);
}

.action-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 4px;
}
.action-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease,
    opacity 0.15s ease;
}
.action-btn i {
  font-size: 20px;
  color: var(--app-accent);
}
.action-btn:hover:not(:disabled) {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  transform: translateY(-1px);
}
.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.action-btn.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  color: var(--app-accent);
}
</style>
