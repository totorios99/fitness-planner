'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Icon } from '@/components/Icon'
import { muscleGroup } from '@/lib/muscles'

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Planner estimates this many working sets per exercise (no per-set data in routines).
const SETS_PER_EXERCISE = 3

const MUSCLES = [
  { id: 'chest',     label: 'Chest',     color: 'var(--m-chest)',     target: 12 },
  { id: 'back',      label: 'Back',      color: 'var(--m-back)',      target: 14 },
  { id: 'shoulders', label: 'Shoulders', color: 'var(--m-shoulders)', target: 12 },
  { id: 'arms',      label: 'Arms',      color: 'var(--m-arms)',      target: 10 },
  { id: 'legs',      label: 'Legs',      color: 'var(--m-legs)',      target: 16 },
  { id: 'core',      label: 'Core',      color: 'var(--m-core)',      target:  8 },
]
const MUSCLE_MAP = Object.fromEntries(MUSCLES.map(m => [m.id, m]))

// ── Types matching Prisma / API shape ──
interface MuscleMeta { id: string; color: string; label: string; target: number }

interface ExerciseMin { name: string; primaryMuscles: string; secondaryMuscles: string }
interface RoutineExMin { exercise: ExerciseMin }
interface RoutineDayFull {
  id: string; label: string; dayIndex: number
  routine: { id: string; name: string }
  exercises: RoutineExMin[]
}
interface SlotData {
  id: string; dayOfWeek: number
  routineDay: RoutineDayFull | null
}
interface RoutineData {
  id: string; name: string; daysPerWeek: number
  days: RoutineDayFull[]
}

function parseMuscles(json: string): string[] {
  try { return JSON.parse(json) } catch { return [] }
}

function muscleStatus(val: number, target: number) {
  if (val < target * 0.6) return 'low'
  if (val > target * 1.45) return 'high'
  return 'good'
}

function computeVolume(slots: SlotData[]) {
  // Fractional accumulation; primary = 1×sets, secondary = 0.5×sets per muscle group.
  const acc: Record<string, number> = Object.fromEntries(MUSCLES.map(m => [m.id, 0]))
  for (const slot of slots) {
    if (!slot.routineDay) continue
    for (const re of slot.routineDay.exercises) {
      for (const m of parseMuscles(re.exercise.primaryMuscles)) {
        acc[muscleGroup(m)] += SETS_PER_EXERCISE
      }
      for (const m of parseMuscles(re.exercise.secondaryMuscles)) {
        acc[muscleGroup(m)] += SETS_PER_EXERCISE * 0.5
      }
    }
  }
  // Round each group up to a whole set count
  const vol: Record<string, number> = {}
  for (const id in acc) vol[id] = Math.ceil(acc[id])
  return vol
}

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function localToIso(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function addDays(iso: string, n: number) {
  const d = isoToLocal(iso)
  d.setDate(d.getDate() + n)
  return d
}

function weekLabel(weekStart: string) {
  const mon = addDays(weekStart, 0)
  const sun = addDays(weekStart, 6)
  const mShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' })
  const crossMonth = mon.getMonth() !== sun.getMonth()
  return `${mShort(mon)} ${mon.getDate()} – ${crossMonth ? mShort(sun) + ' ' : ''}${sun.getDate()}`
}

// ── Summary bar ──
function Summary({ slots, viz }: { slots: SlotData[]; viz: 'rings' | 'bars' }) {
  const [open, setOpen] = useState(true)
  const sessions = slots.filter(s => s.routineDay).length
  const sets = slots.reduce((a, s) => a + (s.routineDay?.exercises.length ?? 0) * SETS_PER_EXERCISE, 0)
  const vol = computeVolume(slots)

  return (
    <div className="summary">
      <div className="summary-row">
        <div className="summary-stat">
          <span className="s-label">Sessions</span>
          <span className="s-value num">{sessions}<small>this week</small></span>
        </div>
        <div className="summary-stat">
          <span className="s-label">Est. sets</span>
          <span className="s-value num">{sets}</span>
        </div>
        <div className="summary-stat balance">
          <span className="s-label">Muscle balance</span>
          <div className="mini-balance">
            {MUSCLES.map(m => {
              const v = vol[m.id] ?? 0
              const h = Math.max(2, Math.min(30, (v / (m.target * 1.3)) * 30))
              const st = muscleStatus(v, m.target)
              return (
                <div key={m.id} className="mini-bal-col" title={`${m.label}: ${v} sets`}>
                  <div className="mini-bal-bar" style={{ height: h, background: m.color, opacity: st === 'low' ? 0.4 : 1 }} />
                </div>
              )
            })}
          </div>
        </div>
        <button className={`summary-toggle${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
          {open ? 'Hide' : 'Detail'}
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="summary-detail">
          <div style={{ display: 'flex', gap: 26, alignItems: 'center', padding: 18, flexWrap: 'wrap' }}>
            <VolumeRing vol={vol} />
            <div className="muscle-grid" style={{ flex: 1, padding: 0, minWidth: 260 }}>
              {MUSCLES.map(m => <MuscleMeterRow key={m.id} m={m} val={vol[m.id] ?? 0} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VolumeRing({ vol }: { vol: Record<string, number> }) {
  const size = 132
  const r = (size - 18) / 2
  const circ = Math.PI * 2 * r
  const total = MUSCLES.reduce((a, m) => a + (vol[m.id] ?? 0), 0) || 1
  const gap = 4
  let off = 0
  const segs = MUSCLES.map(m => {
    const v = vol[m.id] ?? 0
    const frac = v / total
    const dash = Math.max(0, frac * circ - gap)
    const el = (
      <circle key={m.id} cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={m.color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-off} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s var(--ease), stroke-dashoffset .6s var(--ease)' }} />
    )
    off += frac * circ
    return el
  })
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={9} />
        {segs}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="num" style={{ fontFamily: 'var(--font-serif)', fontSize: 30, lineHeight: 1, color: 'var(--ink)' }}>{total}</span>
        <span style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>weekly sets</span>
      </div>
    </div>
  )
}

function MuscleMeterRow({ m, val }: { m: MuscleMeta; val: number }) {
  const status = muscleStatus(val, m.target)
  const pct = Math.min(100, (val / (m.target * 1.6)) * 100)
  const targetPct = (m.target / (m.target * 1.6)) * 100
  const label = status === 'low' ? 'Low' : status === 'high' ? 'High' : 'On target'
  return (
    <div className="muscle-meter">
      <div className="muscle-meter-top">
        <span className="muscle-meter-name">
          <span className="muscle-dot" style={{ background: m.color }} /> {m.label}
        </span>
        <span className="muscle-meter-val"><b>{val}</b> / {m.target}</span>
      </div>
      <div className="muscle-track">
        <div className="muscle-fill" style={{ width: `${pct}%`, background: m.color }} />
        <div className="muscle-target-mark" style={{ left: `${targetPct}%` }} />
      </div>
      <span className={`muscle-status ms-${status}`}>{label}</span>
    </div>
  )
}

// ── Muscle pill ──
function MPill({ muscleId }: { muscleId: string }) {
  const m = MUSCLE_MAP[muscleId]
  if (!m) return null
  return <span className="m-pill" style={{ background: m.color }}>{m.label}</span>
}

// ── Day column ──
function DayCol({
  dayKey, date, slot, today, armed, hover,
  onPlace, onRemove, onToggleRest, onSessionDown, onPick,
}: {
  dayKey: string; date: Date; slot: SlotData | null; today: boolean
  armed: ArmedState | null; hover: boolean
  onPlace: (key: string) => void
  onRemove: (slotId: string) => void
  onToggleRest: (key: string) => void
  onSessionDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  onPick: (key: string) => void
}) {
  const hasSession = !!slot?.routineDay
  const isRest = slot ? !slot.routineDay && slot.id.startsWith('rest-') : false
  const armedHint = !!armed && !isRest

  const cls = ['day']
  if (today) cls.push('today')
  if (isRest) cls.push('rest')
  if (hover) cls.push('drop-target')
  else if (armedHint) cls.push('armed-hint')

  const day = slot?.routineDay
  const muscles = day ? [...new Set(day.exercises.flatMap(e => parseMuscles(e.exercise.primaryMuscles)))] : []
  const topMuscles = muscles.slice(0, 3)

  return (
    <div className={cls.join(' ')} data-daykey={dayKey} onClick={() => { if (armed) onPlace(dayKey) }}>
      <div className="day-head">
        <div>
          <div className="day-name">{dayKey}</div>
          <div className="day-date">{date.getDate()}</div>
        </div>
        <div className="day-head-actions">
          <button
            className={`day-mini-btn${isRest ? ' active' : ''}`}
            title={isRest ? 'Mark as training day' : 'Mark as rest day'}
            onClick={e => { e.stopPropagation(); onToggleRest(dayKey) }}
          >
            <Icon name="moon" size={14} />
          </button>
        </div>
      </div>
      <div className="day-body">
        {isRest ? (
          <div className="rest-label">
            <span className="rest-title">Rest</span>
            <span className="rest-sub">Recovery day</span>
          </div>
        ) : (
          <>
            {hasSession && day && (
              <div
                className="session"
                onPointerDown={e => {
                  if (!slot) return
                  onSessionDown(e, { kind: 'move', slotId: slot.id, dayKey, routineDay: day }, e.currentTarget)
                }}
                onClick={e => { if (armed) { e.stopPropagation(); onPlace(dayKey) } }}
              >
                <div className="session-top">
                  <div>
                    <div className="session-name">{day.label}</div>
                    <div className="session-focus">{day.routine.name}</div>
                  </div>
                  <button
                    className="session-remove"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); if (slot) onRemove(slot.id) }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
                <div className="session-musc">
                  {topMuscles.map(id => <MPill key={id} muscleId={id} />)}
                </div>
                <div className="session-meta">
                  <span><b>{day.exercises.length}</b> ex</span>
                  <span className="dot-sep" />
                  <span>~{day.exercises.length * 3} sets</span>
                </div>
              </div>
            )}
            <button
              className="add-slot"
              onClick={e => { e.stopPropagation(); if (armed) onPlace(dayKey); else onPick(dayKey) }}
            >
              <Icon name="plus" size={15} />
              {armed ? 'Place here' : hasSession ? 'Add' : 'Add workout'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Routine Library rail ──
type DragPayload = { kind: 'lib'; routineDay: RoutineDayFull } | { kind: 'move'; slotId: string; dayKey: string; routineDay: RoutineDayFull }
type ArmedState = DragPayload

function Library({
  routines, open, onClose, onAssign, onChipDown, armed,
}: {
  routines: RoutineData[]; open: boolean
  onClose: () => void
  onAssign: (r: RoutineData) => void
  onChipDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  armed: ArmedState | null
}) {
  const [tab, setTab] = useState<'routines' | 'days'>('routines')
  const [expanded, setExpanded] = useState<string | null>(null)

  const allDays = routines.flatMap(r => r.days.map(d => ({ ...d, routine: { id: r.id, name: r.name } })))

  return (
    <aside className={`rail${open ? ' open' : ''}`}>
      <div className="rail-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="rail-title">Library</div>
            <div className="rail-sub">Add a routine or drag single days</div>
          </div>
          <button className="icon-btn rail-mobile-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="rail-tabs">
          <button className={`rail-tab${tab === 'routines' ? ' active' : ''}`} onClick={() => setTab('routines')}>Routines</button>
          <button className={`rail-tab${tab === 'days' ? ' active' : ''}`} onClick={() => setTab('days')}>All days</button>
        </div>
      </div>
      <div className="rail-body">
        {tab === 'routines' ? (
          routines.map(r => (
            <RoutineCard key={r.id} routine={r}
              expanded={expanded === r.id}
              onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
              onAdd={() => { onAssign(r); onClose() }}
              onChipDown={onChipDown} armed={armed} />
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {allDays.map(d => <DayChip key={d.id} day={d} onChipDown={onChipDown} armed={armed} />)}
          </div>
        )}
      </div>
    </aside>
  )
}

function RoutineCard({ routine, expanded, onToggle, onAdd, onChipDown, armed }: {
  routine: RoutineData; expanded: boolean
  onToggle: () => void; onAdd: () => void
  onChipDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  armed: ArmedState | null
}) {
  const [added, setAdded] = useState(false)
  const handleAdd = () => { onAdd(); setAdded(true); setTimeout(() => setAdded(false), 1400) }
  const glyphs: Record<string, string> = { 'upper-lower': 'UL', 'ppl': 'P', 'full-body': 'FB' }
  const glyph = glyphs[routine.id] ?? routine.name.slice(0, 2).toUpperCase()

  return (
    <div className="routine">
      <div className="routine-head" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div className="routine-badge-rnd">{glyph}</div>
        <div className="routine-info-r">
          <div className="routine-name-r">{routine.name}</div>
          <div className="routine-split">{routine.daysPerWeek} days / week</div>
        </div>
        <svg
          className="routine-head-chev"
          viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--ink-4)', flexShrink: 0, transition: 'transform .25s var(--ease-out)', transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <button
          className={`routine-add-btn${added ? ' done' : ''}`}
          onClick={e => { e.stopPropagation(); handleAdd() }}
          title="Add full routine to week"
        >
          <Icon name={added ? 'check' : 'plus'} size={18} />
        </button>
      </div>
      {expanded && (
        <div className="routine-days-list">
          {routine.days.map(d => <DayChip key={d.id} day={{ ...d, routine: { id: routine.id, name: routine.name } }} onChipDown={onChipDown} armed={armed} />)}
        </div>
      )}
    </div>
  )
}

function DayChip({ day, onChipDown, armed }: {
  day: RoutineDayFull & { routine: { id: string; name: string } }
  onChipDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  armed: ArmedState | null
}) {
  const isArmed = armed?.kind === 'lib' && armed.routineDay.id === day.id
  const muscles = [...new Set(day.exercises.flatMap(e => parseMuscles(e.exercise.primaryMuscles)))]

  return (
    <div
      className={`day-chip${isArmed ? ' armed' : ''}`}
      onPointerDown={e => onChipDown(e, { kind: 'lib', routineDay: day }, e.currentTarget)}
    >
      <span className="day-chip-grip"><Icon name="grip" size={16} /></span>
      <div className="day-chip-info">
        <div className="day-chip-name">{day.label}</div>
        <div className="day-chip-focus">{day.exercises.length} exercises · {day.routine.name}</div>
      </div>
      <div className="day-chip-musc">
        {muscles.slice(0, 3).map(id => {
          const m = MUSCLE_MAP[id]
          return m ? <span key={id} className="muscle-dot" title={m.label} style={{ background: m.color, width: 7, height: 7 }} /> : null
        })}
      </div>
    </div>
  )
}

// ── Toast ──
function Toast({ msg, onUndo }: { msg: string; onUndo?: () => void }) {
  return (
    <div className="toast">
      <Icon name="check" size={15} />
      <span>{msg}</span>
      {onUndo && (
        <button style={{ color: 'var(--accent-2)', fontWeight: 700, textDecoration: 'underline' }} onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  )
}

// ── Main PlannerClient ──
export default function PlannerClient({
  routines,
  initialSlots,
  initialWeekStart,
}: {
  routines: RoutineData[]
  initialSlots: SlotData[]
  initialWeekStart: string
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart)
  const [slots, setSlots] = useState<SlotData[]>(initialSlots)
  const [railOpen, setRailOpen] = useState(false)
  const [pickFor, setPickFor] = useState<string | null>(null)
  const [armed, setArmed] = useState<ArmedState | null>(null)
  // Compute "today" after mount only — avoids server/client clock mismatch that breaks hydration.
  const [todayKey, setTodayKey] = useState<string | null>(null)
  useEffect(() => {
    const d = new Date()
    setTodayKey(d.getDay() === 0 ? 'Sun' : DAY_KEYS[d.getDay() - 1])
  }, [])
  const [hoverDay, setHoverDay] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoRef = useRef<SlotData[]>([])

  const showToast = (msg: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, undo })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  // Escape clears armed
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setArmed(null) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const loadWeek = useCallback(async (ws: string) => {
    const res = await fetch(`/api/planner?weekStart=${ws}`)
    const data = await res.json()
    setSlots(data)
  }, [])

  function shiftWeek(dir: number) {
    const d = isoToLocal(weekStart)
    d.setDate(d.getDate() + dir * 7)
    const next = localToIso(d)
    setWeekStart(next)
    loadWeek(next)
  }

  async function assignSlot(dayOfWeek: number, routineDayId: string) {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, dayOfWeek, routineDayId }),
    })
    const slot: SlotData = await res.json()
    setSlots(prev => [...prev.filter(s => s.dayOfWeek !== dayOfWeek), slot])
    return slot
  }

  async function removeSlot(slotId: string) {
    await fetch(`/api/planner/${slotId}`, { method: 'DELETE' })
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  // Assign a routine day to a specific day via the picker modal
  async function pickAssign(routineDayId: string) {
    if (!pickFor) return
    const dayOfWeek = DAY_KEYS.indexOf(pickFor)
    await assignSlot(dayOfWeek, routineDayId)
    setPickFor(null)
    showToast('Workout added')
  }

  // Distribute full routine across a week (smart spacing)
  const DISTRIBUTION: Record<number, number[]> = {
    1: [2], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6],
  }
  async function addRoutine(routine: RoutineData) {
    undoRef.current = [...slots]
    const slots_ = DISTRIBUTION[routine.days.length] ?? routine.days.map((_, i) => i)
    await Promise.all(routine.days.map((day, i) => {
      const dow = slots_[i] ?? i
      return assignSlot(dow, day.id)
    }))
    await loadWeek(weekStart)
    showToast(`${routine.name} added · ${routine.days.length} sessions placed`, async () => {
      // undo: remove all assigned, restore previous
      await loadWeek(weekStart)
    })
  }

  // ── Drag (pointer-based, no dnd-kit dependency for the new design) ──
  const drag = useRef<{
    candidate: { payload: DragPayload; node: HTMLElement; x: number; y: number } | null
    ghost: HTMLElement | null; started: boolean
  }>({ candidate: null, ghost: null, started: false })

  function startDragCandidate(e: React.PointerEvent, payload: DragPayload, node: HTMLElement) {
    if (e.button === 1 || e.button === 2) return
    drag.current.candidate = { payload, node, x: e.clientX, y: e.clientY }
    drag.current.started = false
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function beginDrag() {
    const c = drag.current.candidate; if (!c) return
    drag.current.started = true
    const rect = c.node.getBoundingClientRect()
    const ghost = c.node.cloneNode(true) as HTMLElement
    ghost.classList.add('drag-ghost')
    ghost.style.width = `${rect.width}px`
    ghost.style.left = `${c.x - 20}px`
    ghost.style.top = `${c.y - 18}px`
    document.body.appendChild(ghost)
    drag.current.ghost = ghost
    c.node.classList.add('dragging')
    document.body.style.userSelect = 'none'
  }

  const onPointerMove = (e: PointerEvent) => {
    const c = drag.current.candidate; if (!c) return
    if (!drag.current.started) {
      const dist = Math.hypot(e.clientX - c.x, e.clientY - c.y)
      if (dist < 7) return
      beginDrag()
    }
    const g = drag.current.ghost
    if (g) { g.style.left = `${e.clientX - 20}px`; g.style.top = `${e.clientY - 18}px` }
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const dayEl = el?.closest('[data-daykey]')
    setHoverDay(dayEl ? dayEl.getAttribute('data-daykey') : null)
  }

  const onPointerUp = async (e: PointerEvent) => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    const c = drag.current.candidate
    const started = drag.current.started
    if (drag.current.ghost) { drag.current.ghost.remove(); drag.current.ghost = null }
    if (c?.node) c.node.classList.remove('dragging')
    document.body.style.userSelect = ''
    drag.current.candidate = null; drag.current.started = false

    if (!c) return
    if (!started) {
      // tap — arm it
      setArmed(c.payload)
      return
    }
    // drop
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const dayEl = el?.closest('[data-daykey]')
    setHoverDay(null)
    if (!dayEl) return
    const toKey = dayEl.getAttribute('data-daykey')!
    const dow = DAY_KEYS.indexOf(toKey)
    await handlePlace(toKey, c.payload, dow)
  }

  async function handlePlace(dayKey: string, payload: ArmedState, dow?: number) {
    const dayOfWeek = dow ?? DAY_KEYS.indexOf(dayKey)
    if (payload.kind === 'lib') {
      await assignSlot(dayOfWeek, payload.routineDay.id)
    } else {
      // move: remove old, assign to new
      await removeSlot(payload.slotId)
      await assignSlot(dayOfWeek, payload.routineDay.id)
    }
    setArmed(null)
    await loadWeek(weekStart)
  }

  async function placeArmed(dayKey: string) {
    if (!armed) return
    await handlePlace(dayKey, armed)
  }

  async function toggleRest(dayKey: string) {
    const dow = DAY_KEYS.indexOf(dayKey)
    const existing = slots.find(s => s.dayOfWeek === dow)
    if (existing?.routineDay) {
      await removeSlot(existing.id)
      await loadWeek(weekStart)
    }
  }

  async function clearWeek() {
    undoRef.current = [...slots]
    await Promise.all(slots.map(s => removeSlot(s.id)))
    setSlots([])
    showToast('Week cleared', async () => {
      // re-assign previous slots
      for (const s of undoRef.current) {
        if (s.routineDay) await assignSlot(s.dayOfWeek, s.routineDay.id)
      }
      await loadWeek(weekStart)
    })
  }

  const slotByKey = Object.fromEntries(
    DAY_KEYS.map((k, i) => [k, slots.find(s => s.dayOfWeek === i) ?? null])
  )

  const isCurWeek = weekStart === initialWeekStart
  const label = weekLabel(weekStart)

  return (
    <>
      <div className="workspace">
        {/* Board column */}
        <div className="board-col">
          <div className="board-head">
            <div>
              <div className="board-eyebrow">Week of {label}</div>
              <h1 className="board-title">Plan your <em>week</em></h1>
            </div>
            <div className="board-head-actions">
              <div className="week-nav">
                <button onClick={() => shiftWeek(-1)} aria-label="Previous week">
                  <Icon name="left" size={17} />
                </button>
                <span className="wk-label">{label}</span>
                <button onClick={() => shiftWeek(1)} aria-label="Next week">
                  <Icon name="right" size={17} />
                </button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={clearWeek}>
                <Icon name="x" size={15} /> Clear
              </button>
            </div>
          </div>

          <Summary slots={slots} viz="rings" />

          <div className="board">
            {DAY_KEYS.map((k, i) => (
              <DayCol
                key={k}
                dayKey={k}
                date={addDays(weekStart, i)}
                slot={slotByKey[k]}
                today={isCurWeek && k === todayKey}
                armed={armed}
                hover={hoverDay === k}
                onPlace={placeArmed}
                onRemove={removeSlot}
                onToggleRest={toggleRest}
                onSessionDown={startDragCandidate}
                onPick={() => setPickFor(k)}
              />
            ))}
          </div>
        </div>

        {/* Library rail */}
        <Library
          routines={routines}
          open={railOpen}
          onClose={() => setRailOpen(false)}
          onAssign={addRoutine}
          onChipDown={startDragCandidate}
          armed={armed}
        />
      </div>

      {/* Mobile FAB */}
      <button className="mobile-fab" onClick={() => setRailOpen(true)}>
        <Icon name="plus" size={18} /> Add workout
      </button>
      {railOpen && <div className="sheet-backdrop" onClick={() => setRailOpen(false)} />}

      {/* Add-workout picker (per-day) */}
      {pickFor && (
        <div className="sheet-wrap" onClick={e => { if (e.target === e.currentTarget) setPickFor(null) }}>
          <div className="sheet-modal">
            <div className="sheet-modal-head">
              <h3>Add workout</h3>
              <button className="icon-btn" onClick={() => setPickFor(null)}><Icon name="x" size={18} /></button>
            </div>
            <div className="sheet-modal-body">
              {routines.map(r => (
                <div key={r.id}>
                  <div className="section-label" style={{ marginBottom: 8 }}>{r.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {r.days.map(d => {
                      const muscles = [...new Set(d.exercises.flatMap(e => parseMuscles(e.exercise.primaryMuscles)))]
                      return (
                        <button
                          key={d.id}
                          className="day-chip"
                          style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                          onClick={() => pickAssign(d.id)}
                        >
                          <div className="day-chip-info">
                            <div className="day-chip-name">{d.label}</div>
                            <div className="day-chip-focus">{d.exercises.length} exercises</div>
                          </div>
                          <div className="day-chip-musc">
                            {muscles.slice(0, 3).map(id => {
                              const m = MUSCLE_MAP[id]
                              return m ? <span key={id} className="muscle-dot" style={{ background: m.color, width: 7, height: 7 }} /> : null
                            })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {routines.length === 0 && (
                <p className="t-body" style={{ color: 'var(--ink-3)' }}>No routines yet. Create one first.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Armed place banner */}
      {armed && (
        <div className="place-banner">
          <Icon name="bolt" size={15} />
          <span>Tap a day to place <b style={{ fontWeight: 700 }}>{armed.routineDay.label}</b></span>
          <button onClick={() => setArmed(null)}>Cancel</button>
        </div>
      )}

      {toast && <Toast msg={toast.msg} onUndo={toast.undo} />}
    </>
  )
}
