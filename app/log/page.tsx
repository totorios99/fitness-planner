import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import { SessionCard } from '@/components/SessionCard'
import LogClient from './LogClient'

export const dynamic = 'force-dynamic'

export default async function LogPage() {
  const sessions = await prisma.workoutSession.findMany({
    orderBy: { date: 'desc' },
    include: {
      exercises: {
        include: {
          exercise: { select: { primaryMuscles: true, secondaryMuscles: true } },
          sets: { select: { weightLb: true, reps: true } },
        },
      },
    },
  })

  return (
    <AppShell>
      <TopNav title="Log" />
      <div className="page-content">
        <div className="page-inner">
          <LogClient />

          {sessions.length > 0 && (
            <div>
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
            <div className="empty-state">
              <div className="icon">📋</div>
              <div className="t-headline" style={{ marginBottom: 8 }}>No sessions yet</div>
              <p className="t-body">Import a Strong .txt export above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
