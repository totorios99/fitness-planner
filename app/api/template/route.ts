import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// The persistent default week. GET lists every assigned slot; POST upserts one
// (dayOfWeek + type), setting routineDayId (null clears it). Rows are never deleted —
// the template is the always-present reference used to auto-fill new weeks.
export async function GET() {
  const slots = await prisma.templateSlot.findMany({
    include: { routineDay: { include: { routine: { select: { id: true, name: true } } } } },
  })
  return Response.json(slots)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Bulk replace: { slots: [{ dayOfWeek, type, routineDayId }] } — used by "Save as default week".
  if (Array.isArray(body.slots)) {
    await prisma.templateSlot.deleteMany({})
    if (body.slots.length) {
      await prisma.templateSlot.createMany({
        data: body.slots.map((s: { dayOfWeek: number; type?: string; routineDayId: string | null }) => ({
          dayOfWeek: s.dayOfWeek,
          type: s.type === 'mobility' ? 'mobility' : 'lifting',
          routineDayId: s.routineDayId ?? null,
        })),
      })
    }
    return Response.json({ ok: true, count: body.slots.length })
  }

  const { dayOfWeek, routineDayId, type } = body
  const slotType = type === 'mobility' ? 'mobility' : 'lifting'

  const slot = await prisma.templateSlot.upsert({
    where: { dayOfWeek_type: { dayOfWeek, type: slotType } },
    create: { dayOfWeek, type: slotType, routineDayId: routineDayId ?? null },
    update: { routineDayId: routineDayId ?? null },
    include: { routineDay: { include: { routine: { select: { id: true, name: true } } } } },
  })
  return Response.json(slot)
}
