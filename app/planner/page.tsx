import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'

import PlannerClient from './PlannerClient'

export const dynamic = 'force-dynamic'

function getMondayIso(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.getFullYear(), d.getMonth(), diff)
  return [
    mon.getFullYear(),
    String(mon.getMonth() + 1).padStart(2, '0'),
    String(mon.getDate()).padStart(2, '0'),
  ].join('-')
}

export default async function PlannerPage() {
  const mondayIso = getMondayIso(new Date())

  const [routines, slots] = await Promise.all([
    prisma.routine.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: { exercise: { select: { name: true, primaryMuscles: true, secondaryMuscles: true } } },
            },
          },
        },
      },
    }),
    prisma.plannerSlot.findMany({
      where: { weekStart: new Date(mondayIso) },
      include: {
        routineDay: {
          include: {
            routine: { select: { id: true, name: true } },
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: { exercise: { select: { name: true, primaryMuscles: true, secondaryMuscles: true } } },
            },
          },
        },
      },
    }),
  ])

  return (
    <AppShell>
      <PlannerClient
        routines={JSON.parse(JSON.stringify(routines))}
        initialSlots={JSON.parse(JSON.stringify(slots))}
        initialWeekStart={mondayIso}
      />
    </AppShell>
  )
}
