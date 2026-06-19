import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart')
  if (!weekStart) return Response.json({ error: 'weekStart required' }, { status: 400 })

  const slots = await prisma.plannerSlot.findMany({
    where: { weekStart: new Date(weekStart) },
    include: {
      routineDay: {
        include: {
          routine: { select: { id: true, name: true } },
          exercises: {
            orderBy: { orderIndex: 'asc' },
            include: { exercise: { select: { name: true, primaryMuscles: true } } },
          },
        },
      },
    },
  })

  return Response.json(slots)
}

export async function POST(req: NextRequest) {
  const { weekStart, dayOfWeek, routineDayId, type } = await req.json()
  const slotType = type === 'mobility' ? 'mobility' : 'lifting'

  const slot = await prisma.plannerSlot.upsert({
    where: { weekStart_dayOfWeek_type: { weekStart: new Date(weekStart), dayOfWeek, type: slotType } },
    create: { weekStart: new Date(weekStart), dayOfWeek, type: slotType, routineDayId },
    update: { routineDayId },
    include: {
      routineDay: {
        include: {
          routine: { select: { id: true, name: true } },
          exercises: {
            orderBy: { orderIndex: 'asc' },
            include: { exercise: { select: { name: true, primaryMuscles: true } } },
          },
        },
      },
    },
  })

  return Response.json(slot)
}
