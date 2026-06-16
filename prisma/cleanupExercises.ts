/**
 * Delete exercises from the library that the Strong CSV import would NOT link to.
 * Mirrors the matching logic in importCsv.ts so the kept set == the linked set.
 *
 * Run: npx tsx prisma/cleanupExercises.ts          (dry run, lists deletions)
 *      npx tsx prisma/cleanupExercises.ts --apply  (perform deletions)
 */
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL ?? 'file:./prisma/forma.db'
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

const APPLY = process.argv.includes('--apply')

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQ = !inQ; continue }
    if (c === ',' && !inQ) { fields.push(cur.trim()); cur = ''; continue }
    cur += c
  }
  fields.push(cur.trim())
  return fields
}

async function readCSV(filePath: string): Promise<string[][]> {
  const rows: string[][] = []
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity })
  for await (const line of rl) if (line.trim()) rows.push(parseCSVLine(line))
  return rows
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function main() {
  const csvPath = path.join(process.cwd(), 'strong_workouts.csv')
  const rows = await readCSV(csvPath)
  const [header, ...data] = rows
  const iExName = header.indexOf('Exercise Name')
  const csvNames = [...new Set(data.map(r => r[iExName]).filter(Boolean))]

  const lib = await prisma.exercise.findMany({ select: { id: true, name: true } })
  const exByNorm = new Map(lib.map(e => [normalize(e.name), e]))

  function matchExercise(rawName: string) {
    const n = normalize(rawName)
    if (exByNorm.has(n)) return exByNorm.get(n)!
    for (const [key, ex] of exByNorm) {
      if (key.includes(n) || n.includes(key)) return ex
    }
    return null
  }

  // Exercise IDs the import would link to → keep these
  const keepIds = new Set<string>()
  for (const raw of csvNames) {
    const m = matchExercise(raw)
    if (m) keepIds.add(m.id)
  }

  const toDelete = lib.filter(e => !keepIds.has(e.id))

  console.log(`Library: ${lib.length} · CSV-linked (keep): ${keepIds.size} · to delete: ${toDelete.length}`)
  for (const e of toDelete) console.log('  ✗', e.name)

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to delete.')
    await prisma.$disconnect()
    return
  }

  const delIds = toDelete.map(e => e.id)
  if (delIds.length) {
    // Null FK references that allow it, remove required ones, then delete.
    const nulled = await prisma.sessionExercise.updateMany({
      where: { exerciseId: { in: delIds } },
      data: { exerciseId: null },
    })
    const routineRm = await prisma.routineExercise.deleteMany({
      where: { exerciseId: { in: delIds } },
    })
    const deleted = await prisma.exercise.deleteMany({ where: { id: { in: delIds } } })
    console.log(`\n✓ Deleted ${deleted.count} exercises (unlinked ${nulled.count} session sets, removed ${routineRm.count} routine entries).`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
