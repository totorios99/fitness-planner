import { prisma } from '@/lib/prisma'

// Monday (UTC midnight) of the week containing d — matches PlannerSlot.weekStart storage.
export function mondayIso(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.getFullYear(), d.getMonth(), diff)
  return [mon.getFullYear(), String(mon.getMonth() + 1).padStart(2, '0'), String(mon.getDate()).padStart(2, '0')].join('-')
}

// If a week has no planner slots yet, materialize it from the persistent default template.
// Idempotent: returns early once any slot exists for the week. Safe to call on every read.
export async function ensureWeekPopulated(weekStartIso: string): Promise<void> {
  const weekStart = new Date(weekStartIso)
  const existing = await prisma.plannerSlot.count({ where: { weekStart } })
  if (existing > 0) return

  const template = await prisma.templateSlot.findMany({
    where: { routineDayId: { not: null } },
  })
  if (template.length === 0) return

  await prisma.plannerSlot.createMany({
    data: template.map(t => ({
      weekStart,
      dayOfWeek: t.dayOfWeek,
      type: t.type,
      routineDayId: t.routineDayId,
    })),
  })
}
