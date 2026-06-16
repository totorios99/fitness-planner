import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Icon } from '@/components/Icon'
import { getHomeData } from '@/lib/home'
import { muscleVar } from '@/lib/muscles'
import { Greeting } from '@/components/home/Greeting'
import { ConsistencyHeatmap, calLevel } from '@/components/home/ConsistencyHeatmap'
import { QuickActions } from '@/components/home/QuickActions'

export const dynamic = 'force-dynamic'

const USER_NAME = 'Antonio'

function fmtK(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))
}

function MuscleDots({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {ids.map(m => (
        <span key={m} className="muscle-dot" style={{ background: `var(${muscleVar(m)})`, width: 7, height: 7 }} />
      ))}
    </span>
  )
}

function dateParts(iso: string) {
  const d = new Date(iso)
  return {
    mon: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate(),
  }
}

export default async function Home() {
  const { thisWeek, recent, consistency } = await getHomeData()
  const cs = consistency
  const hasHistory = cs.total > 0
  const toGo = Math.max(0, thisWeek.goal - thisWeek.sessions)

  return (
    <AppShell>
      <div className="page-content">
        <div className="home">
          {/* Masthead */}
          <header className="home-masthead">
            <Greeting name={USER_NAME} />
            <Link href="/log" className="btn btn-primary btn-lg">
              <Icon name="activity" size={17} /> Log workout
            </Link>
          </header>

          <div className="home-grid">
            {/* ── Main column ── */}
            <div className="home-main">
              {/* Consistency hero */}
              <section className="home-card home-streak">
                <div className="streak-head">
                  <div className="st-label">Consistency</div>
                  <div className="cal-legend">
                    <span>Less</span>
                    {([0, 1, 2, 3] as const).map(l => <i key={l} style={{ background: calLevel(l) }} />)}
                    <span>More</span>
                  </div>
                </div>

                <div className="streak-hero">
                  <span className="streak-flame"><Icon name="flame" size={30} /></span>
                  <span className="streak-num">{cs.current}</span>
                  <span className="streak-unit">week<br />streak</span>
                  <p className="streak-line">
                    {hasHistory ? (
                      cs.current > 0 ? (
                        <>{cs.current} {cs.current === 1 ? 'week' : 'weeks'} straight — your longest run was <b>{cs.best} {cs.best === 1 ? 'week' : 'weeks'}</b>. Keep showing up.</>
                      ) : (
                        <>No active streak yet — your longest run was <b>{cs.best} {cs.best === 1 ? 'week' : 'weeks'}</b>. Train 3+ days this week to start one.</>
                      )
                    ) : (
                      <>No sessions logged yet. <b>Log your first workout</b> to start building your streak.</>
                    )}
                  </p>
                </div>

                <ConsistencyHeatmap cols={cs.cols} />

                <div className="streak-stats">
                  <div className="hstat">
                    <span className="hstat-val">{cs.best}<small>wks</small></span>
                    <span className="hstat-lbl">Best streak</span>
                  </div>
                  <div className="hstat">
                    <span className="hstat-val">{cs.thisMonth}</span>
                    <span className="hstat-lbl">This month</span>
                  </div>
                  <div className="hstat">
                    <span className="hstat-val">{cs.weeklyAvg}</span>
                    <span className="hstat-lbl">Weekly avg</span>
                  </div>
                  <div className="hstat">
                    <span className="hstat-val">{cs.total}</span>
                    <span className="hstat-lbl">Sessions logged</span>
                  </div>
                </div>
              </section>

              {/* Recent sessions */}
              <section className="home-recent">
                <div className="home-section-head">
                  <div className="section-label">Recent sessions</div>
                  <Link href="/log" className="home-all">All <Icon name="arrowR" size={14} /></Link>
                </div>
                {recent.length > 0 ? (
                  <div className="home-recent-list">
                    {recent.map(s => {
                      const { mon, day } = dateParts(s.date)
                      return (
                        <Link className="home-session" key={s.id} href={`/log/${s.id}`}>
                          <div className="hs-date">
                            <span className="hs-mon">{mon}</span>
                            <span className="hs-day">{day}</span>
                          </div>
                          <div className="hs-main">
                            <div className="hs-name">{s.name}</div>
                            <div className="hs-focus">
                              <MuscleDots ids={s.topMuscles} />
                              <span>{s.focus}</span>
                            </div>
                          </div>
                          <div className="hs-metrics">
                            <span className="hs-vol">{fmtK(s.totalVol)}<small>lbs</small></span>
                            <span className="hs-sets">{s.totalSets} sets</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="home-session" style={{ justifyContent: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
                    No sessions yet — your logged workouts will appear here.
                  </div>
                )}
              </section>
            </div>

            {/* ── Rail ── */}
            <aside className="home-rail">
              {/* This week */}
              <section className="home-card week-card">
                <div className="st-label">This week</div>
                <div className="week-stats">
                  <div className="wk-stat">
                    <span className="wk-val">{thisWeek.sessions}</span>
                    <span className="wk-lbl">Sessions</span>
                  </div>
                  <div className="wk-stat">
                    <span className="wk-val">{thisWeek.sets}</span>
                    <span className="wk-lbl">Sets</span>
                  </div>
                  <div className="wk-stat">
                    <span className="wk-val">{fmtK(thisWeek.volume)}</span>
                    <span className="wk-lbl">Volume</span>
                  </div>
                </div>
                <div className="week-goal">
                  <div className="week-goal-bar">
                    <div style={{ width: `${Math.min(100, (thisWeek.sessions / thisWeek.goal) * 100)}%` }} />
                  </div>
                  <span className="week-goal-txt">
                    {toGo === 0
                      ? <><b>Goal hit.</b> {thisWeek.sessions} of {thisWeek.goal} sessions.</>
                      : <><b>{toGo} to go</b> — {thisWeek.sessions} of {thisWeek.goal} this week.</>}
                  </span>
                </div>
              </section>

              {/* Quick actions */}
              <QuickActions />
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
