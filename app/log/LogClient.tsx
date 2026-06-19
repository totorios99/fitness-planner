'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/Icon'

type RExercise = {
  exerciseId: string
  exercise: { id: string; name: string }
  targetSets: number
  targetReps: string
}

type RDay = {
  id: string
  label: string
  dayIndex: number
  exercises: RExercise[]
}

type Routine = {
  id: string
  name: string
  type: 'lifting' | 'mobility'
  days: RDay[]
}

type Scheduled = { type: 'lifting' | 'mobility'; dayId: string; done: boolean }

type SetEntry = {
  weightLb: string
  reps: string
  done: boolean
}

type ActiveExercise = {
  exerciseId: string
  name: string
  sets: SetEntry[]
}

function buildExercises(dayId: string, routines: Routine[]): ActiveExercise[] {
  for (const r of routines) {
    const day = r.days.find(d => d.id === dayId)
    if (day) {
      return day.exercises.map(e => ({
        exerciseId: e.exerciseId,
        name: e.exercise.name,
        sets: Array.from({ length: Math.max(e.targetSets, 1) }, () => ({
          weightLb: '',
          reps: e.targetReps.replace(/\D.*/, '') || '8',
          done: false,
        })),
      }))
    }
  }
  return []
}

function getDayLabel(dayId: string, routines: Routine[]): string {
  for (const r of routines) {
    const day = r.days.find(d => d.id === dayId)
    if (day) return `${r.name} — ${day.label}`
  }
  return 'Manual Session'
}

function getDayType(dayId: string | null, routines: Routine[]): 'lifting' | 'mobility' {
  if (!dayId) return 'lifting'
  for (const r of routines) {
    if (r.days.some(d => d.id === dayId)) return r.type
  }
  return 'lifting'
}

const DONE_MSG: Record<'lifting' | 'mobility', string> = {
  lifting: 'Lifting session already logged today — strong work. 💪',
  mobility: 'Mobility session already logged today — nicely done. 🧘',
}

export default function LogClient({
  routines,
  scheduled,
  dateStr,
}: {
  routines: Routine[]
  scheduled: Scheduled[]
  dateStr: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [importLoading, setImportLoading] = useState(false)
  const [importDrag, setImportDrag] = useState(false)
  const [importError, setImportError] = useState('')

  // Scheduled slots already logged today → show a motivational note, don't auto-load (no dupes).
  const doneScheduled = scheduled.filter(s => s.done)
  const pending = scheduled.filter(s => !s.done)
  const isScheduled = pending.length > 0
  const initialDayId = pending[0]?.dayId ?? null
  const [activeDayId, setActiveDayId] = useState<string | null>(initialDayId)
  const [exercises, setExercises] = useState<ActiveExercise[]>(() =>
    initialDayId ? buildExercises(initialDayId, routines) : []
  )
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const changeDay = (dayId: string) => {
    setActiveDayId(dayId)
    setExercises(buildExercises(dayId, routines))
  }

  const setVal = (ei: number, si: number, key: 'weightLb' | 'reps', val: string) =>
    setExercises(prev => prev.map((e, i) => i !== ei ? e : {
      ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, [key]: val }),
    }))

  const toggleDone = (ei: number, si: number) =>
    setExercises(prev => prev.map((e, i) => i !== ei ? e : {
      ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, done: !s.done }),
    }))

  const addSet = (ei: number) =>
    setExercises(prev => prev.map((e, i) => i !== ei ? e : {
      ...e, sets: [...e.sets, { ...(e.sets[e.sets.length - 1] ?? { weightLb: '', reps: '8', done: false }), done: false }],
    }))

  const delSet = (ei: number, si: number) =>
    setExercises(prev => prev.map((e, i) => i !== ei ? e : {
      ...e, sets: e.sets.filter((_, j) => j !== si),
    }))

  const doneSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0)
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0)
  const pct = totalSets ? Math.round(doneSets / totalSets * 100) : 0
  const doneVol = exercises.reduce((a, e) =>
    a + e.sets.filter(s => s.done).reduce((b, s) =>
      b + (parseFloat(s.weightLb) || 0) * (parseInt(s.reps) || 0), 0), 0)

  const finish = async () => {
    const exsToSave = exercises
      .map(e => ({ exerciseId: e.exerciseId, name: e.name, sets: e.sets.filter(s => s.done) }))
      .filter(e => e.sets.length)
    if (!exsToSave.length) { showToast('Mark some sets as done first'); return }
    setSaving(true)
    try {
      const label = activeDayId ? getDayLabel(activeDayId, routines) : 'Manual Session'
      const type = getDayType(activeDayId, routines)
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, type, exercises: exsToSave }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/log/${data.sessionId}`)
    } catch {
      showToast('Failed to save session')
      setSaving(false)
    }
  }

  async function handleImportFile(file: File) {
    if (!file.name.endsWith('.txt')) { setImportError('Must be a .txt file from Strong'); return }
    setImportError('')
    setImportLoading(true)
    try {
      const text = await file.text()
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      router.push(`/log/${data.sessionId}`)
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Import failed')
      setImportLoading(false)
    }
  }

  return (
    <div>
      {toast && <div className="log-toast">{toast}</div>}

      <div className="page-head">
        <div>
          <div className="board-eyebrow">{dateStr}</div>
          <h1 className="board-title">Log a <em>session</em></h1>
        </div>
      </div>

      {/* Strong import */}
      <label
        className={`strong-import${importDrag ? ' drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setImportDrag(true) }}
        onDragLeave={() => setImportDrag(false)}
        onDrop={e => {
          e.preventDefault(); setImportDrag(false)
          const f = e.dataTransfer.files[0]; if (f) handleImportFile(f)
        }}
        style={{ cursor: importLoading ? 'default' : 'pointer' }}
      >
        <div className="si-icon"><Icon name="bolt" size={18} /></div>
        <div className="si-text">
          <div className="si-title">{importLoading ? 'Importing…' : 'Import from Strong'}</div>
          <div className="si-sub">Drop or tap a <code>.txt</code> export — auto-matched to library</div>
        </div>
        <Icon name="chevronR" size={16} />
        <input
          ref={fileRef}
          type="file"
          accept=".txt"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f) }}
        />
      </label>
      {importError && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: -10, marginBottom: 10 }}>{importError}</div>}

      {/* Already-logged scheduled sessions — motivational note, no duplicate prompt */}
      {doneScheduled.map(s => (
        <div key={s.type} className="log-done-note">
          <Icon name="check" size={16} /> {DONE_MSG[s.type]}
        </div>
      ))}

      {/* Active session logger */}
      {routines.length > 0 ? (
        <div className="log-card">
          <div className="log-card-head">
            <div className="log-pick">
              <span className="log-eyebrow">{isScheduled ? 'Today’s workout' : 'Today'}</span>
              <select
                className="log-select"
                value={activeDayId ?? ''}
                onChange={e => changeDay(e.target.value)}
              >
                {activeDayId === null && <option value="" disabled>Rest day · pick to log</option>}
                {routines.map(r => (
                  <optgroup key={r.id} label={r.name}>
                    {r.days.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {activeDayId !== null && (
              <div className="log-progress-ring">
                <span className="num">{doneSets}<small>/{totalSets}</small></span>
                <span className="lpr-label">sets</span>
              </div>
            )}
          </div>

          {activeDayId === null ? (
            <div style={{ padding: '4px 18px 20px', color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.5 }}>
              No workout scheduled today. Set one in the <strong style={{ color: 'var(--ink-2)' }}>Planner</strong>, or pick a routine above to log a session manually.
            </div>
          ) : (
          <>
          <div className="log-progress-bar">
            <div style={{ width: pct + '%' }} />
          </div>

          <div className="log-exs">
            {exercises.map((e, ei) => (
              <div key={ei} className="log-ex">
                <div className="log-ex-head">
                  <span className="log-ex-name">{e.name}</span>
                  {e.exerciseId && <span className="log-ex-tag">in library</span>}
                </div>
                <div className="set-grid set-grid-head">
                  <span>Set</span><span>lb</span><span>Reps</span><span />
                </div>
                {e.sets.map((s, si) => (
                  <div key={si} className={`set-grid set-row${s.done ? ' done' : ''}`}>
                    <span className="set-num">{si + 1}</span>
                    <input
                      className="set-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="—"
                      value={s.weightLb}
                      onChange={ev => setVal(ei, si, 'weightLb', ev.target.value)}
                    />
                    <input
                      className="set-input"
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      value={s.reps}
                      onChange={ev => setVal(ei, si, 'reps', ev.target.value)}
                    />
                    <div className="set-actions">
                      <button
                        className={`set-check${s.done ? ' on' : ''}`}
                        onClick={() => toggleDone(ei, si)}
                      >
                        <Icon name="check" size={13} />
                      </button>
                      {e.sets.length > 1 && (
                        <button className="set-del" onClick={() => delSet(ei, si)}>
                          <Icon name="x" size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button className="add-set" onClick={() => addSet(ei)}>
                  <Icon name="plus" size={12} /> Add set
                </button>
              </div>
            ))}
          </div>

          <div className="log-foot">
            <div className="log-tally">
              <span><b>{doneSets}</b> sets done</span>
              {doneVol > 0 && (
                <>
                  <span className="dot-sep" />
                  <span><b>{(doneVol / 1000).toFixed(1)}k</b> lb vol</span>
                </>
              )}
            </div>
            <button className="btn btn-primary" onClick={finish} disabled={saving}>
              <Icon name="check" size={15} />
              {saving ? 'Saving…' : 'Finish session'}
            </button>
          </div>
          </>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📋</div>
          <div className="t-headline" style={{ marginBottom: 8 }}>No routines yet</div>
          <p className="t-body">Create a routine first, then plan your week to start logging.</p>
        </div>
      )}
    </div>
  )
}
