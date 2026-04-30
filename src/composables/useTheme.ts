export type ThemeMode = 'system' | 'light' | 'dark'
const STORAGE_KEY = 'game:theme-mode'

const mode = ref<ThemeMode>(loadMode())
const isDark = ref(resolveDark(mode.value))

function loadMode(): ThemeMode {
  if (typeof localStorage === 'undefined')
    return 'system'
  const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function resolveDark(m: ThemeMode): boolean {
  if (m === 'dark')
    return true
  if (m === 'light')
    return false
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyDom(dark: boolean) {
  const html = document.documentElement
  html.classList.toggle('dark', dark)
  html.style.colorScheme = dark ? 'dark' : 'light'
}

let mediaQuery: MediaQueryList | null = null
function listenSystem() {
  if (typeof window === 'undefined' || mediaQuery)
    return
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', onSystemChange)
}
function onSystemChange(e: MediaQueryListEvent) {
  if (mode.value === 'system')
    isDark.value = e.matches
}

export function useTheme() {
  listenSystem()

  watch(
    isDark,
    (v) => { applyDom(v) },
    { immediate: true },
  )

  watch(mode, (m) => {
    localStorage.setItem(STORAGE_KEY, m)
    isDark.value = resolveDark(m)
  })

  function setMode(m: ThemeMode) {
    mode.value = m
  }

  function cycle() {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const i = order.indexOf(mode.value)
    setMode(order[(i + 1) % order.length])
  }

  onBeforeUnmount(() => {
    // 单例 mediaQuery 由模块作用域管理，这里不移除
  })

  return { mode, isDark, setMode, cycle }
}
