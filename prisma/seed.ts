import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import path from 'path'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), 'prisma/forma.db')}`,
})
const prisma = new PrismaClient({ adapter })

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const EXERCISES = [
  // PUSH — Chest
  { name: 'Bench Press (Barbell)',          cat: 'push', eq: 'barbell',    pri: ['chest'],            sec: ['triceps', 'shoulders'] },
  { name: 'Incline Bench Press (Barbell)',  cat: 'push', eq: 'barbell',    pri: ['chest'],            sec: ['triceps', 'shoulders'] },
  { name: 'Incline Chest Press (Machine)', cat: 'push', eq: 'machine',    pri: ['chest'],            sec: ['triceps', 'shoulders'] },
  { name: 'Chest Fly — Station',           cat: 'push', eq: 'machine',    pri: ['chest'],            sec: ['shoulders'] },
  { name: 'Cable Fly',                     cat: 'push', eq: 'cable',      pri: ['chest'],            sec: ['shoulders'] },
  { name: 'Push-Up',                       cat: 'push', eq: 'bodyweight', pri: ['chest'],            sec: ['triceps', 'shoulders'] },
  // PUSH — Shoulders
  { name: 'Overhead Press (Barbell)',       cat: 'push', eq: 'barbell',    pri: ['shoulders'],        sec: ['triceps', 'traps'] },
  { name: 'Dumbbell Shoulder Press',        cat: 'push', eq: 'dumbbell',   pri: ['shoulders'],        sec: ['triceps'] },
  { name: 'Lateral Raise (Dumbbell)',       cat: 'push', eq: 'dumbbell',   pri: ['shoulders'],        sec: [] },
  { name: 'Front Raise (Dumbbell)',         cat: 'push', eq: 'dumbbell',   pri: ['shoulders'],        sec: [] },
  { name: 'Upright Row (Barbell)',          cat: 'push', eq: 'barbell',    pri: ['shoulders', 'traps'], sec: ['biceps'] },
  // PUSH — Triceps
  { name: 'Triceps Pushdown (Cable - Straight Bar)', cat: 'push', eq: 'cable', pri: ['triceps'], sec: [] },
  { name: 'Triceps Pushdown (Cable - Rope)',         cat: 'push', eq: 'cable', pri: ['triceps'], sec: [] },
  { name: 'Triceps Extension (Cable)',               cat: 'push', eq: 'cable', pri: ['triceps'], sec: [] },
  { name: 'Skull Crusher (Barbell)',                 cat: 'push', eq: 'barbell', pri: ['triceps'], sec: ['chest'] },
  { name: 'Dips (Bodyweight)',                       cat: 'push', eq: 'bodyweight', pri: ['triceps', 'chest'], sec: ['shoulders'] },
  // PULL — Back
  { name: 'Lat Pulldown (Cable)',           cat: 'pull', eq: 'cable',      pri: ['lats'],             sec: ['biceps', 'back'] },
  { name: 'Seated Row (Cable)',             cat: 'pull', eq: 'cable',      pri: ['back', 'lats'],     sec: ['biceps'] },
  { name: 'Seated Wide-Grip Row (Cable)',   cat: 'pull', eq: 'cable',      pri: ['back', 'lats'],     sec: ['biceps'] },
  { name: 'Barbell Row',                   cat: 'pull', eq: 'barbell',    pri: ['back', 'lats'],     sec: ['biceps', 'core'] },
  { name: 'Pull-Up',                       cat: 'pull', eq: 'bodyweight', pri: ['lats', 'back'],     sec: ['biceps'] },
  { name: 'Chin-Up',                       cat: 'pull', eq: 'bodyweight', pri: ['lats', 'biceps'],   sec: ['back'] },
  { name: 'Face Pull (Cable)',              cat: 'pull', eq: 'cable',      pri: ['shoulders', 'traps'], sec: ['back'] },
  { name: 'Shrug (Barbell)',               cat: 'pull', eq: 'barbell',    pri: ['traps'],            sec: [] },
  // PULL — Biceps
  { name: 'Bicep Curl (Barbell)',          cat: 'pull', eq: 'barbell',    pri: ['biceps'],           sec: ['forearms'] },
  { name: 'Bicep Curl (Dumbbell)',         cat: 'pull', eq: 'dumbbell',   pri: ['biceps'],           sec: ['forearms'] },
  { name: 'Bicep Curl (Machine)',          cat: 'pull', eq: 'machine',    pri: ['biceps'],           sec: [] },
  { name: 'Hammer Curl (Dumbbell)',        cat: 'pull', eq: 'dumbbell',   pri: ['biceps', 'forearms'], sec: [] },
  { name: 'Preacher Curl (EZ-Bar)',        cat: 'pull', eq: 'barbell',    pri: ['biceps'],           sec: [] },
  { name: 'Cable Curl',                   cat: 'pull', eq: 'cable',      pri: ['biceps'],           sec: [] },
  // LEGS
  { name: 'Squat (Barbell)',              cat: 'legs', eq: 'barbell',    pri: ['quads', 'glutes'],  sec: ['hamstrings', 'core'] },
  { name: 'Leg Press',                    cat: 'legs', eq: 'machine',    pri: ['quads', 'glutes'],  sec: ['hamstrings'] },
  { name: 'Romanian Deadlift',            cat: 'legs', eq: 'barbell',    pri: ['hamstrings', 'glutes'], sec: ['back', 'core'] },
  { name: 'Deadlift (Barbell)',           cat: 'legs', eq: 'barbell',    pri: ['back', 'hamstrings', 'glutes'], sec: ['quads', 'core', 'traps'] },
  { name: 'Leg Extension',               cat: 'legs', eq: 'machine',    pri: ['quads'],            sec: [] },
  { name: 'Leg Curl (Machine)',           cat: 'legs', eq: 'machine',    pri: ['hamstrings'],       sec: [] },
  { name: 'Bulgarian Split Squat',        cat: 'legs', eq: 'dumbbell',   pri: ['quads', 'glutes'],  sec: ['hamstrings'] },
  { name: 'Hip Thrust (Barbell)',         cat: 'legs', eq: 'barbell',    pri: ['glutes'],           sec: ['hamstrings'] },
  { name: 'Calf Raise (Machine)',         cat: 'legs', eq: 'machine',    pri: ['calves'],           sec: [] },
  { name: 'Walking Lunge',               cat: 'legs', eq: 'dumbbell',   pri: ['quads', 'glutes'],  sec: ['hamstrings'] },
  { name: 'Hack Squat',                  cat: 'legs', eq: 'machine',    pri: ['quads'],            sec: ['glutes', 'hamstrings'] },
  // CORE
  { name: 'Plank',                       cat: 'core', eq: 'bodyweight', pri: ['core'],             sec: ['shoulders'] },
  { name: 'Crunch',                      cat: 'core', eq: 'bodyweight', pri: ['core'],             sec: [] },
  { name: 'Cable Crunch',                cat: 'core', eq: 'cable',      pri: ['core'],             sec: [] },
  { name: 'Ab Wheel Rollout',            cat: 'core', eq: 'other',      pri: ['core'],             sec: ['lats', 'shoulders'] },
  { name: 'Hanging Leg Raise',           cat: 'core', eq: 'bodyweight', pri: ['core'],             sec: [] },
] as const

async function main() {
  // Clear all tables in dependency order
  await prisma.routineExercise.deleteMany()
  await prisma.routineDay.deleteMany()
  await prisma.routine.deleteMany()
  await prisma.setLog.deleteMany()
  await prisma.sessionExercise.deleteMany()
  await prisma.workoutSession.deleteMany()
  await prisma.exercise.deleteMany()

  // Seed exercises
  const byName: Record<string, string> = {}
  for (const ex of EXERCISES) {
    const e = await prisma.exercise.create({
      data: {
        name: ex.name,
        slug: slug(ex.name),
        category: ex.cat,
        equipment: ex.eq,
        primaryMuscles: JSON.stringify(ex.pri),
        secondaryMuscles: JSON.stringify(ex.sec),
      },
    })
    byName[ex.name] = e.id
  }

  const id = (name: string) => {
    const v = byName[name]
    if (!v) throw new Error(`No exercise: ${name}`)
    return v
  }

  // ── Routine 1: Upper / Lower ──────────────────────────────────────────────
  const ul = await prisma.routine.create({
    data: { name: 'Upper / Lower', description: '4-day split. Upper twice, lower twice. Classic strength/hypertrophy balance.', daysPerWeek: 4 },
  })

  const ulDays = [
    { label: 'Upper A', idx: 0, exs: [
      { n: 'Bench Press (Barbell)',                   s: 4, r: '5–8'   },
      { n: 'Barbell Row',                             s: 4, r: '5–8'   },
      { n: 'Overhead Press (Barbell)',                s: 3, r: '8–12'  },
      { n: 'Lat Pulldown (Cable)',                    s: 3, r: '8–12'  },
      { n: 'Triceps Pushdown (Cable - Straight Bar)', s: 3, r: '10–15' },
      { n: 'Bicep Curl (Barbell)',                    s: 3, r: '10–15' },
    ]},
    { label: 'Lower A', idx: 1, exs: [
      { n: 'Squat (Barbell)',       s: 4, r: '5–8'   },
      { n: 'Romanian Deadlift',     s: 3, r: '8–12'  },
      { n: 'Leg Press',             s: 3, r: '10–15' },
      { n: 'Leg Curl (Machine)',    s: 3, r: '10–15' },
      { n: 'Calf Raise (Machine)',  s: 4, r: '12–20' },
    ]},
    { label: 'Upper B', idx: 2, exs: [
      { n: 'Incline Bench Press (Barbell)', s: 4, r: '8–12'  },
      { n: 'Seated Row (Cable)',            s: 4, r: '8–12'  },
      { n: 'Dumbbell Shoulder Press',       s: 3, r: '10–15' },
      { n: 'Pull-Up',                       s: 3, r: '6–10'  },
      { n: 'Lateral Raise (Dumbbell)',      s: 3, r: '12–15' },
      { n: 'Hammer Curl (Dumbbell)',        s: 3, r: '10–15' },
      { n: 'Skull Crusher (Barbell)',       s: 3, r: '10–15' },
    ]},
    { label: 'Lower B', idx: 3, exs: [
      { n: 'Deadlift (Barbell)',       s: 4, r: '4–6'   },
      { n: 'Bulgarian Split Squat',    s: 3, r: '8–12'  },
      { n: 'Leg Extension',            s: 3, r: '12–15' },
      { n: 'Hip Thrust (Barbell)',     s: 3, r: '10–15' },
      { n: 'Calf Raise (Machine)',     s: 4, r: '12–20' },
    ]},
  ]

  for (const day of ulDays) {
    const d = await prisma.routineDay.create({ data: { routineId: ul.id, dayIndex: day.idx, label: day.label } })
    for (let i = 0; i < day.exs.length; i++) {
      const e = day.exs[i]
      await prisma.routineExercise.create({
        data: { routineDayId: d.id, exerciseId: id(e.n), orderIndex: i, targetSets: e.s, targetReps: e.r },
      })
    }
  }

  // ── Routine 2: Push / Pull / Legs ─────────────────────────────────────────
  const ppl = await prisma.routine.create({
    data: { name: 'Push / Pull / Legs', description: '6-day PPL. Each muscle hit twice per week. Max frequency.', daysPerWeek: 6 },
  })

  const pplDays = [
    { label: 'Push A', idx: 0, exs: [
      { n: 'Bench Press (Barbell)',                   s: 4, r: '5–8'   },
      { n: 'Overhead Press (Barbell)',                s: 3, r: '8–12'  },
      { n: 'Incline Chest Press (Machine)',           s: 3, r: '10–15' },
      { n: 'Lateral Raise (Dumbbell)',                s: 4, r: '12–15' },
      { n: 'Triceps Pushdown (Cable - Straight Bar)', s: 3, r: '10–15' },
      { n: 'Skull Crusher (Barbell)',                 s: 3, r: '10–15' },
    ]},
    { label: 'Pull A', idx: 1, exs: [
      { n: 'Barbell Row',                s: 4, r: '5–8'   },
      { n: 'Lat Pulldown (Cable)',        s: 3, r: '8–12'  },
      { n: 'Seated Row (Cable)',          s: 3, r: '10–15' },
      { n: 'Face Pull (Cable)',           s: 3, r: '12–15' },
      { n: 'Bicep Curl (Barbell)',        s: 3, r: '10–15' },
      { n: 'Hammer Curl (Dumbbell)',      s: 3, r: '10–15' },
    ]},
    { label: 'Legs A', idx: 2, exs: [
      { n: 'Squat (Barbell)',      s: 4, r: '5–8'   },
      { n: 'Romanian Deadlift',    s: 3, r: '8–12'  },
      { n: 'Leg Press',            s: 3, r: '10–15' },
      { n: 'Leg Curl (Machine)',   s: 3, r: '10–15' },
      { n: 'Calf Raise (Machine)', s: 4, r: '15–20' },
    ]},
    { label: 'Push B', idx: 3, exs: [
      { n: 'Incline Bench Press (Barbell)', s: 4, r: '8–12'  },
      { n: 'Dumbbell Shoulder Press',       s: 3, r: '10–12' },
      { n: 'Chest Fly — Station',           s: 3, r: '12–15' },
      { n: 'Lateral Raise (Dumbbell)',      s: 4, r: '15–20' },
      { n: 'Triceps Extension (Cable)',     s: 3, r: '12–15' },
      { n: 'Dips (Bodyweight)',             s: 3, r: '8–12'  },
    ]},
    { label: 'Pull B', idx: 4, exs: [
      { n: 'Pull-Up',                       s: 4, r: '6–10'  },
      { n: 'Seated Wide-Grip Row (Cable)',   s: 3, r: '10–12' },
      { n: 'Face Pull (Cable)',              s: 3, r: '15–20' },
      { n: 'Shrug (Barbell)',               s: 3, r: '10–15' },
      { n: 'Preacher Curl (EZ-Bar)',        s: 3, r: '10–12' },
      { n: 'Cable Curl',                    s: 3, r: '12–15' },
    ]},
    { label: 'Legs B', idx: 5, exs: [
      { n: 'Deadlift (Barbell)',       s: 4, r: '4–6'   },
      { n: 'Bulgarian Split Squat',    s: 3, r: '8–12'  },
      { n: 'Hack Squat',              s: 3, r: '10–15' },
      { n: 'Hip Thrust (Barbell)',     s: 3, r: '10–15' },
      { n: 'Leg Extension',           s: 3, r: '15–20' },
      { n: 'Calf Raise (Machine)',     s: 4, r: '15–20' },
    ]},
  ]

  for (const day of pplDays) {
    const d = await prisma.routineDay.create({ data: { routineId: ppl.id, dayIndex: day.idx, label: day.label } })
    for (let i = 0; i < day.exs.length; i++) {
      const e = day.exs[i]
      await prisma.routineExercise.create({
        data: { routineDayId: d.id, exerciseId: id(e.n), orderIndex: i, targetSets: e.s, targetReps: e.r },
      })
    }
  }

  // ── Routine 3: Full Body 3× ───────────────────────────────────────────────
  const fb = await prisma.routine.create({
    data: { name: 'Full Body 3×', description: '3-day full body. Hit everything every session. Great for beginners and time-pressed.', daysPerWeek: 3 },
  })

  const fbDays = [
    { label: 'Full Body A', idx: 0, exs: [
      { n: 'Squat (Barbell)',                         s: 3, r: '5'     },
      { n: 'Bench Press (Barbell)',                   s: 3, r: '5'     },
      { n: 'Barbell Row',                             s: 3, r: '5'     },
      { n: 'Overhead Press (Barbell)',                s: 2, r: '8–12'  },
      { n: 'Bicep Curl (Barbell)',                    s: 2, r: '10–15' },
      { n: 'Triceps Pushdown (Cable - Straight Bar)', s: 2, r: '10–15' },
    ]},
    { label: 'Full Body B', idx: 1, exs: [
      { n: 'Deadlift (Barbell)',            s: 3, r: '5'     },
      { n: 'Incline Bench Press (Barbell)', s: 3, r: '8–12'  },
      { n: 'Lat Pulldown (Cable)',          s: 3, r: '8–12'  },
      { n: 'Dumbbell Shoulder Press',       s: 2, r: '10–12' },
      { n: 'Hammer Curl (Dumbbell)',        s: 2, r: '10–15' },
      { n: 'Calf Raise (Machine)',          s: 3, r: '15–20' },
    ]},
    { label: 'Full Body C', idx: 2, exs: [
      { n: 'Squat (Barbell)',          s: 3, r: '5'     },
      { n: 'Bench Press (Barbell)',    s: 3, r: '5'     },
      { n: 'Seated Row (Cable)',       s: 3, r: '8–12'  },
      { n: 'Lateral Raise (Dumbbell)', s: 3, r: '12–15' },
      { n: 'Romanian Deadlift',        s: 3, r: '10–12' },
      { n: 'Plank',                    s: 3, r: '30–60s' },
    ]},
  ]

  for (const day of fbDays) {
    const d = await prisma.routineDay.create({ data: { routineId: fb.id, dayIndex: day.idx, label: day.label } })
    for (let i = 0; i < day.exs.length; i++) {
      const e = day.exs[i]
      await prisma.routineExercise.create({
        data: { routineDayId: d.id, exerciseId: id(e.n), orderIndex: i, targetSets: e.s, targetReps: e.r },
      })
    }
  }

  console.log(`✓ Seeded ${EXERCISES.length} exercises and 3 routines`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
