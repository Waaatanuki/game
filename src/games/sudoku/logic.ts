/** 0 表示空格 */
export type SudokuBoard = number[][]

export type Difficulty = 'easy' | 'medium' | 'hard'

/** 不同难度需要挖去的空格数 */
const DIFFICULTY_HOLES: Record<Difficulty, number> = {
  easy: 36,
  medium: 48,
  hard: 56,
}

export const DIFFICULTY_META: Array<{ value: Difficulty, label: string, desc: string }> = [
  { value: 'easy', label: '简单', desc: '入门级 · 适合休闲' },
  { value: 'medium', label: '中等', desc: '需要一些推理' },
  { value: 'hard', label: '困难', desc: '挑战逻辑极限' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function emptyBoard(): SudokuBoard {
  return Array.from({ length: 9 }, () => Array.from<number>({ length: 9 }).fill(0))
}

function cloneBoard(b: SudokuBoard): SudokuBoard {
  return b.map(r => r.slice())
}

/** 检查在 (r,c) 放 num 是否合法 */
export function isValidPlacement(b: SudokuBoard, r: number, c: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (b[r][i] === num && i !== c)
      return false
    if (b[i][c] === num && i !== r)
      return false
  }
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const rr = br + i
      const cc = bc + j
      if (b[rr][cc] === num && (rr !== r || cc !== c))
        return false
    }
  }
  return true
}

/** 用回溯填满整张棋盘 */
function fillBoard(b: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const n of nums) {
          if (isValidPlacement(b, r, c, n)) {
            b[r][c] = n
            if (fillBoard(b))
              return true
            b[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

/** 求解器，返回解的数量（最多 limit） */
function countSolutions(b: SudokuBoard, limit = 2): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        let count = 0
        for (let n = 1; n <= 9; n++) {
          if (isValidPlacement(b, r, c, n)) {
            b[r][c] = n
            count += countSolutions(b, limit - count)
            b[r][c] = 0
            if (count >= limit)
              return count
          }
        }
        return count
      }
    }
  }
  return 1
}

/** 生成一道完整解 + 给定挖空数的题面 */
export function generatePuzzle(difficulty: Difficulty): { puzzle: SudokuBoard, solution: SudokuBoard } {
  const solution = emptyBoard()
  fillBoard(solution)
  const puzzle = cloneBoard(solution)

  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
  )
  let holes = DIFFICULTY_HOLES[difficulty]

  for (const [r, c] of positions) {
    if (holes <= 0)
      break
    const backup = puzzle[r][c]
    if (backup === 0)
      continue
    puzzle[r][c] = 0
    // 简单难度不强制唯一解校验以加快速度；中/难需保证唯一解
    if (difficulty !== 'easy') {
      const test = cloneBoard(puzzle)
      if (countSolutions(test, 2) !== 1) {
        puzzle[r][c] = backup
        continue
      }
    }
    holes--
  }
  return { puzzle, solution }
}

/** 是否完成（与解一致） */
export function isComplete(board: SudokuBoard, solution: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c])
        return false
    }
  }
  return true
}

/** 同行/同列/同宫位置集合 */
export function relatedCells(r: number, c: number): Array<[number, number]> {
  const list: Array<[number, number]> = []
  const seen = new Set<string>()
  const add = (rr: number, cc: number) => {
    const k = `${rr},${cc}`
    if (!seen.has(k)) {
      seen.add(k)
      list.push([rr, cc])
    }
  }
  for (let i = 0; i < 9; i++) {
    add(r, i)
    add(i, c)
  }
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++)
      add(br + i, bc + j)
  }
  return list
}
