import Link from 'next/link'
import { parseMuscles, muscleLabel } from '@/lib/muscles'

interface SetLog { weightLb: number; reps: number }
interface Exercise { primaryMuscles: string; secondaryMuscles: string }
interface SessionExercise { exercise: Exercise | null; sets: SetLog[] }
interface Session {
  id: string
  date: Date | string
  label: string
  source: string
  exercises: SessionExercise[]
}

function computeVolume(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + set.weightLb * set.reps, 0), 0)
}

function topMuscles(exercises: SessionExercise[]): string[] {
  const counts: Record<string, number> = {}
  for (const ex of exercises) {
    if (!ex.exercise) continue
    for (const m of parseMuscles(ex.exercise.primaryMuscles)) {
      counts[m] = (counts[m] ?? 0) + ex.sets.length
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0])
}

export function SessionCard({ session }: { session: Session }) {
  const date = new Date(session.date)
  const vol = computeVolume(session.exercises)
  const muscles = topMuscles(session.exercises)

  return (
    <Link href={`/log/${session.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="session-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{session.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
              {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : Math.round(vol)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>lbs</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {session.exercises.length} exercises ·
          </span>
          {muscles.map(m => (
            <span key={m} style={{ fontSize: 12, color: 'var(--ink-3)' }}>{muscleLabel(m)}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
