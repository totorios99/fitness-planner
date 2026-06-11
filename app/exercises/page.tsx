import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import ExercisesClient from './ExercisesClient'

export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({ orderBy: { name: 'asc' } })
  return (
    <AppShell>
      <TopNav title="Exercises" />
      <div className="page-content">
        <ExercisesClient exercises={exercises} />
      </div>
    </AppShell>
  )
}
