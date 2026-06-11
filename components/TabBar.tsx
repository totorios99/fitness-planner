'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from './Icon'

const tabs = [
  { href: '/',          label: 'Home',      icon: 'home'      as const },
  { href: '/log',       label: 'Log',       icon: 'log'       as const },
  { href: '/exercises', label: 'Exercises', icon: 'exercises' as const },
  { href: '/routines',  label: 'Routines',  icon: 'routines'  as const },
  { href: '/planner',   label: 'Planner',   icon: 'progress'  as const },
]

export function TabBar() {
  const pathname = usePathname()
  return (
    <nav className="tab-bar">
      <Link href="/" className="sidebar-brand">
        <div className="brand-icon">F</div>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Forma</span>
      </Link>
      {tabs.map(t => {
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
        return (
          <Link key={t.href} href={t.href} className={`tab-item${active ? ' active' : ''}`}>
            {active && <span className="tab-dot" />}
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
