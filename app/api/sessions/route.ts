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

export async function POST(req: Request) {
  try {
    const { label, type, exercises } = await req.json()
    if (!label || !Array.isArray(exercises) || !exercises.length) {
      return Response.json({ error: 'label and exercises required' }, { status: 400 })
    }
    const session = await prisma.workoutSession.create({
      data: {
        date: new Date(),
        label,
        source: 'manual',
        type: type === 'mobility' ? 'mobility' : 'lifting',
        exercises: {
          create: exercises.map((e: { exerciseId?: string | null; name: string; sets: { weightLb: string | number; reps: string | number }[] }, i: number) => ({
            exerciseId: e.exerciseId || null,
            rawName: e.name,
            orderIndex: i,
            sets: {
              create: e.sets.map((s, j) => ({
                setNumber: j + 1,
                weightLb: parseFloat(String(s.weightLb)) || 0,
                reps: parseInt(String(s.reps)) || 0,
              })),
            },
          })),
        },
      },
    })
    return Response.json({ sessionId: session.id })
  } catch {
    return Response.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
