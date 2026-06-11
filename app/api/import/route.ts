import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseStrongExport } from '@/lib/strongParser'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const text: string = body.text
  if (!text?.trim()) return Response.json({ error: 'No text provided' }, { status: 400 })

  const parsed = parseStrongExport(text)

  const allExercises = await prisma.exercise.findMany({ select: { id: true, name: true } })
  const exMap = new Map(allExercises.map(e => [normalize(e.name), e.id]))

  function matchExercise(rawName: string): string | null {
    const n = normalize(rawName)
    if (exMap.has(n)) return exMap.get(n)!
    for (const [key, id] of exMap) {
      if (key.includes(n) || n.includes(key)) return id
    }
    return null
  }

  const session = await prisma.workoutSession.create({
    data: {
      date: parsed.date,
      label: parsed.label,
      source: 'strong_import',
      exercises: {
        create: parsed.exercises.map((ex, i) => ({
          rawName: ex.rawName,
          orderIndex: i,
          exerciseId: matchExercise(ex.rawName),
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
