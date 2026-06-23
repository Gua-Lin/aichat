import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode } from '../types/chatTypes'

interface ThemeStoreState {
  /** 用户偏好设置（light/dark/system） */
  preference: ThemeMode
  /** 最终解析的主题（已考虑系统偏好） */
  resolvedTheme: 'light' | 'dark'

  /** 设置主题偏好 */
  setPreference: (mode: ThemeMode) => void
  /** 在 light/dark 之间快速切换 */
  toggleTheme: () => void
  /** 初始化主题（监听系统主题变化） */
  initTheme: () => () => void
}

/** 解析实际主题：如果是 system 则读取系统偏好 */
function resolveTheme(preference: ThemeMode): 'light' | 'dark' {
  if (preference === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return preference
}

/** 将解析后的主题应用到 DOM */
function applyTheme(theme: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      resolvedTheme: 'light',

      setPreference: (mode: ThemeMode) => {
        const resolved = resolveTheme(mode)
        applyTheme(resolved)
        set({ preference: mode, resolvedTheme: resolved })
      },

      toggleTheme: () => {
        const { resolvedTheme } = get()
        const next = resolvedTheme === 'light' ? 'dark' : 'light'
        applyTheme(next)
        set({ preference: next, resolvedTheme: next })
      },

      initTheme: () => {
        const { preference } = get()
        const resolved = resolveTheme(preference)
        applyTheme(resolved)
        set({ resolvedTheme: resolved })

        // 监听系统主题变化
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handler = () => {
            const currentPref = get().preference
            if (currentPref === 'system') {
              const newResolved = mediaQuery.matches ? 'dark' : 'light'
              applyTheme(newResolved)
              set({ resolvedTheme: newResolved })
            }
          }
          mediaQuery.addEventListener('change', handler)
          // 返回清理函数
          return () => mediaQuery.removeEventListener('change', handler)
        }
        return () => {}
      },
    }),
    {
      name: 'theme_preference',
      partialize: (state) => ({ preference: state.preference }),
    }
  )
)
