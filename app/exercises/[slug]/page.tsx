import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseMuscles } from '@/lib/muscles'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import { MuscleTag } from '@/components/MuscleTag'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import ImageUpload from './ImageUpload'
import ExerciseProgressWidget from './ExerciseProgressWidget'

export const dynamic = 'force-dynamic'

export default async function ExerciseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const exercise = await prisma.exercise.findUnique({
    where: { slug },
    include: {
      sessionExercises: {
        orderBy: { session: { date: 'desc' } },
        take: 5,
        include: {
          session: { select: { id: true, date: true, label: true } },
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  })

  if (!exercise) notFound()

  // All sessions for progress chart (ascending for chart)
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
    const maxWeight = Math.max(...se.sets.map(s => s.weightLb), 0)
    const totalVolume = se.sets.reduce((sum, s) => sum + s.weightLb * s.reps, 0)
    const totalSets = se.sets.length
    const totalReps = se.sets.reduce((sum, s) => sum + s.reps, 0)
    return { label, date: se.session.date.toISOString(), maxWeight, totalVolume, totalSets, totalReps }
  })

  const primary = parseMuscles(exercise.primaryMuscles)
  const secondary = parseMuscles(exercise.secondaryMuscles)

  return (
    <AppShell>
      <TopNav
        title={exercise.name}
        left={
          <Link href="/exercises" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
            <Icon name="arrow-left" size={20} />
          </Link>
        }
      />
      <div className="page-content">
        <div className="page-inner">
          {/* Image */}
          <div style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--bg-sunken)', aspectRatio: '4/3' }}>
            {exercise.imagePath ? (
              <Image src={exercise.imagePath} alt={exercise.name} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--ink-4)' }}>
                <span style={{ fontSize: 48 }}>🏋️</span>
                <span style={{ fontSize: 13 }}>No image</span>
              </div>
            )}
          </div>

          <ImageUpload slug={exercise.slug} currentImage={exercise.imagePath} />

          {/* Info */}
          <div className="card card-body">
            <div className="t-headline" style={{ marginBottom: 12 }}>{exercise.name}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="chip chip-accent">{exercise.category}</span>
              <span className="chip chip-accent">{exercise.equipment}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Primary</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {primary.map(m => <MuscleTag key={m} muscle={m} />)}
              </div>
            </div>
            {secondary.length > 0 && (
              <div>
                <div className="section-label" style={{ marginBottom: 6 }}>Secondary</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {secondary.map(m => <MuscleTag key={m} muscle={m} secondary />)}
                </div>
              </div>
            )}
          </div>

          {/* Progress widgets */}
          <div>
            <div className="section-head">
              <span className="section-label">Progress</span>
              {progressPoints.length > 0 && (
                <span className="t-caption">{progressPoints.length} session{progressPoints.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <ExerciseProgressWidget points={progressPoints} name={exercise.name} />
          </div>

          {/* Recent sessions */}
          {exercise.sessionExercises.length > 0 && (
            <div>
              <div className="section-head"><span className="section-label">Recent Sessions</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {exercise.sessionExercises.map(se => {
                  const maxW = Math.max(...se.sets.map(s => s.weightLb), 0)
                  const vol = se.sets.reduce((s, set) => s + set.weightLb * set.reps, 0)
                  return (
                    <Link key={se.id} href={`/log/${se.session.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{se.session.label}</div>
                            <div className="t-caption">
                              {new Date(se.session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{maxW} lb max</div>
                            <div className="t-caption">{se.sets.length} sets · {Math.round(vol)} lbs</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
