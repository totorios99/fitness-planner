'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from './Icon'

const tabs = [
  { href: '/',          label: 'Home',      icon: 'home'      as const },
  { href: '/planner',   label: 'Plan',      icon: 'calendar'  as const },
  { href: '/log',       label: 'Log',       icon: 'activity'  as const },
  { href: '/exercises', label: 'Exercises', icon: 'layers'    as const },
]

export function TabBar() {
  const pathname = usePathname()
  return (
    <nav className="tab-bar">
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
