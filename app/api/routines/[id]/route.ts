import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayIndex: 'asc' },
        include: {
          exercises: {
            orderBy: { orderIndex: 'asc' },
            include: { exercise: true },
          },
        },
      },
    },
  })
  if (!routine) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(routine)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.routine.delete({ where: { id } })
  return Response.json({ ok: true })
}
