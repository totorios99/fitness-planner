'use client'

import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { Icon } from './Icon'

export function TopNav({
  title,
  left,
}: {
  title: string
  left?: React.ReactNode
}) {
  const { theme, toggle } = useTheme()
  return (
    <nav className="top-nav">
      {left ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>{left}</div>
      ) : (
        <Link href="/" className="nav-brand">
          <div className="brand-icon">F</div>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{title}</span>
        </Link>
      )}
      <div className="nav-actions">
        {left && (
          <span style={{ fontWeight: 600, fontSize: 16, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </span>
        )}
        <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>
    </nav>
  )
}
