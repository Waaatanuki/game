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
    id: 'snake',
    name: '贪吃蛇',
    desc: '即将上线，敬请期待。',
    icon: 'i-carbon-progress-bar',
    to: '/snake',
    players: '1 人',
    multiplayer: false,
    accent: 'from-emerald-400/60 to-teal-500/60',
    available: false,
  },
  {
    id: 'tictactoe',
    name: '井字棋',
    desc: '即将上线，敬请期待。',
    icon: 'i-carbon-checkbox',
    to: '/tictactoe',
    players: '2 人',
    multiplayer: true,
    accent: 'from-sky-400/60 to-indigo-500/60',
    available: false,
  },
]
