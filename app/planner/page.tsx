import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import PlannerClient from './PlannerClient'

export const dynamic = 'force-dynamic'

function getMondayOf(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

export default async function PlannerPage() {
  const monday = getMondayOf(new Date())
  monday.setHours(0, 0, 0, 0)

  const [routines, slots] = await Promise.all([
    prisma.routine.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: { exercise: { select: { name: true, primaryMuscles: true } } },
            },
          },
        },
      },
    }),
    prisma.plannerSlot.findMany({
      where: { weekStart: monday },
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
    }),
  ])

  return (
    <AppShell>
      <TopNav title="Planner" />
      <div className="page-content">
        <PlannerClient
          routines={JSON.parse(JSON.stringify(routines))}
          initialSlots={JSON.parse(JSON.stringify(slots))}
          initialWeekStart={monday.toISOString().split('T')[0]}
        />
      </div>
    </AppShell>
  )
}
