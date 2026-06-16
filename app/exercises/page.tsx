import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'

import ExercisesClient from './ExercisesClient'

export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  // Flat aggregation: one row per session-exercise with its top-set weight.
  // Avoids loading the nested `sets` relation (which batches into an IN(...)
  // that overflows SQLite's 999-param limit on large datasets).
  const [exercises, sparkRaw] = await Promise.all([
    prisma.exercise.findMany({ orderBy: { name: 'asc' } }),
    prisma.$queryRaw<{ exerciseId: string; topW: number }[]>`
      SELECT se."exerciseId" AS "exerciseId",
             MAX(sl."weightLb") AS "topW"
      FROM "SessionExercise" se
      JOIN "WorkoutSession" s  ON s."id" = se."sessionId"
      JOIN "SetLog" sl         ON sl."sessionExerciseId" = se."id"
      WHERE se."exerciseId" IS NOT NULL
      GROUP BY se."id"
      ORDER BY s."date" ASC
    `,
  ])

  // Group sparkline points per exercise (oldest→newest), keep last 8
  const sparkMap: Record<string, number[]> = {}
  for (const row of sparkRaw) {
    if (!row.exerciseId || !row.topW) continue
    if (!sparkMap[row.exerciseId]) sparkMap[row.exerciseId] = []
    sparkMap[row.exerciseId].push(row.topW)
  }
  for (const id in sparkMap) {
    sparkMap[id] = sparkMap[id].slice(-8)
  }

  const enriched = exercises.map(e => ({
    ...e,
    lastWeight: sparkMap[e.id]?.[sparkMap[e.id].length - 1] ?? null,
    sparkPoints: sparkMap[e.id] ?? [],
  }))

  return (
    <AppShell>

      <div className="page-content">
        <ExercisesClient exercises={enriched} />
      </div>
    </AppShell>
  )
}
