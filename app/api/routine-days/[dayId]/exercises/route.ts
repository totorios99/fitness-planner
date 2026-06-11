import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params
  const { exerciseId, targetSets, targetReps } = await req.json()

  const lastEx = await prisma.routineExercise.findFirst({
    where: { routineDayId: dayId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  })

  const re = await prisma.routineExercise.create({
    data: {
      routineDayId: dayId,
      exerciseId,
      targetSets: Number(targetSets ?? 3),
      targetReps: targetReps ?? '8–12',
      orderIndex: (lastEx?.orderIndex ?? -1) + 1,
    },
    include: { exercise: true },
  })

  return Response.json(re)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params
  const { orderedIds } = await req.json() as { orderedIds: string[] }

  await Promise.all(
    orderedIds.map((id, i) =>
      prisma.routineExercise.update({ where: { id }, data: { orderIndex: i } })
    )
  )

  const exercises = await prisma.routineExercise.findMany({
    where: { routineDayId: dayId },
    orderBy: { orderIndex: 'asc' },
    include: { exercise: true },
  })

  return Response.json(exercises)
}
