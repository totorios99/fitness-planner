'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Icon } from '@/components/Icon'
import { muscleGroup } from '@/lib/muscles'

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SETS_PER_EXERCISE = 3

const MUSCLE_DEFS = [
  { id: 'chest',     label: 'Chest',     color: 'var(--m-chest)'     },
  { id: 'back',      label: 'Back',      color: 'var(--m-back)'      },
  { id: 'shoulders', label: 'Shoulders', color: 'var(--m-shoulders)' },
  { id: 'arms',      label: 'Arms',      color: 'var(--m-arms)'      },
  { id: 'legs',      label: 'Legs',      color: 'var(--m-legs)'      },
  { id: 'core',      label: 'Core',      color: 'var(--m-core)'      },
]
const DEFAULT_TARGETS: Record<string, number> = {
  chest: 12, back: 14, shoulders: 12, arms: 10, legs: 16, core: 8,
}

function loadTargets(): Record<string, number> {
  try {
    const s = localStorage.getItem('forma-muscle-targets')
    return s ? { ...DEFAULT_TARGETS, ...JSON.parse(s) } : { ...DEFAULT_TARGETS }
  } catch { return { ...DEFAULT_TARGETS } }
}

interface MuscleMeta { id: string; color: string; label: string; target: number }
function withTargets(targets: Record<string, number>): MuscleMeta[] {
  return MUSCLE_DEFS.map(m => ({ ...m, target: targets[m.id] ?? DEFAULT_TARGETS[m.id] }))
}

type SlotType = 'lifting' | 'mobility'
interface ExerciseMin { name: string; primaryMuscles: string; secondaryMuscles: string }
interface RoutineExMin { exercise: ExerciseMin }
interface RoutineDayFull {
  id: string; label: string; dayIndex: number
  routine: { id: string; name: string; type: SlotType }
  exercises: RoutineExMin[]
}
interface SlotData {
  id: string; dayOfWeek: number; type: SlotType
  routineDay: RoutineDayFull | null
}
interface RoutineData {
  id: string; name: string; type: SlotType; daysPerWeek: number
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
  const acc: Record<string, number> = Object.fromEntries(MUSCLE_DEFS.map(m => [m.id, 0]))
  for (const slot of slots) {
    if (!slot.routineDay) continue
    for (const re of slot.routineDay.exercises) {
      for (const m of parseMuscles(re.exercise.primaryMuscles)) acc[muscleGroup(m)] += SETS_PER_EXERCISE
      for (const m of parseMuscles(re.exercise.secondaryMuscles)) acc[muscleGroup(m)] += SETS_PER_EXERCISE * 0.5
    }
  }
  const vol: Record<string, number> = {}
  for (const id in acc) vol[id] = Math.ceil(acc[id])
  return vol
}

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function localToIso(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function addDays(iso: string, n: number) {
  const d = isoToLocal(iso); d.setDate(d.getDate() + n); return d
}
function weekLabel(weekStart: string) {
  const mon = addDays(weekStart, 0), sun = addDays(weekStart, 6)
  const mShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' })
  return `${mShort(mon)} ${mon.getDate()} – ${mon.getMonth() !== sun.getMonth() ? mShort(sun) + ' ' : ''}${sun.getDate()}`
}

// ── Summary ──
function Summary({
  slots, muscles, targets, onTargetChange,
}: {
  slots: SlotData[]
  muscles: MuscleMeta[]
  targets: Record<string, number>
  onTargetChange: (id: string, val: number) => void
}) {
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const sessions = slots.filter(s => s.routineDay).length
  const sets = slots.reduce((a, s) => a + (s.routineDay?.exercises.length ?? 0) * SETS_PER_EXERCISE, 0)
  const minutes = sets * 3 + sessions * 9
  const hrs = Math.floor(minutes / 60), mins = minutes % 60
  const timeStr = minutes >= 60 ? `${hrs}h${mins ? ` ${mins}m` : ''}` : sessions ? `${minutes}m` : '—'
  const vol = computeVolume(slots)

  return (
    <div className="summary">
      <div className="summary-row">
        <div className="summary-stat">
          <span className="s-label">Sessions</span>
          <span className="s-value num">{sessions}<small>this week</small></span>
        </div>
        <div className="summary-stat">
          <span className="s-label">Total sets</span>
          <span className="s-value num">{sets}</span>
        </div>
        <div className="summary-stat">
          <span className="s-label">Est. time</span>
          <span className="s-value num">{timeStr}</span>
        </div>
        <div className="summary-stat balance">
          <span className="s-label">Muscle balance</span>
          <div className="mini-balance">
            {muscles.map(m => {
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
            <VolumeRing vol={vol} muscles={muscles} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="muscle-grid-head">
                <span className="section-label">Weekly targets</span>
                <button
                  className={`target-edit-btn${editing ? ' active' : ''}`}
                  onClick={() => setEditing(e => !e)}
                  title={editing ? 'Done editing' : 'Edit targets'}
                >
                  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  {editing ? 'Done' : 'Edit targets'}
                </button>
              </div>
              <div className="muscle-grid">
                {muscles.map(m => (
                  <MuscleMeterRow
                    key={m.id} m={m} val={vol[m.id] ?? 0}
                    editing={editing}
                    onTargetChange={onTargetChange}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VolumeRing({ vol, muscles }: { vol: Record<string, number>; muscles: MuscleMeta[] }) {
  const size = 132, r = (size - 18) / 2, circ = Math.PI * 2 * r
  const total = muscles.reduce((a, m) => a + (vol[m.id] ?? 0), 0) || 1
  let off = 0
  const segs = muscles.map(m => {
    const frac = (vol[m.id] ?? 0) / total
    const dash = Math.max(0, frac * circ - 4)
    const el = (
      <circle key={m.id} cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={m.color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off} strokeLinecap="round"
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

function MuscleMeterRow({
  m, val, editing, onTargetChange,
}: {
  m: MuscleMeta; val: number; editing: boolean; onTargetChange: (id: string, v: number) => void
}) {
  const [draft, setDraft] = useState(String(m.target))
  const [warn, setWarn] = useState(false)

  useEffect(() => { setDraft(String(m.target)) }, [m.target])

  const status = muscleStatus(val, m.target)
  const pct = Math.min(100, (val / (m.target * 1.6)) * 100)
  const targetPct = (m.target / (m.target * 1.6)) * 100
  const label = status === 'low' ? 'Low' : status === 'high' ? 'High' : 'On target'

  function commitTarget(raw: string) {
    const n = parseInt(raw, 10)
    if (isNaN(n) || n < 2) { setDraft(String(m.target)); setWarn(false); return }
    setWarn(n > 30)
    onTargetChange(m.id, n)
  }

  return (
    <div className="muscle-meter">
      <div className="muscle-meter-top">
        <span className="muscle-meter-name">
          <span className="muscle-dot" style={{ background: m.color }} /> {m.label}
        </span>
        {editing ? (
          <div className="target-input-wrap">
            {warn && <span className="target-warn" title="Above 30 sets may be excessive">⚠</span>}
            <input
              className="target-input"
              type="number" min={2} max={60}
              value={draft}
              onChange={e => { setDraft(e.target.value); setWarn(parseInt(e.target.value, 10) > 30) }}
              onBlur={e => commitTarget(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitTarget((e.target as HTMLInputElement).value) }}
            />
            <span className="target-input-unit">sets</span>
          </div>
        ) : (
          <span className="muscle-meter-val"><b>{val}</b> / {m.target}</span>
        )}
      </div>
      <div className="muscle-track">
        <div className="muscle-fill" style={{ width: `${pct}%`, background: m.color }} />
        <div className="muscle-target-mark" style={{ left: `${targetPct}%` }} />
      </div>
      <span className={`muscle-status ms-${status}`}>{label}</span>
    </div>
  )
}

function MPill({ muscleId, muscleMap }: { muscleId: string; muscleMap: Record<string, MuscleMeta> }) {
  const m = muscleMap[muscleId]
  if (!m) return null
  return <span className="m-pill" style={{ background: m.color }}>{m.label}</span>
}

// ── Day column ──
type DragPayload = { kind: 'lib'; routineDay: RoutineDayFull } | { kind: 'move'; slotId: string; dayKey: string; routineDay: RoutineDayFull }
type ArmedState = DragPayload

function DayCol({
  dayKey, date, slots, today, armed, hover, defaultKeys,
  onPlace, onRemove, onToggleRest, onSessionDown, onPick,
  muscleMap,
}: {
  dayKey: string; date: Date; slots: SlotData[]; today: boolean
  armed: ArmedState | null; hover: boolean
  defaultKeys: Set<string>
  onPlace: (key: string) => void
  onRemove: (slotId: string) => void
  onToggleRest: (key: string) => void
  onSessionDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  onPick: (key: string) => void
  muscleMap: Record<string, MuscleMeta>
}) {
  const sessions = slots.filter(s => s.routineDay)
  const hasSession = sessions.length > 0
  const full = sessions.some(s => s.type === 'lifting') && sessions.some(s => s.type === 'mobility')
  const cls = ['day']
  if (today) cls.push('today')
  if (hover) cls.push('drop-target')
  else if (armed) cls.push('armed-hint')

  return (
    <div className={cls.join(' ')} data-daykey={dayKey} onClick={() => { if (armed) onPlace(dayKey) }}>
      <div className="day-head">
        <div>
          <div className="day-name">{dayKey}</div>
          <div className="day-date">{date.getDate()}</div>
        </div>
        <div className="day-head-actions">
          {hasSession && (
            <button className="day-mini-btn" title="Clear day"
              onClick={e => { e.stopPropagation(); onToggleRest(dayKey) }}>
              <Icon name="moon" size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="day-body">
        {sessions.map(slot => {
          const day = slot.routineDay!
          const isDefault = defaultKeys.has(`${slot.dayOfWeek}-${day.id}`)
          const topMuscles = [...new Set(day.exercises.flatMap(e => parseMuscles(e.exercise.primaryMuscles)))].slice(0, 3)
          return (
            <div
              key={slot.id}
              className={`session session-${slot.type}${isDefault ? ' session-default' : ''}`}
              onPointerDown={e => onSessionDown(e, { kind: 'move', slotId: slot.id, dayKey, routineDay: day }, e.currentTarget)}
              onClick={e => { if (armed) { e.stopPropagation(); onPlace(dayKey) } }}
            >
              <div className="session-top">
                <div>
                  <div className="session-name">{day.label}</div>
                  <div className="session-focus">{day.routine.name} · {slot.type}</div>
                </div>
                {!isDefault && (
                  <button className="session-remove"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onRemove(slot.id) }}>
                    <Icon name="x" size={14} />
                  </button>
                )}
                {isDefault && (
                  <span className="session-default-mark" title="Default workout — cannot be removed">
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </span>
                )}
              </div>
              {slot.type === 'lifting' && (
                <div className="session-musc">
                  {topMuscles.map(id => <MPill key={id} muscleId={id} muscleMap={muscleMap} />)}
                </div>
              )}
              <div className="session-meta">
                <span><b>{day.exercises.length}</b> ex</span>
                <span className="dot-sep" />
                <span>~{day.exercises.length * 3} sets</span>
              </div>
            </div>
          )
        })}
        {!full && (
          <button className="add-slot"
            onClick={e => { e.stopPropagation(); if (armed) onPlace(dayKey); else onPick(dayKey) }}>
            <Icon name="plus" size={15} />
            {armed ? 'Place here' : hasSession ? 'Add' : 'Add workout'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Library rail ──
function Library({
  routines, open, onClose, onAssign, onChipDown, armed, muscleMap,
}: {
  routines: RoutineData[]; open: boolean
  onClose: () => void
  onAssign: (r: RoutineData) => void
  onChipDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  armed: ArmedState | null
  muscleMap: Record<string, MuscleMeta>
}) {
  const [tab, setTab] = useState<'routines' | 'days'>('routines')
  const [expanded, setExpanded] = useState<string | null>(null)
  const allDays = routines.flatMap(r => r.days.map(d => ({ ...d, routine: { id: r.id, name: r.name, type: r.type } })))

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
              onChipDown={onChipDown} armed={armed} muscleMap={muscleMap} />
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {allDays.map(d => <DayChip key={d.id} day={d} onChipDown={onChipDown} armed={armed} muscleMap={muscleMap} />)}
          </div>
        )}
      </div>
    </aside>
  )
}

function RoutineCard({ routine, expanded, onToggle, onAdd, onChipDown, armed, muscleMap }: {
  routine: RoutineData; expanded: boolean
  onToggle: () => void; onAdd: () => void
  onChipDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  armed: ArmedState | null
  muscleMap: Record<string, MuscleMeta>
}) {
  const [added, setAdded] = useState(false)
  const handleAdd = () => { onAdd(); setAdded(true); setTimeout(() => setAdded(false), 1400) }
  const glyphs: Record<string, string> = { 'upper-lower': 'UL', ppl: 'P', 'full-body': 'FB' }
  const glyph = glyphs[routine.id] ?? routine.name.slice(0, 2).toUpperCase()

  return (
    <div className="routine">
      <div className="routine-head" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div className="routine-glyph">{glyph}</div>
        <div className="routine-info">
          <div className="routine-name">{routine.name}</div>
          <div className="routine-split">{routine.daysPerWeek} days / week</div>
        </div>
        <svg
          className={`routine-chevron${expanded ? ' open' : ''}`}
          viewBox="0 0 24 24" width={15} height={15} fill="none"
          stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <button
          className={`routine-add${added ? ' done' : ''}`}
          onClick={e => { e.stopPropagation(); handleAdd() }}
          title="Add full routine to week"
        >
          <Icon name={added ? 'check' : 'plus'} size={18} />
        </button>
      </div>
      {expanded && (
        <div className="routine-days">
          {routine.days.map(d => <DayChip key={d.id} day={{ ...d, routine: { id: routine.id, name: routine.name, type: routine.type } }} onChipDown={onChipDown} armed={armed} muscleMap={muscleMap} />)}
        </div>
      )}
    </div>
  )
}

function DayChip({ day, onChipDown, armed, muscleMap }: {
  day: RoutineDayFull & { routine: { id: string; name: string; type: SlotType } }
  onChipDown: (e: React.PointerEvent, payload: DragPayload, node: HTMLElement) => void
  armed: ArmedState | null
  muscleMap: Record<string, MuscleMeta>
}) {
  const isArmed = armed?.kind === 'lib' && armed.routineDay.id === day.id
  const muscles = [...new Set(day.exercises.flatMap(e => parseMuscles(e.exercise.primaryMuscles)))]
  return (
    <div className={`day-chip${isArmed ? ' armed' : ''}`}
      onPointerDown={e => onChipDown(e, { kind: 'lib', routineDay: day }, e.currentTarget)}>
      <span className="day-chip-grip"><Icon name="grip" size={16} /></span>
      <div className="day-chip-info">
        <div className="day-chip-name">{day.label}</div>
        <div className="day-chip-focus">{day.exercises.length} exercises · {day.routine.name}</div>
      </div>
      <div className="day-chip-musc">
        {muscles.slice(0, 3).map(id => {
          const m = muscleMap[id]
          return m ? <span key={id} className="muscle-dot" title={m.label} style={{ background: m.color, width: 7, height: 7 }} /> : null
        })}
      </div>
    </div>
  )
}

function Toast({ msg, onUndo }: { msg: string; onUndo?: () => void }) {
  return (
    <div className="toast">
      <Icon name="check" size={15} />
      <span>{msg}</span>
      {onUndo && (
        <button style={{ color: 'var(--accent-2)', fontWeight: 700, textDecoration: 'underline' }} onClick={onUndo}>Undo</button>
      )}
    </div>
  )
}

// ── Main ──
interface TemplateSlotData { dayOfWeek: number; type: SlotType; routineDayId: string | null }

export default function PlannerClient({
  routines, initialSlots, initialTemplate, initialWeekStart,
}: {
  routines: RoutineData[]
  initialSlots: SlotData[]
  initialTemplate: TemplateSlotData[]
  initialWeekStart: string
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart)
  const [slots, setSlots] = useState<SlotData[]>(initialSlots)
  const [hasDefault, setHasDefault] = useState(initialTemplate.length > 0)
  const [railOpen, setRailOpen] = useState(false)
  const [pickFor, setPickFor] = useState<string | null>(null)
  const [armed, setArmed] = useState<ArmedState | null>(null)
  const [todayKey, setTodayKey] = useState<string | null>(null)
  const [hoverDay, setHoverDay] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null)
  const [targets, setTargets] = useState<Record<string, number>>(DEFAULT_TARGETS)

  // Load targets from localStorage after mount
  useEffect(() => { setTargets(loadTargets()) }, [])
  useEffect(() => {
    try { localStorage.setItem('forma-muscle-targets', JSON.stringify(targets)) } catch {}
  }, [targets])

  const muscles = withTargets(targets)
  const muscleMap = Object.fromEntries(muscles.map(m => [m.id, m]))

  function handleTargetChange(id: string, val: number) {
    setTargets(prev => ({ ...prev, [id]: val }))
  }

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoRef = useRef<SlotData[]>([])

  // default slot keys for lock detection: "dayOfWeek-routineDayId"
  const defaultKeys = new Set(
    initialTemplate.filter(t => t.routineDayId).map(t => `${t.dayOfWeek}-${t.routineDayId}`)
  )

  useEffect(() => {
    const d = new Date()
    setTodayKey(d.getDay() === 0 ? 'Sun' : DAY_KEYS[d.getDay() - 1])
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setArmed(null) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  function showToast(msg: string, undo?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, undo })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  const loadWeek = useCallback(async (ws: string) => {
    const res = await fetch(`/api/planner?weekStart=${ws}`)
    setSlots(await res.json())
  }, [])

  function shiftWeek(dir: number) {
    const d = isoToLocal(weekStart); d.setDate(d.getDate() + dir * 7)
    const next = localToIso(d)
    setWeekStart(next); loadWeek(next)
  }

  async function assignSlot(dayOfWeek: number, routineDayId: string, type: SlotType) {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, dayOfWeek, routineDayId, type }),
    })
    const slot: SlotData = await res.json()
    setSlots(prev => [...prev.filter(s => !(s.dayOfWeek === dayOfWeek && s.type === type)), slot])
    return slot
  }

  async function removeSlot(slotId: string) {
    await fetch(`/api/planner/${slotId}`, { method: 'DELETE' })
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  async function pickAssign(routineDayId: string, type: SlotType) {
    if (!pickFor) return
    await assignSlot(DAY_KEYS.indexOf(pickFor), routineDayId, type)
    setPickFor(null); showToast('Workout added')
  }

  async function saveAsDefault() {
    const tmpl = slots.filter(s => s.routineDay)
      .map(s => ({ dayOfWeek: s.dayOfWeek, type: s.type, routineDayId: s.routineDay!.id }))
    await fetch('/api/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: tmpl }),
    })
    setHasDefault(true)
    showToast(`Default week saved · ${tmpl.length} workouts`)
  }

  const DISTRIBUTION: Record<number, number[]> = {
    1: [2], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6],
  }
  async function addRoutine(routine: RoutineData) {
    undoRef.current = [...slots]
    const slots_ = DISTRIBUTION[routine.days.length] ?? routine.days.map((_, i) => i)
    await Promise.all(routine.days.map((day, i) => assignSlot(slots_[i] ?? i, day.id, routine.type)))
    await loadWeek(weekStart)
    showToast(`${routine.name} added · ${routine.days.length} sessions placed`, async () => { await loadWeek(weekStart) })
  }

  // ── Drag ──
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
      if (Math.hypot(e.clientX - c.x, e.clientY - c.y) < 7) return
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
    const c = drag.current.candidate, started = drag.current.started
    if (drag.current.ghost) { drag.current.ghost.remove(); drag.current.ghost = null }
    if (c?.node) c.node.classList.remove('dragging')
    document.body.style.userSelect = ''
    drag.current.candidate = null; drag.current.started = false
    if (!c) return
    if (!started) { setArmed(c.payload); return }
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const dayEl = el?.closest('[data-daykey]')
    setHoverDay(null)
    if (!dayEl) return
    await handlePlace(dayEl.getAttribute('data-daykey')!, c.payload)
  }

  async function handlePlace(dayKey: string, payload: ArmedState) {
    const dow = DAY_KEYS.indexOf(dayKey)
    if (payload.kind === 'lib') {
      await assignSlot(dow, payload.routineDay.id, payload.routineDay.routine.type)
    } else {
      await removeSlot(payload.slotId)
      await assignSlot(dow, payload.routineDay.id, payload.routineDay.routine.type)
    }
    setArmed(null); await loadWeek(weekStart)
  }

  async function placeArmed(dayKey: string) {
    if (!armed) return
    await handlePlace(dayKey, armed)
  }

  async function toggleRest(dayKey: string) {
    const dow = DAY_KEYS.indexOf(dayKey)
    const toRemove = slots.filter(s => s.dayOfWeek === dow && s.routineDay)
    await Promise.all(toRemove.map(s => fetch(`/api/planner/${s.id}`, { method: 'DELETE' })))
    await loadWeek(weekStart)
  }

  async function clearWeek() {
    undoRef.current = [...slots]
    const withDay = slots.filter(s => s.routineDay)
    await Promise.all(withDay.map(s => fetch(`/api/planner/${s.id}`, { method: 'DELETE' })))
    await loadWeek(weekStart)
    showToast('Week cleared', async () => {
      for (const s of undoRef.current) {
        if (s.routineDay) await assignSlot(s.dayOfWeek, s.routineDay.id, s.type)
      }
      await loadWeek(weekStart)
    })
  }

  const slotsByKey = Object.fromEntries(
    DAY_KEYS.map((k, i) => [k, slots.filter(s => s.dayOfWeek === i && s.routineDay)])
  )
  const isCurWeek = weekStart === initialWeekStart
  const label = weekLabel(weekStart)

  return (
    <>
      <div className="workspace">
        <div className="board-col">
          <div className="board-head">
            <div>
              <div className="board-eyebrow">
                Week of {label}
                {hasDefault && (
                  <button
                    className="default-mark"
                    onClick={saveAsDefault}
                    title="This week is your default — click to update"
                  >
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Default
                  </button>
                )}
                {!hasDefault && (
                  <button className="default-mark default-mark-empty" onClick={saveAsDefault} title="Save this week as your default template">
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Save as default
                  </button>
                )}
              </div>
              <h1 className="board-title">Plan your <em>week</em></h1>
            </div>
            <div className="board-head-actions">
              <div className="week-nav">
                <button onClick={() => shiftWeek(-1)} aria-label="Previous week"><Icon name="left" size={17} /></button>
                <span className="wk-label">{label}</span>
                <button onClick={() => shiftWeek(1)} aria-label="Next week"><Icon name="right" size={17} /></button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={clearWeek}>
                <Icon name="x" size={15} /> Clear
              </button>
            </div>
          </div>

          <Summary slots={slots} muscles={muscles} targets={targets} onTargetChange={handleTargetChange} />

          <div className="board">
            {DAY_KEYS.map((k, i) => (
              <DayCol key={k} dayKey={k} date={addDays(weekStart, i)}
                slots={slotsByKey[k]} today={isCurWeek && k === todayKey}
                armed={armed} hover={hoverDay === k}
                defaultKeys={defaultKeys}
                onPlace={placeArmed} onRemove={removeSlot}
                onToggleRest={toggleRest} onSessionDown={startDragCandidate}
                onPick={() => setPickFor(k)} muscleMap={muscleMap} />
            ))}
          </div>
        </div>

        <Library routines={routines} open={railOpen} onClose={() => setRailOpen(false)}
          onAssign={addRoutine} onChipDown={startDragCandidate} armed={armed} muscleMap={muscleMap} />
      </div>

      <button className="mobile-fab" onClick={() => setRailOpen(true)}>
        <Icon name="plus" size={18} /> Add workout
      </button>
      {railOpen && <div className="sheet-backdrop" onClick={() => setRailOpen(false)} />}

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
                      const ms = [...new Set(d.exercises.flatMap(e => parseMuscles(e.exercise.primaryMuscles)))]
                      return (
                        <button key={d.id} className="day-chip" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                          onClick={() => pickAssign(d.id, r.type)}>
                          <div className="day-chip-info">
                            <div className="day-chip-name">{d.label}</div>
                            <div className="day-chip-focus">{d.exercises.length} exercises</div>
                          </div>
                          <div className="day-chip-musc">
                            {ms.slice(0, 3).map(id => {
                              const m = muscleMap[id]
                              return m ? <span key={id} className="muscle-dot" style={{ background: m.color, width: 7, height: 7 }} /> : null
                            })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {routines.length === 0 && <p style={{ color: 'var(--ink-3)' }}>No routines yet. Create one first.</p>}
            </div>
          </div>
        </div>
      )}

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
