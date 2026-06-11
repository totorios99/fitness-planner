import { prisma } from '@/lib/prisma'
import { parseMuscles, muscleLabel } from '@/lib/muscles'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import { SessionCard } from '@/components/SessionCard'
import { MuscleSummary } from '@/components/MuscleSummary'
import Link from 'next/link'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

export default async function Home() {
  const now = new Date()
  const weekStart = startOfWeek(now)

  const [recent, weekSessions] = await Promise.all([
    prisma.workoutSession.findMany({
      orderBy: { date: 'desc' },
      take: 3,
      include: {
        exercises: {
          include: {
            exercise: { select: { primaryMuscles: true, secondaryMuscles: true } },
            sets: { select: { weightLb: true, reps: true } },
          },
        },
      },
    }),
    prisma.workoutSession.findMany({
      where: { date: { gte: weekStart } },
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

  const weekVolume = weekSessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, ex) =>
      es + ex.sets.reduce((ss, set) => ss + set.weightLb * set.reps, 0), 0), 0)

  const muscleSets: Record<string, number> = {}
  for (const s of weekSessions) {
    for (const ex of s.exercises) {
      if (!ex.exercise) continue
      const n = ex.sets.length
      for (const m of parseMuscles(ex.exercise.primaryMuscles)) {
        muscleSets[m] = (muscleSets[m] ?? 0) + n
      }
      for (const m of parseMuscles(ex.exercise.secondaryMuscles)) {
        muscleSets[m] = (muscleSets[m] ?? 0) + Math.ceil(n * 0.5)
      }
    }
  }

  const greeting = (() => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <AppShell>
      <TopNav title="Forma" />
      <div className="page-content">
        <div className="page-inner">
          <div>
            <div className="t-caption">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="t-display">{greeting}</div>
          </div>

          {/* Week stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {weekSessions.length}
              </div>
              <div className="t-caption" style={{ marginTop: 4 }}>sessions this week</div>
            </div>
            <div className="card card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--energy)', lineHeight: 1 }}>
                {weekVolume >= 1000 ? `${(weekVolume / 1000).toFixed(1)}k` : Math.round(weekVolume)}
              </div>
              <div className="t-caption" style={{ marginTop: 4 }}>lbs this week</div>
            </div>
          </div>

          {/* Weekly muscle summary */}
          {Object.keys(muscleSets).length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="section-label">Weekly Muscle Volume</span>
                <span className="t-caption">sets</span>
              </div>
              <div className="card-body">
                <MuscleSummary sets={muscleSets} />
              </div>
            </div>
          )}

          {/* Recent sessions */}
          {recent.length > 0 ? (
            <div>
              <div className="section-head">
                <span className="section-label">Recent Sessions</span>
                <Link href="/log" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
                  All →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recent.map(s => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">🏋️</div>
              <div className="t-headline" style={{ marginBottom: 8 }}>No workouts yet</div>
              <p className="t-body">Import your first Strong export to get started.</p>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <div className="section-head"><span className="section-label">Quick Actions</span></div>
            <div className="quick-tiles">
              <Link href="/log" className="quick-tile accent">
                <div className="tile-icon"><Icon name="log" size={20} /></div>
                <div className="tile-label">Import</div>
                <div className="tile-title">Log Workout</div>
              </Link>
              <Link href="/exercises" className="quick-tile">
                <div className="tile-icon"><Icon name="exercises" size={20} /></div>
                <div className="tile-label">Library</div>
                <div className="tile-title">Exercises</div>
              </Link>
              <Link href="/routines" className="quick-tile">
                <div className="tile-icon"><Icon name="routines" size={20} /></div>
                <div className="tile-label">Plans</div>
                <div className="tile-title">Routines</div>
              </Link>
              <Link href="/progress" className="quick-tile energy">
                <div className="tile-icon"><Icon name="progress" size={20} /></div>
                <div className="tile-label">Charts</div>
                <div className="tile-title">Progress</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
