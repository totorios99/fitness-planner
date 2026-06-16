import { AppShell } from '@/components/AppShell'

export default function Loading() {
  return (
    <AppShell>
      <div className="page-content">
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh', color: 'var(--ink-4)', fontSize: 14 }}>
          Loading…
        </div>
      </div>
    </AppShell>
  )
}
