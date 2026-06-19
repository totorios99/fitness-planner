/**
 * Import Strong CSV export into Forma DB.
 * Run: npx tsx prisma/importCsv.ts
 */
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL ?? 'file:./prisma/forma.db'
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

// ── CSV helpers ────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQ = false
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
  for await (const line of rl) {
    if (line.trim()) rows.push(parseCSVLine(line))
  }
  return rows
}

// ── Exercise inference ─────────────────────────────────────────────────────────

function inferEquipment(name: string): string {
  const n = name.toLowerCase()
  if (/\(barbell\)/.test(n)) return 'barbell'
  if (/\(dumbbell\)/.test(n)) return 'dumbbell'
  if (/\(cable\)|cable/.test(n)) return 'cable'
  if (/\(machine\)|\bmachine\b|smith/.test(n)) return 'machine'
  if (/\(band\)|band/.test(n)) return 'other'
  if (/pull.?up|chin.?up|dip/.test(n)) return 'bodyweight'
  return 'other'
}

function inferCategory(name: string): string {
  const n = name.toLowerCase()
  if (/squat|leg press|leg curl|leg extension|deadlift|calf|glute|hip abduct|hip adduct|hack/.test(n)) return 'legs'
  if (/row|pulldown|pull.?up|chin.?up|face pull|pullover|lat pull|t.?bar|reverse fly/.test(n)) return 'pull'
  if (/press|fly|dip|pushdown|push.?up|chest|incline|decline/.test(n)) return 'push'
  if (/curl|bicep|hammer curl|preacher|bayesian|spider|incline curl/.test(n)) return 'pull'
  if (/tricep|skull|jm press|extension/.test(n)) return 'push'
  if (/shrug|upright row|lateral raise|front raise|shoulder|overhead/.test(n)) return 'push'
  if (/crunch|ab |plank|core/.test(n)) return 'core'
  return 'other'
}

function inferMuscles(category: string): { primary: string[]; secondary: string[] } {
  switch (category) {
    case 'push':  return { primary: ['chest', 'shoulders', 'triceps'], secondary: [] }
    case 'pull':  return { primary: ['back', 'lats', 'biceps'], secondary: [] }
    case 'legs':  return { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves'] }
    case 'core':  return { primary: ['core'], secondary: [] }
    default:      return { primary: [], secondary: [] }
  }
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isUnilateral(name: string): boolean {
  return /single (leg|arm)|one[- ]arm|one[- ]leg|unilateral/i.test(name)
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.join(process.cwd(), 'strong_workouts.csv')
  console.log('Reading', csvPath)
  const rows = await readCSV(csvPath)
  const [header, ...data] = rows

  // Column indices
  const col = (name: string) => header.indexOf(name)
  const iDate     = col('Date')
  const iLabel    = col('Workout Name')
  const iExName   = col('Exercise Name')
  const iSetOrder = col('Set Order')
  const iWeight   = col('Weight')
  const iReps     = col('Reps')

  // ── Load existing exercise library ──────────────────────────────────────────
  const libExercises = await prisma.exercise.findMany({ select: { id: true, name: true, slug: true } })
  const exByNorm = new Map(libExercises.map(e => [normalize(e.name), e]))

  // Exact-name match only — Strong name is source of truth. Variants (unilateral, cable
  // vs barbell, seated vs lying) are distinct names → distinct records.
  function matchExercise(rawName: string) {
    return exByNorm.get(normalize(rawName)) ?? null
  }

  // ── Collect all unique CSV exercise names & create missing ones ─────────────
  const csvNames = new Set(data.map(r => r[iExName]).filter(Boolean))
  const exIdMap = new Map<string, string>() // rawName → exercise.id

  const toCreate: { name: string; slug: string; category: string; equipment: string; primary: string[]; secondary: string[] }[] = []

  for (const rawName of csvNames) {
    const match = matchExercise(rawName)
    if (match) {
      exIdMap.set(rawName, match.id)
    } else {
      const category  = inferCategory(rawName)
      const equipment = inferEquipment(rawName)
      const muscles   = inferMuscles(category)
      let slug = toSlug(rawName)
      // ensure slug unique
      if (libExercises.find(e => e.slug === slug)) slug = slug + '-2'
      toCreate.push({ name: rawName, slug, category, equipment, primary: muscles.primary, secondary: muscles.secondary })
    }
  }

  if (toCreate.length > 0) {
    console.log(`Creating ${toCreate.length} new exercises…`)
    for (const ex of toCreate) {
      const created = await prisma.exercise.create({
        data: {
          name: ex.name,
          slug: ex.slug,
          category: ex.category,
          equipment: ex.equipment,
          type: 'lifting',
          unilateral: isUnilateral(ex.name),
          primaryMuscles:   JSON.stringify(ex.primary),
          secondaryMuscles: JSON.stringify(ex.secondary),
        },
      })
      exIdMap.set(ex.name, created.id)
      exByNorm.set(normalize(ex.name), created)
    }
    console.log('Done creating exercises.')
  }

  // ── Group rows into sessions: (date string + label) ────────────────────────
  type SetRow = { setNumber: number; weightLb: number; reps: number }
  type ExRow  = { rawName: string; sets: SetRow[] }
  type Session = { date: Date; label: string; exercises: ExRow[] }

  const sessionMap = new Map<string, Session>()

  for (const row of data) {
    const dateStr = row[iDate]
    const label   = row[iLabel]
    const exName  = row[iExName]
    const reps    = Math.round(parseFloat(row[iReps]) || 0)
    if (!dateStr || !exName || reps === 0) continue

    const weight    = parseFloat(row[iWeight]) || 0
    const setNumber = parseInt(row[iSetOrder]) || 1
    const key       = dateStr + '|' + label

    if (!sessionMap.has(key)) {
      sessionMap.set(key, { date: new Date(dateStr), label, exercises: [] })
    }
    const session = sessionMap.get(key)!

    let exRow = session.exercises.find(e => e.rawName === exName)
    if (!exRow) {
      exRow = { rawName: exName, sets: [] }
      session.exercises.push(exRow)
    }
    exRow.sets.push({ setNumber, weightLb: weight, reps })
  }

  console.log(`Importing ${sessionMap.size} sessions…`)

  // ── Check existing sessions to avoid duplicates ─────────────────────────────
  const existingDates = new Set(
    (await prisma.workoutSession.findMany({ select: { date: true, label: true } }))
      .map(s => s.date.toISOString() + '|' + s.label)
  )

  let created = 0, skipped = 0

  for (const [, session] of sessionMap) {
    const key = session.date.toISOString() + '|' + session.label
    if (existingDates.has(key)) { skipped++; continue }

    await prisma.workoutSession.create({
      data: {
        date:   session.date,
        label:  session.label,
        source: 'strong_import',
        exercises: {
          create: session.exercises.map((ex, i) => ({
            rawName:    ex.rawName,
            orderIndex: i,
            exerciseId: exIdMap.get(ex.rawName) ?? null,
            sets: {
              create: ex.sets.map(s => ({
                setNumber: s.setNumber,
                weightLb:  s.weightLb,
                reps:      s.reps,
              })),
            },
          })),
        },
      },
    })
    created++
  }

  console.log(`✓ Imported ${created} sessions, skipped ${skipped} duplicates.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
