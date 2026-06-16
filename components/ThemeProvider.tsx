'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

const STORAGE_KEY = 'forma-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server + first client render use 'light'; the inline head script has already
  // applied the correct attribute, and we sync React state to it on mount.
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const applied = (document.documentElement.getAttribute('data-theme') as Theme) || 'light'
    setTheme(applied)

    // No explicit user choice yet → follow the OS color scheme live.
    if (!localStorage.getItem(STORAGE_KEY) && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => {
        if (!localStorage.getItem(STORAGE_KEY)) setTheme(mq.matches ? 'dark' : 'light')
      }
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
  }, [])

  // Apply theme to the DOM whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = () =>
    setTheme(t => {
      const next: Theme = t === 'light' ? 'dark' : 'light'
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
      return next
    })

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
