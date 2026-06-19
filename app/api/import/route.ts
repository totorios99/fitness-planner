import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseStrongExport } from '@/lib/strongParser'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Strong names that train one side at a time → their own record, sets count as per-side.
function isUnilateral(name: string): boolean {
  return /single (leg|arm)|one[- ]arm|one[- ]leg|unilateral/i.test(name)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const text: string = body.text
  if (!text?.trim()) return Response.json({ error: 'No text provided' }, { status: 400 })

  const parsed = parseStrongExport(text)

  const allExercises = await prisma.exercise.findMany({ select: { id: true, name: true, slug: true } })
  const exMap = new Map(allExercises.map(e => [normalize(e.name), e.id]))
  const slugSet = new Set(allExercises.map(e => e.slug))

  // Exact-name match only (Strong name = source of truth). Variants (unilateral, cable vs
  // barbell, seated vs lying) are distinct names → distinct records. On a miss we create a
  // stub so nothing silently mismatches or disappears; muscles/images get enriched later.
  async function resolveExercise(rawName: string): Promise<string> {
    const n = normalize(rawName)
    const existing = exMap.get(n)
    if (existing) return existing

    let slug = slugify(rawName) || `exercise-${n}`
    while (slugSet.has(slug)) slug = `${slug}-2`
    slugSet.add(slug)

    const created = await prisma.exercise.create({
      data: {
        name: rawName,
        slug,
        category: 'other',
        equipment: 'other',
        type: 'lifting',
        unilateral: isUnilateral(rawName),
        primaryMuscles: '[]',
        secondaryMuscles: '[]',
      },
      select: { id: true },
    })
    exMap.set(n, created.id)
    return created.id
  }

  const resolved: string[] = []
  for (const ex of parsed.exercises) resolved.push(await resolveExercise(ex.rawName))

  const session = await prisma.workoutSession.create({
    data: {
      date: parsed.date,
      label: parsed.label,
      source: 'strong_import',
      type: 'lifting',
      exercises: {
        create: parsed.exercises.map((ex, i) => ({
          rawName: ex.rawName,
          orderIndex: i,
          exerciseId: resolved[i],
          sets: {
            create: ex.sets.map(s => ({
              setNumber: s.setNumber,
              weightLb: s.weightLb,
              reps: s.reps,
            })),
          },
        })),
      },
    },
  })

  return Response.json({ sessionId: session.id })
}
