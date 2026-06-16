import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'

import { RoutineEditor } from './RoutineEditor'
import DeleteRoutineButton from './DeleteRoutineButton'
import Link from 'next/link'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'

export default async function RoutineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [routine, allExercises] = await Promise.all([
    prisma.routine.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: { exercise: true },
            },
          },
        },
      },
    }),
    prisma.exercise.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!routine) notFound()

  return (
    <AppShell>
      <div className="page-content">
        <div className="page page-narrow">
          <Link href="/routines" className="back-btn">
            <Icon name="arrow-left" size={16} /> Routines
          </Link>

          {/* Header */}
          <div className="page-head">
            <div>
              <div className="board-eyebrow">Routine</div>
              <h1 className="board-title">{routine.name}</h1>
              {routine.description && (
                <div className="t-caption" style={{ marginTop: 6 }}>{routine.description}</div>
              )}
            </div>
            <DeleteRoutineButton id={routine.id} />
          </div>

          <div className="stat-tiles">
            <div className="stat-tile">
              <span className="st-label">Per week</span>
              <span className="st-val num" style={{ color: 'var(--accent)' }}>{routine.daysPerWeek}<small>days</small></span>
            </div>
            <div className="stat-tile">
              <span className="st-label">Sessions</span>
              <span className="st-val num">{routine.days.length}</span>
            </div>
            <div className="stat-tile">
              <span className="st-label">Exercises</span>
              <span className="st-val num">{routine.days.reduce((s, d) => s + d.exercises.length, 0)}</span>
            </div>
          </div>

          <RoutineEditor
            routine={JSON.parse(JSON.stringify(routine))}
            allExercises={JSON.parse(JSON.stringify(allExercises))}
          />
        </div>
      </div>
    </AppShell>
  )
}
