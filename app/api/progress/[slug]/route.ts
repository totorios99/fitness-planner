import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const exercise = await prisma.exercise.findUnique({ where: { slug } })
  if (!exercise) return Response.json({ error: 'Not found' }, { status: 404 })

  const sessionExercises = await prisma.sessionExercise.findMany({
    where: { exerciseId: exercise.id },
    include: {
      session: { select: { date: true, label: true } },
      sets: true,
    },
    orderBy: { session: { date: 'asc' } },
  })

  const points = sessionExercises.map(se => {
    const date = new Date(se.session.date)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const maxWeight = Math.max(...se.sets.map(s => s.weightLb), 0)
    const totalVolume = se.sets.reduce((sum, s) => sum + s.weightLb * s.reps, 0)
    const totalSets = se.sets.length
    const totalReps = se.sets.reduce((sum, s) => sum + s.reps, 0)
    return { label, date: se.session.date, maxWeight, totalVolume, totalSets, totalReps }
  })

  return Response.json({ exercise, points })
}
