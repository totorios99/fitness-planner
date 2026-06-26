'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'
type Theme = 'light' | 'dark'

const ThemeCtx = createContext<{ mode: ThemeMode; theme: Theme; toggle: () => void }>({
  mode: 'auto',
  theme: 'light',
  toggle: () => {},
})

const STORAGE_KEY = 'forma-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const resolved: ThemeMode = stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto'
    setMode(resolved)

    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    setTheme(resolved === 'auto' ? (systemDark ? 'dark' : 'light') : resolved)

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = () => {
      setMode(m => {
        if (m === 'auto') setTheme(mq.matches ? 'dark' : 'light')
        return m
      })
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const toggle = () => {
    setMode(m => {
      const next: ThemeMode = m === 'light' ? 'dark' : m === 'dark' ? 'auto' : 'light'
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
      const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
      setTheme(next === 'auto' ? (systemDark ? 'dark' : 'light') : next)
      return next
    })
  }

  return <ThemeCtx.Provider value={{ mode, theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
