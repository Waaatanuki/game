export const SIZE = 9
export type Stone = 0 | 1 | 2 // 0 空, 1 红, 2 蓝
export type Board = Stone[][]
export type Pos = [number, number]

/** 红方初始大本营（左上角三角，10 颗） */
export const PLAYER1_HOME: Pos[] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 0],
  [2, 1],
  [3, 0],
]

/** 蓝方初始大本营（右下角三角，10 颗） */
export const PLAYER2_HOME: Pos[] = [
  [8, 8],
  [8, 7],
  [8, 6],
  [8, 5],
  [7, 8],
  [7, 7],
  [7, 6],
  [6, 8],
  [6, 7],
  [5, 8],
]

/** 仅允许上下左右四个方向，禁止斜向走子与跳跃 */
const DIRS: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

export function createBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => 0 as Stone))
  for (const [r, c] of PLAYER1_HOME)
    b[r][c] = 1
  for (const [r, c] of PLAYER2_HOME)
    b[r][c] = 2
  return b
}

export function inBoard(r: number, c: number): boolean {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

/** 该坐标是否落在「己方目标区」（即对方初始大本营） */
export function isInGoal(stone: Stone, r: number, c: number): boolean {
  const goal = stone === 1 ? PLAYER2_HOME : PLAYER1_HOME
  return goal.some(([gr, gc]) => gr === r && gc === c)
}

/** 计算从 (r,c) 出发的单步走法 */
export function stepTargets(board: Board, r: number, c: number): Pos[] {
  const stone = board[r][c]
  if (!stone)
    return []
  const out: Pos[] = []
  const fromInGoal = isInGoal(stone, r, c)
  for (const [dr, dc] of DIRS) {
    const nr = r + dr
    const nc = c + dc
    if (!inBoard(nr, nc) || board[nr][nc] !== 0)
      continue
    // 已进入对方大本营的棋子不能再走出
    if (fromInGoal && !isInGoal(stone, nr, nc))
      continue
    out.push([nr, nc])
  }
  return out
}

/**
 * 计算从 (r,c) 出发的「单次」跳跃落点。
 * 跳跃规则：相邻一格有任意棋子，越过它落到正对面的空格。
 */
export function jumpTargets(
  board: Board,
  r: number,
  c: number,
  visited?: Set<string>,
): Pos[] {
  const stone = board[r][c]
  if (!stone)
    return []
  const out: Pos[] = []
  const fromInGoal = isInGoal(stone, r, c)
  for (const [dr, dc] of DIRS) {
    const mr = r + dr
    const mc = c + dc
    const nr = r + 2 * dr
    const nc = c + 2 * dc
    if (!inBoard(nr, nc))
      continue
    if (board[mr][mc] === 0)
      continue
    if (board[nr][nc] !== 0)
      continue
    if (visited?.has(`${nr},${nc}`))
      continue
    if (fromInGoal && !isInGoal(stone, nr, nc))
      continue
    out.push([nr, nc])
  }
  return out
}

/**
 * 通过 BFS 计算从 (r,c) 出发可达的所有跳跃终点，
 * 返回 `key("r,c") => 最短路径（不含起点，含终点）`。
 */
export function reachableJumps(
  board: Board,
  r: number,
  c: number,
): Map<string, Pos[]> {
  const stone = board[r][c]
  const result = new Map<string, Pos[]>()
  if (!stone)
    return result
  const startInGoal = isInGoal(stone, r, c)
  interface Node { r: number, c: number, path: Pos[], visited: Set<string> }
  const startKey = `${r},${c}`
  const queue: Node[] = [{ r, c, path: [], visited: new Set([startKey]) }]
  while (queue.length) {
    const cur = queue.shift()!
    for (const [dr, dc] of DIRS) {
      const mr = cur.r + dr
      const mc = cur.c + dc
      const nr = cur.r + 2 * dr
      const nc = cur.c + 2 * dc
      const key = `${nr},${nc}`
      if (!inBoard(nr, nc))
        continue
      // 中间格必须有棋子；起点格除外（棋子还没真正离开）
      if (mr === r && mc === c) {
        // 起点本身就是棋子，视为合法跳板
      }
      else if (board[mr][mc] === 0) {
        continue
      }
      // 落点必须为空；起点除外（不能回到自己）
      if ((nr !== r || nc !== c) && board[nr][nc] !== 0)
        continue
      if (cur.visited.has(key))
        continue
      // 大本营锁定：起点已在目标区，则全程必须留在目标区
      if (startInGoal && !isInGoal(stone, nr, nc))
        continue
      const newPath = [...cur.path, [nr, nc] as Pos]
      const prev = result.get(key)
      if (!prev || prev.length > newPath.length)
        result.set(key, newPath)
      const newVisited = new Set(cur.visited)
      newVisited.add(key)
      queue.push({ r: nr, c: nc, path: newPath, visited: newVisited })
    }
  }
  // 起点不算可达落点
  result.delete(startKey)
  return result
}

/** 0 = 未结束；1/2 = 对应玩家胜 */
export function checkWin(board: Board): Stone {
  if (PLAYER2_HOME.every(([r, c]) => board[r][c] === 1))
    return 1
  if (PLAYER1_HOME.every(([r, c]) => board[r][c] === 2))
    return 2
  return 0
}

export interface AIMove {
  from: Pos
  to: Pos
  /** 跳跃路径（不含起点）；单步则为单元素数组 */
  path: Pos[]
  kind: 'step' | 'jump'
}

/** 棋子距离对应目标区的曼哈顿距离（取最近一格） */
function distToGoal(stone: Stone, r: number, c: number): number {
  const goal = stone === 1 ? PLAYER2_HOME : PLAYER1_HOME
  let best = Infinity
  for (const [gr, gc] of goal) {
    const d = Math.abs(gr - r) + Math.abs(gc - c)
    if (d < best)
      best = d
  }
  return best
}

/** 启发式 AI：选择「使该棋子离目标区更近」的最优走法 */
export function aiMove(board: Board, stone: Stone): AIMove | null {
  const candidates: Array<{ move: AIMove, score: number }> = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== stone)
        continue
      const fromGoal = isInGoal(stone, r, c)
      const fromDist = distToGoal(stone, r, c)
      // 单步
      for (const [tr, tc] of stepTargets(board, r, c)) {
        const toDist = distToGoal(stone, tr, tc)
        // 大本营内的棋子之间挪动收益较低，主要鼓励向目标推进
        const gain = fromDist - toDist
        const bonus = isInGoal(stone, tr, tc) && !fromGoal ? 2 : 0
        candidates.push({
          move: { from: [r, c], to: [tr, tc], path: [[tr, tc]], kind: 'step' },
          score: gain + bonus,
        })
      }
      // 跳跃（取每个终点最短路径，跳跃推进价值更高）
      const jumps = reachableJumps(board, r, c)
      for (const [key, path] of jumps) {
        const [tr, tc] = key.split(',').map(Number) as [number, number]
        const toDist = distToGoal(stone, tr, tc)
        const gain = fromDist - toDist
        const bonus = isInGoal(stone, tr, tc) && !fromGoal ? 3 : 0
        candidates.push({
          move: { from: [r, c], to: [tr, tc], path, kind: 'jump' },
          score: gain * 1.2 + bonus,
        })
      }
    }
  }
  if (!candidates.length)
    return null
  candidates.sort((a, b) => b.score - a.score)
  // 在分数最高的若干个中随机一个，避免太机械
  const top = candidates.filter(x => x.score >= candidates[0].score - 0.001)
  return top[Math.floor(Math.random() * top.length)].move
}
