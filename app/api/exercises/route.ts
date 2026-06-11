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
