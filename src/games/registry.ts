export interface GameMeta {
  id: string
  name: string
  desc: string
  /** UnoCSS 图标类名 */
  icon: string
  /** 跳转路由 */
  to: string
  /** 游玩人数描述 */
  players: string
  /** 是否支持联机 */
  multiplayer: boolean
  /** 卡片渐变色 */
  accent: string
  available: boolean
}

export const games: GameMeta[] = [
  {
    id: 'gomoku',
    name: '五子棋',
    desc: '经典 15×15 棋盘，先连成五子者胜。支持人机对弈与基于 WebRTC 的联机对战。',
    icon: 'i-carbon-circle-dash',
    to: '/gomoku',
    players: '1 - 2 人',
    multiplayer: true,
    accent: 'from-amber-400/60 to-orange-500/60',
    available: true,
  },
  {
    id: 'halma',
    name: '跳棋',
    desc: '9×9 Halma 棋盘，支持本地双人、人机对战与基于 WebRTC 的联机对战，率先占满对方大本营者胜。',
    icon: 'i-carbon-jump-link',
    to: '/halma',
    players: '1 - 2 人',
    multiplayer: true,
    accent: 'from-rose-400/60 to-blue-500/60',
    available: true,
  },
  {
    id: 'sudoku',
    name: '数独',
    desc: '经典 9×9 数独，三档难度可选，支持笔记、撤销、提示，最多三次错误。',
    icon: 'i-carbon-table-split',
    to: '/sudoku',
    players: '1 人',
    multiplayer: false,
    accent: 'from-violet-400/60 to-fuchsia-500/60',
    available: true,
  },
  {
    id: 'tictactoe',
    name: '井字棋',
    desc: '经典 3×3 井字棋，支持本地双人、人机对战（完美 Minimax AI）与 WebRTC 联机对战。',
    icon: 'i-carbon-checkbox',
    to: '/tictactoe',
    players: '1 - 2 人',
    multiplayer: true,
    accent: 'from-sky-400/60 to-indigo-500/60',
    available: true,
  },
]
