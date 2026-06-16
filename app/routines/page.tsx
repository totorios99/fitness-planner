import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'

import { parseMuscles, muscleLabel, muscleVar } from '@/lib/muscles'
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

      <div className="page-content">
        <div className="page page-narrow">
          <div className="page-head">
            <div>
              <div className="board-eyebrow">{routines.length} {routines.length === 1 ? 'routine' : 'routines'}</div>
              <h1 className="board-title">Your <em>routines</em></h1>
            </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 21, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ink)', lineHeight: 1.15 }}>
                        {routine.name}
                      </div>
                      <span className="routine-badge">{routine.daysPerWeek}d / wk</span>
                    </div>
                    {routine.description && (
                      <div className="t-caption">{routine.description}</div>
                    )}
                    <div className="t-caption">{routine.days.length} days · {totalExs} exercises</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
                      {[...allMuscles].slice(0, 6).map(m => (
                        <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3)' }}>
                          <span className="muscle-dot" style={{ background: `var(${muscleVar(m)})`, width: 7, height: 7 }} />
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
              <p className="t-body">Create your first routine to start planning your week.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
