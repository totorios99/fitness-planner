import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { targetSets, targetReps, orderIndex } = await req.json()
  const updated = await prisma.routineExercise.update({
    where: { id },
    data: {
      ...(targetSets !== undefined ? { targetSets: Number(targetSets) } : {}),
      ...(targetReps !== undefined ? { targetReps } : {}),
      ...(orderIndex !== undefined ? { orderIndex } : {}),
    },
    include: { exercise: true },
  })
  return Response.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.routineExercise.delete({ where: { id } })
  return Response.json({ ok: true })
}
