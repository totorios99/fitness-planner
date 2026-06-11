import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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
  if (!exercise) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(exercise)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json()
  const exercise = await prisma.exercise.update({
    where: { slug },
    data: {
      ...(body.instructions !== undefined ? { instructions: body.instructions } : {}),
      ...(body.primaryMuscles !== undefined ? { primaryMuscles: JSON.stringify(body.primaryMuscles) } : {}),
      ...(body.secondaryMuscles !== undefined ? { secondaryMuscles: JSON.stringify(body.secondaryMuscles) } : {}),
    },
  })
  return Response.json(exercise)
}
