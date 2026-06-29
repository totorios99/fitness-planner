'use client'

import { useState } from 'react'
import type { HeatWeek } from '@/lib/home'
import { calLevel } from '@/lib/cal'

const DAY_INITIALS = ['M', '', 'W', '', 'F', '', '']
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function cellLabel(dayIso: string, dayIdx: number, sets: number, trained: boolean, future: boolean): string {
  const [y, m, d] = dayIso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const human = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (future) return `${human} — upcoming`
  return `${DAY_NAMES[dayIdx]} ${human} — ${trained ? `${sets} sets` : 'rest'}`
}

function mobileLabel(dayIso: string, sets: number, trained: boolean): string {
  const [y, m, d] = dayIso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const human = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return trained ? `${human} — ${sets} sets` : `${human} — rest`
}

function weekLabel(week: HeatWeek): string {
  const [y, m, d] = week.days[0].date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ConsistencyHeatmap({ cols }: { cols: HeatWeek[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const mobileCols = cols.slice(-5)

  return (
    <>
      {/* Desktop: day-label column + 24 week columns */}
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

      {/* Mobile: 7 cols x 5 rows (days across, weeks down) */}
      <div className="cal-mobile-wrap">
        <div className="cal-selected-label">{selected ?? ' '}</div>
        <div className="cal-mobile" role="img" aria-label="Training consistency last 5 weeks">
          <div className="cal-m-row">
            <div className="cal-m-corner" />
            {DAY_LETTERS.map((d, i) => <div key={i} className="cal-m-header">{d}</div>)}
          </div>
          {mobileCols.map(c => (
            <div key={c.weekIdx} className="cal-m-row">
              <div className="cal-m-week-label">{weekLabel(c)}</div>
              {c.days.map((day, i) => (
                <div
                  key={i}
                  className={'cal-cell' + (day.isToday ? ' today' : '') + (day.future ? ' future' : '')}
                  style={{ background: day.future ? 'transparent' : calLevel(day.level) }}
                  aria-label={cellLabel(day.date, i, day.sets, day.trained, day.future)}
                  onClick={() => {
                    if (day.future) return
                    const label = mobileLabel(day.date, day.sets, day.trained)
                    setSelected(s => s === label ? null : label)
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
