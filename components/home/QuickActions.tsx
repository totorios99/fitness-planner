import Link from 'next/link'
import { Icon } from '@/components/Icon'

type IconName = Parameters<typeof Icon>[0]['name']

interface Action {
  icon: IconName
  title: string
  sub: string
  href?: string
  featured?: boolean
  disabled?: boolean
}

const ACTIONS: Action[] = [
  { icon: 'activity', title: 'Log workout',       sub: "Track today's sets", href: '/log', featured: true },
  { icon: 'layers',   title: 'Exercise library',  sub: 'Browse movements',   href: '/exercises' },
  { icon: 'calendar', title: 'Plans & routines',  sub: 'Build your week',     href: '/planner' },
  { icon: 'chart',    title: 'Progress & charts', sub: 'Coming soon',         disabled: true },
]

function Row({ a }: { a: Action }) {
  const inner = (
    <>
      <span className="qa-icon"><Icon name={a.icon} size={19} /></span>
      <span className="qa-text">
        <span className="qa-title">{a.title}</span>
        <span className="qa-sub">{a.sub}</span>
      </span>
      <Icon name="chevronR" size={16} />
    </>
  )

  if (a.disabled || !a.href) {
    return (
      <button className="qa-row" disabled aria-disabled="true" style={{ opacity: 0.5, cursor: 'default' }}>
        {inner}
      </button>
    )
  }
  return (
    <Link href={a.href} className={'qa-row' + (a.featured ? ' featured' : '')}>
      {inner}
    </Link>
  )
}

export function QuickActions() {
  return (
    <section className="home-card qa-card">
      <div className="st-label">Quick actions</div>
      <div className="qa-list">
        {ACTIONS.map(a => <Row key={a.title} a={a} />)}
      </div>
    </section>
  )
}
