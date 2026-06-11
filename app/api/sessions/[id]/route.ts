import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseMuscles } from '@/lib/muscles'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  })

  if (!session) return Response.json({ error: 'Not found' }, { status: 404 })

  // Compute muscle set counts
  const muscleSets: Record<string, number> = {}
  for (const ex of session.exercises) {
    if (!ex.exercise) continue
    const setCount = ex.sets.length
    for (const m of parseMuscles(ex.exercise.primaryMuscles)) {
      muscleSets[m] = (muscleSets[m] ?? 0) + setCount
    }
    for (const m of parseMuscles(ex.exercise.secondaryMuscles)) {
      muscleSets[m] = (muscleSets[m] ?? 0) + Math.ceil(setCount * 0.5)
    }
  }

  return Response.json({ session, muscleSets })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.workoutSession.delete({ where: { id } })
  return Response.json({ ok: true })
}
