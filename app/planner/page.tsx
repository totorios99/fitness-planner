import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { ensureWeekPopulated, mondayIso as getMondayIso } from '@/lib/planner'

import PlannerClient from './PlannerClient'

export const dynamic = 'force-dynamic'

export default async function PlannerPage() {
  const mondayIso = getMondayIso(new Date())
  await ensureWeekPopulated(mondayIso)

  const [routines, slots, templateSlots] = await Promise.all([
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
            routine: { select: { id: true, name: true, type: true } },
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: { exercise: { select: { name: true, primaryMuscles: true, secondaryMuscles: true } } },
            },
          },
        },
      },
    }),
    prisma.templateSlot.findMany({
      include: {
        routineDay: { include: { routine: { select: { id: true, name: true } } } },
      },
    }),
  ])

  return (
    <AppShell>
      <PlannerClient
        routines={JSON.parse(JSON.stringify(routines))}
        initialSlots={JSON.parse(JSON.stringify(slots))}
        initialTemplate={JSON.parse(JSON.stringify(templateSlots))}
        initialWeekStart={mondayIso}
      />
    </AppShell>
  )
}
