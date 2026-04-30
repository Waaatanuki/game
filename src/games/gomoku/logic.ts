export const BOARD_SIZE = 15
export type Stone = 0 | 1 | 2 // 0 空, 1 黑, 2 白
export type Board = Stone[][]

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0 as Stone))
}

const DIRS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]

/** 检查在 (r,c) 落子后是否形成五连。返回胜利方向上的所有坐标，或 null。 */
export function checkWin(board: Board, r: number, c: number): Array<[number, number]> | null {
  const stone = board[r]?.[c]
  if (!stone)
    return null
  for (const [dr, dc] of DIRS) {
    const line: Array<[number, number]> = [[r, c]]
    for (let k = 1; k < 5; k++) {
      const nr = r + dr * k
      const nc = c + dc * k
      if (board[nr]?.[nc] !== stone)
        break
      line.push([nr, nc])
    }
    for (let k = 1; k < 5; k++) {
      const nr = r - dr * k
      const nc = c - dc * k
      if (board[nr]?.[nc] !== stone)
        break
      line.unshift([nr, nc])
    }
    if (line.length >= 5)
      return line.slice(0, 5)
  }
  return null
}

export function isFull(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c])
        return false
    }
  }
  return true
}

/**
 * 简单启发式 AI：基于位置评分选择最佳落点。
 */
export function aiMove(board: Board, self: Stone): [number, number] | null {
  const opponent: Stone = self === 1 ? 2 : 1
  let best: [number, number] | null = null
  let bestScore = -Infinity

  // 仅评估空位中位于现有棋子 2 格邻域内的点；若棋盘为空则下天元
  if (board.flat().every(v => v === 0))
    return [Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)]

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0)
        continue
      if (!hasNeighbor(board, r, c, 2))
        continue
      const myScore = scoreCell(board, r, c, self)
      const oppScore = scoreCell(board, r, c, opponent)
      const score = Math.max(myScore, oppScore * 0.95)
      if (score > bestScore) {
        bestScore = score
        best = [r, c]
      }
    }
  }
  return best
}

function hasNeighbor(board: Board, r: number, c: number, range: number): boolean {
  for (let dr = -range; dr <= range; dr++) {
    for (let dc = -range; dc <= range; dc++) {
      if (!dr && !dc)
        continue
      if (board[r + dr]?.[c + dc])
        return true
    }
  }
  return false
}

function scoreCell(board: Board, r: number, c: number, stone: Stone): number {
  let total = 0
  for (const [dr, dc] of DIRS)
    total += scoreLine(board, r, c, dr, dc, stone)
  return total
}

function scoreLine(board: Board, r: number, c: number, dr: number, dc: number, stone: Stone): number {
  let count = 1
  let blockHead = false
  let blockTail = false

  let i = 1
  while (true) {
    const v = board[r + dr * i]?.[c + dc * i]
    if (v === stone) { count++; i++ }
    else {
      if (v === undefined || v !== 0)
        blockTail = true; break
    }
  }
  i = 1
  while (true) {
    const v = board[r - dr * i]?.[c - dc * i]
    if (v === stone) { count++; i++ }
    else {
      if (v === undefined || v !== 0)
        blockHead = true; break
    }
  }

  if (count >= 5)
    return 100000
  const blocks = (blockHead ? 1 : 0) + (blockTail ? 1 : 0)
  if (blocks === 2 && count < 5)
    return 0
  // 活/眠分数表
  const table: Record<number, [number, number]> = {
    4: [10000, 1000], // 活四 / 冲四
    3: [1000, 100],
    2: [100, 10],
    1: [10, 1],
  }
  const entry = table[count]
  if (!entry)
    return 0
  return blocks === 0 ? entry[0] : entry[1]
}
