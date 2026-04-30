export const SIZE = 3
export type Stone = 0 | 1 | 2 // 0 空, 1=X, 2=O
export type Board = Stone[][]

export function createBoard(): Board {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => 0 as Stone))
}

const LINES: Array<Array<[number, number]>> = [
  // 行
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  // 列
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  // 对角线
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
]

/** 检查胜利。返回胜利棋子和构成胜利的三个坐标，否则返回 null。 */
export function checkWin(board: Board): { stone: Stone, line: Array<[number, number]> } | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a[0]][a[1]]
    if (v && v === board[b[0]][b[1]] && v === board[c[0]][c[1]])
      return { stone: v, line }
  }
  return null
}

export function isFull(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c])
        return false
    }
  }
  return true
}

/** Minimax，返回该局面对 self 的得分（10 = 必胜，-10 必败，0 平），depth 用于偏好更快的胜利 */
function minimax(board: Board, self: Stone, current: Stone, depth: number): number {
  const win = checkWin(board)
  if (win)
    return win.stone === self ? 10 - depth : depth - 10
  if (isFull(board))
    return 0
  const opp: Stone = self === 1 ? 2 : 1
  if (current === self) {
    let best = -Infinity
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c])
          continue
        board[r][c] = self
        const s = minimax(board, self, opp, depth + 1)
        board[r][c] = 0
        if (s > best) best = s
      }
    }
    return best
  }
  else {
    let best = Infinity
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c])
          continue
        board[r][c] = current
        const s = minimax(board, self, self, depth + 1)
        board[r][c] = 0
        if (s < best) best = s
      }
    }
    return best
  }
}

/** AI 计算下一步最优落点 */
export function aiMove(board: Board, self: Stone): [number, number] | null {
  const empties: Array<[number, number]> = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c])
        empties.push([r, c])
    }
  }
  if (!empties.length)
    return null
  // 棋盘为空时随机选一个角或中心，避免每次都一样
  if (empties.length === SIZE * SIZE) {
    const candidates: Array<[number, number]> = [[0, 0], [0, 2], [2, 0], [2, 2], [1, 1]]
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  const opp: Stone = self === 1 ? 2 : 1
  let bestScore = -Infinity
  const bestMoves: Array<[number, number]> = []
  for (const [r, c] of empties) {
    board[r][c] = self
    const score = minimax(board, self, opp, 0)
    board[r][c] = 0
    if (score > bestScore) {
      bestScore = score
      bestMoves.length = 0
      bestMoves.push([r, c])
    }
    else if (score === bestScore) {
      bestMoves.push([r, c])
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}
