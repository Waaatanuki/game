import type { CardColor } from 'animal-island-vue'

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
  /** 小岛卡片配色 */
  color: CardColor
  available: boolean
}

export const games: GameMeta[] = [
  {
    id: 'gomoku',
    name: '五子棋',
    desc: '黑白落子，步步为营。和朋友比一场，或找 AI 练练手。',
    icon: 'i-carbon-circle-dash',
    to: '/gomoku',
    players: '1 - 2 人',
    multiplayer: true,
    color: 'app-yellow',
    available: true,
  },
  {
    id: 'halma',
    name: '跳棋',
    desc: '跳过小伙伴，抄一条近路。谁会先抵达对岸的大本营？',
    icon: 'i-carbon-jump-link',
    to: '/halma',
    players: '1 - 2 人',
    multiplayer: true,
    color: 'app-pink',
    available: true,
  },
  {
    id: 'sudoku',
    name: '数独',
    desc: '在数字之间找找灵感。三档难度，慢慢解开每一个小谜题。',
    icon: 'i-carbon-table-split',
    to: '/sudoku',
    players: '1 人',
    multiplayer: false,
    color: 'purple',
    available: true,
  },
  {
    id: 'tictactoe',
    name: '井字棋',
    desc: '画个圈，打个叉。三步连成线，简单也能玩得很认真。',
    icon: 'i-carbon-checkbox',
    to: '/tictactoe',
    players: '1 - 2 人',
    multiplayer: true,
    color: 'app-blue',
    available: true,
  },
]
