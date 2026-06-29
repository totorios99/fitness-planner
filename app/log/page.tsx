import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { SessionCard } from '@/components/SessionCard'
import { ensureWeekPopulated, mondayIso as getMondayIso } from '@/lib/planner'
import LogClient from './LogClient'

export const dynamic = 'force-dynamic'

export default async function LogPage() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  // Planner stores weekStart as Monday (UTC midnight via ISO) and dayOfWeek Monday-based (0=Mon).
  const mondayIsoStr = getMondayIso(today)
  await ensureWeekPopulated(mondayIsoStr)
  const monday = new Date(mondayIsoStr)
  const todayDow = (today.getDay() + 6) % 7

  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const [routines, todaySlots, loggedToday, sessions] = await Promise.all([
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
    prisma.plannerSlot.findMany({
      where: { weekStart: monday, dayOfWeek: todayDow, routineDayId: { not: null } },
      select: { routineDayId: true, type: true },
    }),
    prisma.workoutSession.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      select: { type: true },
    }),
    prisma.workoutSession.findMany({
      orderBy: { date: 'desc' },
      take: 5,
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

  const doneTypes = new Set(loggedToday.map(s => s.type))
  // Mobility is plan-only (never logged), so only lifting slots drive the logger.
  const scheduled = todaySlots
    .filter(s => s.type === 'lifting')
    .map(s => ({
      type: 'lifting' as const,
      dayId: s.routineDayId as string,
      done: doneTypes.has('lifting'),
    }))

  return (
    <AppShell>
      <div className="page-content">
        <div className="page page-narrow">
          <LogClient
            routines={JSON.parse(JSON.stringify(routines))}
            scheduled={scheduled}
            dateStr={dateStr}
          />

          {sessions.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div className="section-head">
                <span className="section-label">Session History</span>
                <span className="t-caption">Last {sessions.length}</span>
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
