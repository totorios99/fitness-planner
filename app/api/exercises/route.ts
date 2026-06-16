import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase()
  const cat = searchParams.get('category')
  const eq = searchParams.get('equipment')

  const exercises = await prisma.exercise.findMany({
    orderBy: { name: 'asc' },
    where: {
      ...(cat ? { category: cat } : {}),
      ...(eq ? { equipment: eq } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
  })

  return Response.json(exercises)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, category, equipment, primaryMuscles, secondaryMuscles } = body as {
    name: string; category: string; equipment: string
    primaryMuscles?: string[]; secondaryMuscles?: string[]
  }

  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const slug = name.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const primary = Array.isArray(primaryMuscles) ? primaryMuscles : []
  const secondary = Array.isArray(secondaryMuscles) ? secondaryMuscles.filter(m => !primary.includes(m)) : []

  const exercise = await prisma.exercise.create({
    data: {
      name: name.trim(),
      slug,
      category: category ?? 'other',
      equipment: equipment ?? 'other',
      primaryMuscles: JSON.stringify(primary),
      secondaryMuscles: JSON.stringify(secondary),
    },
  })

  return Response.json({ slug: exercise.slug }, { status: 201 })
}
