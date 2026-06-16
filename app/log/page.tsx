import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { SessionCard } from '@/components/SessionCard'
import LogClient from './LogClient'

export const dynamic = 'force-dynamic'

function getMondayIso(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.getFullYear(), d.getMonth(), diff)
  return [
    mon.getFullYear(),
    String(mon.getMonth() + 1).padStart(2, '0'),
    String(mon.getDate()).padStart(2, '0'),
  ].join('-')
}

export default async function LogPage() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  // Planner stores weekStart as Monday (UTC midnight via ISO) and dayOfWeek Monday-based (0=Mon).
  const monday = new Date(getMondayIso(today))
  const todayDow = (today.getDay() + 6) % 7

  const [routines, todaySlot, sessions] = await Promise.all([
    prisma.routine.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: { exercise: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    prisma.plannerSlot.findFirst({
      where: { weekStart: monday, dayOfWeek: todayDow },
      select: { routineDayId: true },
    }),
    prisma.workoutSession.findMany({
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        exercises: {
          include: {
            exercise: { select: { primaryMuscles: true, secondaryMuscles: true } },
            sets: { select: { weightLb: true, reps: true } },
          },
        },
      },
    }),
  ])

  return (
    <AppShell>
      <div className="page-content">
        <div className="page page-narrow">
          <LogClient
            routines={JSON.parse(JSON.stringify(routines))}
            todayDayId={todaySlot?.routineDayId ?? null}
            dateStr={dateStr}
          />

          {sessions.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div className="section-head">
                <span className="section-label">Session History</span>
                <span className="t-caption">{sessions.length} total</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map(s => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="empty-state" style={{ marginTop: 32 }}>
              <div className="icon">🏋️</div>
              <div className="t-headline" style={{ marginBottom: 8 }}>No sessions yet</div>
              <p className="t-body">Log a session above or import a Strong export.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
