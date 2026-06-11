import { muscleColor, muscleLabel } from '@/lib/muscles'

interface MuscleSummaryProps {
  sets: Record<string, number>
  showAll?: boolean
}

export function MuscleSummary({ sets, showAll = false }: MuscleSummaryProps) {
  const entries = Object.entries(sets).sort((a, b) => b[1] - a[1])
  const shown = showAll ? entries : entries.slice(0, 6)
  const max = entries[0]?.[1] ?? 1

  if (shown.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {shown.map(([muscle, count]) => (
        <div key={muscle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, width: 88, flexShrink: 0, color: 'var(--ink-2)' }}>
            {muscleLabel(muscle)}
          </span>
          <div style={{ flex: 1, height: 7, borderRadius: 9999, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                borderRadius: 9999,
                background: muscleColor(muscle),
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, width: 26, textAlign: 'right', color: 'var(--ink-2)' }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  )
}
