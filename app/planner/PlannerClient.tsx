'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { parseMuscles, muscleLabel } from '@/lib/muscles'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface ExerciseMini { name: string; primaryMuscles: string }
interface RoutineExMini { exercise: ExerciseMini }
interface RoutineDayData {
  id: string; label: string
  routine: { id: string; name: string }
  exercises: RoutineExMini[]
}
interface SlotData {
  id: string; dayOfWeek: number; routineDay: RoutineDayData | null
}
interface RoutineData {
  id: string; name: string; days: RoutineDayData[]
}

function addDays(iso: string, n: number): Date {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d
}

function DraggableDay({ day }: { day: RoutineDayData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: day.id, data: { day } })
  const muscles = [...new Set(day.exercises.flatMap(e => parseMuscles(e.exercise.primaryMuscles)))]
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="draggable-day"
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
    >
      <div style={{ fontWeight: 700, fontSize: 13 }}>{day.label}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{day.routine.name}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
        {day.exercises.length} ex · {muscles.slice(0, 2).map(muscleLabel).join(', ')}
      </div>
    </div>
  )
}

function DroppableCalendarDay({
  dayIndex,
  date,
  slot,
  onRemove,
  onPick,
}: {
  dayIndex: number
  date: Date
  slot: SlotData | null
  onRemove: (slotId: string) => void
  onPick: (dayIndex: number) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${dayIndex}` })
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  return (
    <div
      ref={setNodeRef}
      className={`planner-day${isOver ? ' over' : ''}${isToday ? ' today' : ''}`}
    >
      <div className="planner-day-label">
        <span style={{ fontWeight: isToday ? 700 : 500 }}>{DAY_LABELS[dayIndex]}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 6 }}>
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {slot?.routineDay ? (
        <div className="planner-assigned">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{slot.routineDay.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{slot.routineDay.routine.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              {slot.routineDay.exercises.length} exercises
            </div>
          </div>
          <button
            onClick={() => onRemove(slot.id)}
            style={{ color: 'var(--ink-4)', padding: 4, flexShrink: 0 }}
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ) : (
        <button className="planner-add-btn" onClick={() => onPick(dayIndex)}>
          + Assign
        </button>
      )}
    </div>
  )
}

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
  const [activeDay, setActiveDay] = useState<RoutineDayData | null>(null)
  const [pickerOpen, setPickerOpen] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const loadWeek = useCallback(async (ws: string) => {
    const res = await fetch(`/api/planner?weekStart=${ws}`)
    const data: SlotData[] = await res.json()
    setSlots(data)
  }, [])

  function shiftWeek(dir: number) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dir * 7)
    const next = d.toISOString().split('T')[0]
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
    setSlots(prev => {
      const filtered = prev.filter(s => s.dayOfWeek !== dayOfWeek)
      return [...filtered, slot]
    })
  }

  async function removeSlot(slotId: string) {
    await fetch(`/api/planner/${slotId}`, { method: 'DELETE' })
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveDay(e.active.data.current?.day ?? null)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveDay(null)
    const { active, over } = e
    if (!over) return
    const dayOfWeek = parseInt(over.id.toString().replace('slot-', ''))
    await assignSlot(dayOfWeek, active.id.toString())
  }

  const slotByDay = Object.fromEntries(slots.map(s => [s.dayOfWeek, s]))

  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${addDays(weekStart, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const pickerDay = pickerOpen !== null ? pickerOpen : null

  return (
    <div className="page-inner">
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => shiftWeek(-1)}>‹</button>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{weekLabel}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => shiftWeek(1)}>›</button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DAY_LABELS.map((_, i) => (
            <DroppableCalendarDay
              key={i}
              dayIndex={i}
              date={addDays(weekStart, i)}
              slot={slotByDay[i] ?? null}
              onRemove={removeSlot}
              onPick={d => setPickerOpen(d)}
            />
          ))}
        </div>

        {/* Routine days panel */}
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>Routine Days — drag to assign</div>
          {routines.map(r => (
            <div key={r.id} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {r.name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {r.days.map(day => (
                  <DraggableDay key={day.id} day={{ ...day, routine: { id: r.id, name: r.name } }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeDay && (
            <div className="draggable-day" style={{ boxShadow: 'var(--shadow-lg)', opacity: 0.95 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{activeDay.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{activeDay.routine?.name}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Picker modal */}
      {pickerDay !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
            zIndex: 200, display: 'flex', alignItems: 'flex-end',
          }}
          onClick={() => setPickerOpen(null)}
        >
          <div
            style={{ background: 'var(--bg-elev)', width: '100%', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', padding: 20, maxHeight: '70vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Assign to {DAY_LABELS[pickerDay]} {addDays(weekStart, pickerDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            {routines.map(r => (
              <div key={r.id} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase' }}>{r.name}</div>
                {r.days.map(day => (
                  <button
                    key={day.id}
                    onClick={async () => {
                      await assignSlot(pickerDay, day.id)
                      setPickerOpen(null)
                    }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px',
                      background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)',
                      marginBottom: 6, display: 'block',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{day.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{day.exercises.length} exercises</div>
                  </button>
                ))}
              </div>
            ))}
            <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setPickerOpen(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
