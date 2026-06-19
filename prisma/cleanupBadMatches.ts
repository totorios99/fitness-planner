/**
 * Find sessions corrupted by the old substring import matcher (e.g. "Leg Press - Single
 * Leg" wrongly linked to "Leg Press"). A SessionExercise is a bad match when its rawName
 * does NOT exactly match the linked exercise's name (after normalize). Such sessions are
 * deleted so they can be re-imported with the fixed exact-match importer.
 *
 * Run: npx tsx prisma/cleanupBadMatches.ts          (dry run, lists affected sessions)
 *      npx tsx prisma/cleanupBadMatches.ts --apply  (delete affected sessions)
 */
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL ?? 'file:./prisma/forma.db'
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

const APPLY = process.argv.includes('--apply')

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function main() {
  const sessions = await prisma.workoutSession.findMany({
    include: { exercises: { include: { exercise: { select: { name: true } } } } },
    orderBy: { date: 'desc' },
  })

  const affected = sessions.filter(s =>
    s.exercises.some(ex => ex.exercise && normalize(ex.rawName) !== normalize(ex.exercise.name)),
  )

  console.log(`Sessions: ${sessions.length} · affected (bad matches): ${affected.length}`)
  for (const s of affected) {
    console.log(`\n  ✗ ${s.date.toISOString().slice(0, 10)} · ${s.label} (${s.id})`)
    for (const ex of s.exercises) {
      if (ex.exercise && normalize(ex.rawName) !== normalize(ex.exercise.name)) {
        console.log(`      "${ex.rawName}" → linked as "${ex.exercise.name}"`)
      }
    }
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to delete these sessions, then re-import them.')
    await prisma.$disconnect()
    return
  }

  const ids = affected.map(s => s.id)
  if (ids.length) {
    const deleted = await prisma.workoutSession.deleteMany({ where: { id: { in: ids } } })
    console.log(`\n✓ Deleted ${deleted.count} sessions. Re-import the affected Strong exports.`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
