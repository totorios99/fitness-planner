import Link from 'next/link'
import Image from 'next/image'
import { MuscleTag } from './MuscleTag'
import { parseMuscles } from '@/lib/muscles'

interface ExerciseCardProps {
  name: string
  slug: string
  category: string
  equipment: string
  primaryMuscles: string
  secondaryMuscles: string
  imagePath?: string | null
}

export function ExerciseCard(ex: ExerciseCardProps) {
  const primary = parseMuscles(ex.primaryMuscles)

  return (
    <Link href={`/exercises/${ex.slug}`} className="ex-card">
      <div className="ex-card-img">
        {ex.imagePath ? (
          <Image src={ex.imagePath} alt={ex.name} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div className="ex-card-img-placeholder">
            <span style={{ fontSize: 36, opacity: 0.25 }}>🏋️</span>
          </div>
        )}
      </div>
      <div className="ex-card-body">
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, color: 'var(--ink)' }}>
          {ex.name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {primary.map(m => (
            <MuscleTag key={m} muscle={m} size="xs" />
          ))}
        </div>
      </div>
    </Link>
  )
}
