import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseMuscles } from '@/lib/muscles'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import { MuscleTag } from '@/components/MuscleTag'
import { MuscleSummary } from '@/components/MuscleSummary'
import Link from 'next/link'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  })

  if (!session) notFound()

  const date = new Date(session.date)
  const totalVolume = session.exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + set.weightLb * set.reps, 0), 0)

  const muscleSets: Record<string, number> = {}
  for (const ex of session.exercises) {
    if (!ex.exercise) continue
    const n = ex.sets.length
    for (const m of parseMuscles(ex.exercise.primaryMuscles)) {
      muscleSets[m] = (muscleSets[m] ?? 0) + n
    }
    for (const m of parseMuscles(ex.exercise.secondaryMuscles)) {
      muscleSets[m] = (muscleSets[m] ?? 0) + Math.ceil(n * 0.5)
    }
  }

  return (
    <AppShell>
      <TopNav
        title={session.label}
        left={
          <Link href="/log" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
            <Icon name="arrow-left" size={20} />
          </Link>
        }
      />
      <div className="page-content">
        <div className="page-inner">
          {/* Header */}
          <div className="card card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="t-headline">{session.label}</div>
                <div className="t-caption" style={{ marginTop: 4 }}>
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {' '}·{' '}
                  {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
              {session.source === 'strong_import' && (
                <span className="chip chip-accent" style={{ fontSize: 11 }}>Strong</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                  {session.exercises.length}
                </div>
                <div className="t-caption">exercises</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--energy)' }}>
                  {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : Math.round(totalVolume)}
                </div>
                <div className="t-caption">lbs total</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {session.exercises.reduce((s, ex) => s + ex.sets.length, 0)}
                </div>
                <div className="t-caption">total sets</div>
              </div>
            </div>
          </div>

          {/* Muscle summary */}
          {Object.keys(muscleSets).length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="section-label">Muscle Volume</span>
                <span className="t-caption">sets per muscle</span>
              </div>
              <div className="card-body">
                <MuscleSummary sets={muscleSets} showAll />
              </div>
            </div>
          )}

          {/* Exercises */}
          <div>
            <div className="section-head"><span className="section-label">Exercises</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {session.exercises.map(ex => {
                const primary = ex.exercise ? parseMuscles(ex.exercise.primaryMuscles) : []
                const secondary = ex.exercise ? parseMuscles(ex.exercise.secondaryMuscles) : []
                const exVol = ex.sets.reduce((s, set) => s + set.weightLb * set.reps, 0)

                return (
                  <div key={ex.id} className="card">
                    <div className="card-header">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                          {ex.exercise ? (
                            <Link href={`/exercises/${ex.exercise.slug}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                              {ex.rawName}
                            </Link>
                          ) : (
                            <span style={{ color: 'var(--ink)' }}>{ex.rawName}</span>
                          )}
                        </div>
                        {!ex.exercise && (
                          <div className="t-caption" style={{ color: 'var(--warn)' }}>Not in library</div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {primary.map(m => <MuscleTag key={m} muscle={m} size="xs" />)}
                          {secondary.map(m => <MuscleTag key={m} muscle={m} size="xs" secondary />)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
                          {exVol >= 1000 ? `${(exVol / 1000).toFixed(1)}k` : Math.round(exVol)} lbs
                        </div>
                        <div className="t-caption">{ex.sets.length} sets</div>
                      </div>
                    </div>
                    <div className="card-body" style={{ padding: '8px 16px' }}>
                      <table className="sets-table">
                        <thead>
                          <tr>
                            <th>Set</th>
                            <th>Weight</th>
                            <th>Reps</th>
                            <th>Vol</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ex.sets.map(set => (
                            <tr key={set.id}>
                              <td style={{ color: 'var(--ink-3)' }}>{set.setNumber}</td>
                              <td style={{ fontWeight: 600 }}>{set.weightLb} lb</td>
                              <td>{set.reps}</td>
                              <td style={{ color: 'var(--ink-3)' }}>{Math.round(set.weightLb * set.reps)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
