import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params
  await prisma.plannerSlot.delete({ where: { id: slotId } })
  return Response.json({ ok: true })
}
