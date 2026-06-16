'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { Icon } from './Icon'

const NAV = [
  { href: '/',          label: 'Home',      icon: 'home'      as const },
  { href: '/planner',   label: 'Plan',      icon: 'calendar'  as const },
  { href: '/log',       label: 'Log',       icon: 'activity'  as const },
  { href: '/exercises', label: 'Exercises', icon: 'layers'    as const },
]

export function TopNav() {
  const { theme, toggle } = useTheme()
  const pathname = usePathname()

  return (
    <header className="top-nav">
      <div className="topbar-inner">
        <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-mark">F</div>
          Forma
          <small>Training</small>
        </Link>

        <nav className="nav-tabs">
          {NAV.map(n => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`nav-tab${active ? ' active' : ''}`}
              >
                <Icon name={n.icon} size={16} />
                <span>{n.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="topbar-spacer" />

        <button className="icon-btn theme-toggle" onClick={toggle} aria-label="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>
    </header>
  )
}
