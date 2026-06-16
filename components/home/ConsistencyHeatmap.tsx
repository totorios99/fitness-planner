import type { HeatWeek } from '@/lib/home'

export function calLevel(level: 0 | 1 | 2 | 3): string {
  return level === 0 ? 'var(--bg-sunken)'
    : level === 1 ? 'color-mix(in oklab, var(--accent) 32%, var(--bg-sunken))'
    : level === 2 ? 'color-mix(in oklab, var(--accent) 62%, var(--bg-sunken))'
    : 'var(--accent)'
}

const DAY_INITIALS = ['M', '', 'W', '', 'F', '', '']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function cellLabel(dayIso: string, dayIdx: number, sets: number, trained: boolean, future: boolean): string {
  const [y, m, d] = dayIso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const human = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (future) return `${human} — upcoming`
  return `${DAY_NAMES[dayIdx]} ${human} — ${trained ? `${sets} sets` : 'rest'}`
}

export function ConsistencyHeatmap({ cols }: { cols: HeatWeek[] }) {
  return (
    <div className="cal-wrap">
      <div className="cal-daycol" aria-hidden="true">
        <div className="cal-month-spacer" />
        {DAY_INITIALS.map((d, i) => <div key={i} className="cal-dayname">{d}</div>)}
      </div>
      <div className="cal" role="img" aria-label="Training consistency over the last 24 weeks">
        {cols.map(c => (
          <div className="cal-col" key={c.weekIdx}>
            <div className="cal-month">{c.monthLabel}</div>
            <div className="cal-week">
              {c.days.map((day, i) => (
                <div
                  key={i}
                  className={'cal-cell' + (day.isToday ? ' today' : '') + (day.future ? ' future' : '')}
                  style={{ background: day.future ? 'transparent' : calLevel(day.level) }}
                  aria-label={cellLabel(day.date, i, day.sets, day.trained, day.future)}
                  title={cellLabel(day.date, i, day.sets, day.trained, day.future)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
