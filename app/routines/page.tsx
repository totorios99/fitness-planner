import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import { parseMuscles, muscleLabel } from '@/lib/muscles'
import Link from 'next/link'
import NewRoutineButton from './NewRoutineButton'

export const dynamic = 'force-dynamic'

export default async function RoutinesPage() {
  const routines = await prisma.routine.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: true },
          },
        },
      },
    },
  })

  return (
    <AppShell>
      <TopNav title="Routines" />
      <div className="page-content">
        <div className="page-inner">
          <div className="section-head">
            <span className="section-label">Your Routines</span>
            <NewRoutineButton />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {routines.map(routine => {
              const allMuscles = new Set<string>()
              for (const day of routine.days) {
                for (const re of day.exercises) {
                  if (re.exercise) {
                    for (const m of parseMuscles(re.exercise.primaryMuscles)) allMuscles.add(m)
                  }
                }
              }
              const totalExs = routine.days.reduce((s, d) => s + d.exercises.length, 0)

              return (
                <Link key={routine.id} href={`/routines/${routine.id}`} style={{ textDecoration: 'none' }}>
                  <div className="routine-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="t-headline">{routine.name}</div>
                      <span className="routine-badge">{routine.daysPerWeek}d / wk</span>
                    </div>
                    {routine.description && (
                      <div className="t-body t-ink-3" style={{ fontSize: 13 }}>{routine.description}</div>
                    )}
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      <div className="t-caption">{routine.days.length} days · {totalExs} exercises</div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {[...allMuscles].slice(0, 6).map(m => (
                        <span key={m} style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--bg-sunken)', padding: '2px 6px', borderRadius: 9999 }}>
                          {muscleLabel(m)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {routines.length === 0 && (
            <div className="empty-state">
              <div className="icon">📅</div>
              <div className="t-headline" style={{ marginBottom: 8 }}>No routines yet</div>
              <p className="t-body">Run the seed script to add predefined routines.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
