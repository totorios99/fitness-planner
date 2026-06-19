import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseMuscles, muscleVar, muscleLabel } from '@/lib/muscles'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import ExerciseProgressWidget from './ExerciseProgressWidget'
import ExerciseGallery from './ExerciseGallery'
import MobilityVideo from './MobilityVideo'
import MobilityNotes from './MobilityNotes'
import DeleteExerciseButton from './DeleteExerciseButton'
import EditMusclesButton from './EditMusclesButton'

export const dynamic = 'force-dynamic'

export default async function ExerciseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { slug } = await params
  const { from } = await searchParams

  // Dynamic back target: return to the session the user came from, else the library.
  const backHref = from?.startsWith('/log/') ? from : '/exercises'
  const backLabel = from?.startsWith('/log/') ? 'Session' : 'Library'

  const exercise = await prisma.exercise.findUnique({
    where: { slug },
  })

  if (!exercise) notFound()

  const allSessionExercises = await prisma.sessionExercise.findMany({
    where: { exerciseId: exercise.id },
    include: {
      session: { select: { date: true, label: true } },
      sets: true,
    },
    orderBy: { session: { date: 'asc' } },
  })

  const progressPoints = allSessionExercises.map(se => {
    const date = new Date(se.session.date)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const topSet = se.sets.reduce(
      (best, s) => (s.weightLb > best.weightLb ? s : best),
      { weightLb: 0, reps: 0 },
    )
    const totalVolume = se.sets.reduce((sum, s) => sum + s.weightLb * s.reps, 0)
    return {
      label,
      date: se.session.date.toISOString(),
      maxWeight: topSet.weightLb,
      bestReps: topSet.reps,
      totalVolume,
      totalSets: se.sets.length,
      totalReps: se.sets.reduce((sum, s) => sum + s.reps, 0),
    }
  })

  const isMobility = exercise.type === 'mobility'
  const primary = parseMuscles(exercise.primaryMuscles)
  const secondary = parseMuscles(exercise.secondaryMuscles)
  const primaryVar = `var(${muscleVar(primary[0] ?? 'core')})`
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  let images: (string | null)[] = []
  try { images = JSON.parse(exercise.images) } catch { images = [] }
  // backfill frame 0 from the legacy single imagePath when missing
  if (!images[0] && exercise.imagePath) images[0] = exercise.imagePath

  return (
    <AppShell>
      <div className="page-content">
        <div className="page page-detail">
          <Link href={backHref} className="back-btn">
            <Icon name="arrow-left" size={16} /> {backLabel}
          </Link>

          <div className="detail-head">
            <span className="detail-bar" style={{ background: primaryVar }} />
            <div>
              <h1 className="detail-title">{exercise.name}</h1>
              <div className="detail-sub">
                {isMobility ? (
                  <>
                    <span className="m-pill" style={{ background: primaryVar }}>Mobility</span>
                    <span>{cap(exercise.category)}</span>
                  </>
                ) : (
                  <>
                    {primary[0] && (
                      <span className="m-pill" style={{ background: primaryVar }}>
                        {muscleLabel(primary[0])}
                      </span>
                    )}
                    <span>{exercise.equipment}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="detail-grid">
            {/* LEFT: sticky sidebar */}
            <aside className="detail-aside">
              {isMobility ? (
                <MobilityVideo slug={exercise.slug} initialVideo={exercise.videoPath} />
              ) : (
                <ExerciseGallery
                  slug={exercise.slug}
                  name={exercise.name}
                  secondaryCount={secondary.length}
                  images={images}
                />
              )}

              {isMobility ? (
                <div className="primary-card">
                  <span className="st-label">Mobility</span>
                  <div className="primary-pills">
                    <span className="m-pill" style={{ background: primaryVar }}>{cap(exercise.category)}</span>
                  </div>
                  <div className="primary-meta">
                    <div className="pm-row"><span>Type</span><b>Mobility</b></div>
                    <div className="pm-row"><span>Group</span><b>{cap(exercise.category)}</b></div>
                  </div>
                </div>
              ) : (
                <div className="primary-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="st-label">Targets</span>
                    <EditMusclesButton slug={exercise.slug} primary={primary} secondary={secondary} />
                  </div>
                  <div className="primary-pills">
                    {primary[0] && (
                      <span className="m-pill" style={{ background: primaryVar }}>
                        {muscleLabel(primary[0])}
                      </span>
                    )}
                    {secondary.map(m => (
                      <span
                        key={m}
                        className="m-pill m-pill-ghost"
                        style={{ color: `var(${muscleVar(m)})`, borderColor: `var(${muscleVar(m)})` }}
                      >
                        {muscleLabel(m)}
                      </span>
                    ))}
                  </div>
                  <div className="primary-meta">
                    <div className="pm-row"><span>Equipment</span><b>{exercise.equipment}</b></div>
                    <div className="pm-row"><span>Logged</span><b>{allSessionExercises.length} sessions</b></div>
                  </div>
                </div>
              )}

              <DeleteExerciseButton slug={exercise.slug} name={exercise.name} />
            </aside>

            {/* RIGHT: stats + chart + history (mobility has no records) */}
            <div className="detail-main">
              {isMobility ? (
                <MobilityNotes slug={exercise.slug} initialNotes={exercise.instructions ?? ''} />
              ) : (
                <ExerciseProgressWidget
                  points={progressPoints}
                  muscleColor={primaryVar}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
