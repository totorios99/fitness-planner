import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const exercise = await prisma.exercise.findUnique({
    where: { slug },
    include: {
      sessionExercises: {
        orderBy: { session: { date: 'desc' } },
        take: 5,
        include: {
          session: { select: { id: true, date: true, label: true } },
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  })
  if (!exercise) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(exercise)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const exercise = await prisma.exercise.findUnique({
    where: { slug },
    select: { id: true, images: true, imagePath: true },
  })
  if (!exercise) return Response.json({ error: 'Not found' }, { status: 404 })

  // RoutineExercise → Exercise is non-nullable: block deletion if used in a routine
  const routineUses = await prisma.routineExercise.count({ where: { exerciseId: exercise.id } })
  if (routineUses > 0) {
    return Response.json(
      { error: `In use by ${routineUses} routine ${routineUses === 1 ? 'entry' : 'entries'}. Remove it from those routines first.` },
      { status: 409 },
    )
  }

  // SessionExercise.exerciseId is nullable (SET NULL) — workout history survives, sets unmatched
  await prisma.exercise.delete({ where: { id: exercise.id } })

  // Best-effort cleanup of uploaded images
  const dir = path.join(process.cwd(), 'public', 'exercises')
  const files = new Set<string>()
  try {
    const arr: (string | null)[] = JSON.parse(exercise.images || '[]')
    for (const u of arr) if (u) files.add(u.split('?')[0])
  } catch { /* ignore */ }
  if (exercise.imagePath) files.add(exercise.imagePath.split('?')[0])
  await Promise.all(
    [...files].map(u =>
      fs.unlink(path.join(dir, path.basename(u))).catch(() => {}),
    ),
  )

  return Response.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json()
  const exercise = await prisma.exercise.update({
    where: { slug },
    data: {
      ...(body.instructions !== undefined ? { instructions: body.instructions } : {}),
      ...(body.primaryMuscles !== undefined ? { primaryMuscles: JSON.stringify(body.primaryMuscles) } : {}),
      ...(body.secondaryMuscles !== undefined ? { secondaryMuscles: JSON.stringify(body.secondaryMuscles) } : {}),
    },
  })
  return Response.json(exercise)
}
