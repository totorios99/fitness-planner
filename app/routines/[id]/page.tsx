import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
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
      <TopNav
        title={routine.name}
        left={
          <Link href="/routines" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
            <Icon name="arrow-left" size={20} />
          </Link>
        }
      />
      <div className="page-content">
        <div className="page-inner">
          {/* Header */}
          <div className="card card-body">
            <div className="t-headline">{routine.name}</div>
            {routine.description && (
              <div className="t-body t-ink-3" style={{ marginTop: 6, fontSize: 14 }}>{routine.description}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{routine.daysPerWeek}</div>
                  <div className="t-caption">days / week</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{routine.days.length}</div>
                  <div className="t-caption">sessions</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {routine.days.reduce((s, d) => s + d.exercises.length, 0)}
                  </div>
                  <div className="t-caption">total exercises</div>
                </div>
              </div>
              <DeleteRoutineButton id={routine.id} />
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
