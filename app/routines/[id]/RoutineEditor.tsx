'use client'

import { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MuscleTag } from '@/components/MuscleTag'
import { parseMuscles } from '@/lib/muscles'

interface ExerciseData { id: string; name: string; slug: string; primaryMuscles: string; equipment: string }
interface RoutineExData { id: string; orderIndex: number; targetSets: number; targetReps: string; exercise: ExerciseData }
interface RoutineDayData { id: string; label: string; exercises: RoutineExData[] }

function SortableExercise({
  re,
  isLast,
  onUpdate,
  onDelete,
  nextSetsRef,
}: {
  re: RoutineExData
  isLast: boolean
  onUpdate: (id: string, sets: number, reps: string) => void
  onDelete: (id: string) => void
  nextSetsRef?: React.RefObject<HTMLInputElement | null>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: re.id })
  const [sets, setSets] = useState(String(re.targetSets))
  const [reps, setReps] = useState(re.targetReps)
  const setsRef = useRef<HTMLInputElement>(null)
  const repsRef = useRef<HTMLInputElement>(null)
  const primary = parseMuscles(re.exercise.primaryMuscles)

  function commitSets(val: string) {
    const n = Math.max(1, parseInt(val) || 1)
    setSets(String(n))
    onUpdate(re.id, n, reps)
  }

  function commitReps(val: string) {
    const v = val.trim() || re.targetReps
    setReps(v)
    onUpdate(re.id, parseInt(sets) || re.targetSets, v)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex', alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px dashed var(--line)',
        gap: 8,
        background: isDragging ? 'var(--bg-sunken)' : undefined,
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: 'var(--ink-4)', fontSize: 18, flexShrink: 0, touchAction: 'none' }}
      >
        ⠿
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {re.exercise.name}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          {primary.map(m => <MuscleTag key={m} muscle={m} size="xs" />)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <input
          ref={setsRef}
          value={sets}
          inputMode="numeric"
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '')
            setSets(v)
          }}
          onBlur={e => commitSets(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault()
              repsRef.current?.focus()
            }
            if (e.key === 'Enter') repsRef.current?.focus()
          }}
          style={{ width: 36, textAlign: 'center', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '4px', fontSize: 13 }}
        />
        <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>×</span>
        <input
          ref={repsRef}
          value={reps}
          onChange={e => setReps(e.target.value)}
          onBlur={e => commitReps(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Tab' && !e.shiftKey && !isLast) {
              e.preventDefault()
              nextSetsRef?.current?.focus()
            }
            if (e.key === 'Enter') {
              commitReps(reps)
              nextSetsRef?.current?.focus()
            }
            if (e.key === 'Tab' && e.shiftKey) {
              e.preventDefault()
              setsRef.current?.focus()
            }
          }}
          style={{ width: 52, textAlign: 'center', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '4px', fontSize: 13 }}
        />
        <button
          tabIndex={-1}
          onClick={() => onDelete(re.id)}
          style={{ color: 'var(--danger)', fontSize: 18, padding: 4 }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

function DayEditor({
  day,
  exercises,
  allExercises,
  onExercisesChange,
}: {
  day: RoutineDayData
  exercises: RoutineExData[]
  allExercises: ExerciseData[]
  onExercisesChange: (dayId: string, exercises: RoutineExData[]) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Collect refs for sets inputs to wire tab navigation
  const setsRefs = useRef<(HTMLInputElement | null)[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = exercises.findIndex(x => x.id === active.id)
    const newIdx = exercises.findIndex(x => x.id === over.id)
    const next = arrayMove(exercises, oldIdx, newIdx)
    onExercisesChange(day.id, next)
    fetch(`/api/routine-days/${day.id}/exercises`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: next.map(x => x.id) }),
    })
  }, [day.id, exercises, onExercisesChange])

  async function handleUpdate(id: string, targetSets: number, targetReps: string) {
    await fetch(`/api/routine-exercises/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetSets, targetReps }),
    })
  }

  function handleDelete(id: string) {
    fetch(`/api/routine-exercises/${id}`, { method: 'DELETE' })
    onExercisesChange(day.id, exercises.filter(e => e.id !== id))
  }

  async function handleAdd(exerciseId: string) {
    const res = await fetch(`/api/routine-days/${day.id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId }),
    })
    const re: RoutineExData = await res.json()
    onExercisesChange(day.id, [...exercises, re])
    setAddOpen(false)
    setSearch('')
  }

  const filtered = allExercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) &&
    !exercises.some(ex => ex.exercise.id === e.id)
  )

  return (
    <div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {exercises.map((re, i) => {
            const nextRef = { current: setsRefs.current[i + 1] ?? null } as React.RefObject<HTMLInputElement | null>
            return (
              <SortableExercise
                key={re.id}
                re={re}
                isLast={i === exercises.length - 1}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                nextSetsRef={nextRef}
              />
            )
          })}
        </SortableContext>
      </DndContext>

      <div style={{ padding: '10px 16px', borderTop: exercises.length > 0 ? '1px solid var(--line)' : undefined }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setAddOpen(!addOpen)}>
          + Add Exercise
        </button>

        {addOpen && (
          <div style={{ marginTop: 8 }}>
            <input
              className="search-input"
              placeholder="Search exercises…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 8 }}
              autoFocus
            />
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.slice(0, 20).map(ex => (
                <button
                  key={ex.id}
                  onClick={() => handleAdd(ex.id)}
                  style={{
                    textAlign: 'left', padding: '8px 12px',
                    background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{ex.name}</span>
                  <span style={{ color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 }}>{ex.equipment}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: 8 }}>No exercises found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function RoutineEditor({
  routine,
  allExercises,
}: {
  routine: { id: string; name: string; description: string | null; daysPerWeek: number; days: RoutineDayData[] }
  allExercises: ExerciseData[]
}) {
  const [editMode, setEditMode] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(routine.days.map(d => d.id)))

  // Lifted exercises state — keyed by day id. Prevents data loss on collapse.
  const [dayExercises, setDayExercises] = useState<Record<string, RoutineExData[]>>(
    () => Object.fromEntries(routine.days.map(d => [d.id, d.exercises]))
  )

  function handleExercisesChange(dayId: string, exercises: RoutineExData[]) {
    setDayExercises(prev => ({ ...prev, [dayId]: exercises }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          className={`btn btn-sm ${editMode ? 'btn-energy' : 'btn-ghost'}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '✓ Done editing' : '✏ Edit'}
        </button>
      </div>

      {routine.days.map(day => {
        const exercises = dayExercises[day.id] ?? []
        const open = expanded.has(day.id)

        return (
          <div key={day.id} className="card" style={{ marginBottom: 10 }}>
            <div
              className="card-header"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setExpanded(prev => {
                const s = new Set(prev)
                s.has(day.id) ? s.delete(day.id) : s.add(day.id)
                return s
              })}
            >
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{day.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="t-caption">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                <span
                  style={{
                    color: 'var(--ink-3)',
                    display: 'inline-block',
                    transition: 'transform 0.2s ease',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▾
                </span>
              </div>
            </div>

            {/* CSS height animation — never unmounts DayEditor */}
            <div
              style={{
                overflow: 'hidden',
                maxHeight: open ? 3000 : 0,
                opacity: open ? 1 : 0,
                transition: 'max-height 0.28s ease, opacity 0.18s ease',
              }}
            >
              {editMode ? (
                <DayEditor
                  day={day}
                  exercises={exercises}
                  allExercises={allExercises}
                  onExercisesChange={handleExercisesChange}
                />
              ) : (
                <div>
                  {exercises.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-4)' }}>No exercises</div>
                  ) : (
                    exercises.map(re => (
                      <div
                        key={re.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 16px', borderBottom: '1px dashed var(--line)',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{re.exercise.name}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-2)' }}>
                          {re.targetSets} × {re.targetReps}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
