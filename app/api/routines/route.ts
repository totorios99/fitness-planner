import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const routines = await prisma.routine.findMany({
    orderBy: { createdAt: 'asc' },
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
  return Response.json(routines)
}

export async function POST(req: NextRequest) {
  const { name, description, days } = await req.json()
  // days: Array<{ label: string }>
  if (!name || !Array.isArray(days) || days.length === 0) {
    return Response.json({ error: 'name and days required' }, { status: 400 })
  }
  const routine = await prisma.routine.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      daysPerWeek: days.length,
      days: {
        create: days.map((d: { label: string }, i: number) => ({
          dayIndex: i,
          label: d.label.trim(),
        })),
      },
    },
    include: {
      days: { orderBy: { dayIndex: 'asc' } },
    },
  })
  return Response.json(routine, { status: 201 })
}
