import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('~/views/Home.vue'),
    meta: { title: '游戏大厅' },
  },
  {
    path: '/gomoku',
    name: 'gomoku',
    component: () => import('~/views/Gomoku.vue'),
    meta: { title: '五子棋' },
  },
  {
    path: '/halma',
    name: 'halma',
    component: () => import('~/views/Halma.vue'),
    meta: { title: '跳棋' },
  },
  {
    path: '/sudoku',
    name: 'sudoku',
    component: () => import('~/views/Sudoku.vue'),
    meta: { title: '数独' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
