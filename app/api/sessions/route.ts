import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sessions = await prisma.workoutSession.findMany({
    orderBy: { date: 'desc' },
    include: {
      exercises: {
        include: {
          exercise: { select: { primaryMuscles: true, secondaryMuscles: true } },
          sets: { select: { weightLb: true, reps: true } },
        },
      },
    },
  })
  return Response.json(sessions)
}
