import { prisma } from '@/lib/prisma'
import { parseMuscles } from '@/lib/muscles'

// ── Public shapes ────────────────────────────────────────
export interface ThisWeek {
  sessions: number
  sets: number
  volume: number
  goal: number
}

export interface RecentSession {
  id: string
  name: string
  focus: string
  date: string        // ISO
  totalSets: number
  totalVol: number
  topMuscles: string[]
}

export interface HeatDay {
  date: string        // ISO (yyyy-mm-dd)
  trained: boolean
  sets: number
  level: 0 | 1 | 2 | 3
  future: boolean
  isToday: boolean
}
export interface HeatWeek {
  weekIdx: number
  monthLabel: string
  sessions: number
  days: HeatDay[]
}
export interface Consistency {
  cols: HeatWeek[]
  current: number
  best: number
  thisMonth: number
  weeklyAvg: string
  total: number
}

export interface HomeData {
  thisWeek: ThisWeek
  recent: RecentSession[]
  consistency: Consistency
}

const WEEKS = 24
const WEEKLY_GOAL = 5

// level from a day's set count — matches the prototype thresholds
function levelFor(sets: number): 0 | 1 | 2 | 3 {
  if (sets <= 0) return 0
  if (sets < 14) return 1
  if (sets < 19) return 2
  return 3
}

// local-midnight key for grouping sessions by calendar day
function dayKey(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function topMusclesFrom(
  exercises: { exercise: { primaryMuscles: string } | null; sets: { weightLb: number; reps: number }[] }[],
): string[] {
  const counts: Record<string, number> = {}
  for (const ex of exercises) {
    if (!ex.exercise) continue
    for (const m of parseMuscles(ex.exercise.primaryMuscles)) {
      counts[m] = (counts[m] ?? 0) + ex.sets.length
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0])
}

export async function getHomeData(): Promise<HomeData> {
  const today = new Date()

  // Monday of the current week (local)
  const dow = (today.getDay() + 6) % 7 // 0 = Monday
  const curMon = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow)
  // window start = Monday of the oldest visible week
  const windowStart = new Date(curMon)
  windowStart.setDate(curMon.getDate() - (WEEKS - 1) * 7)

  const [windowSessions, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { date: { gte: windowStart } },
      orderBy: { date: 'desc' },
      include: {
        exercises: {
          include: {
            exercise: { select: { primaryMuscles: true } },
            sets: { select: { weightLb: true, reps: true } },
          },
        },
      },
    }),
    prisma.workoutSession.count(),
  ])

  // Per-session aggregates
  const agg = windowSessions.map(s => {
    const totalSets = s.exercises.reduce((a, ex) => a + ex.sets.length, 0)
    const totalVol = s.exercises.reduce(
      (a, ex) => a + ex.sets.reduce((v, set) => v + set.weightLb * set.reps, 0),
      0,
    )
    return {
      id: s.id,
      label: s.label,
      date: new Date(s.date),
      totalSets,
      totalVol,
      topMuscles: topMusclesFrom(s.exercises),
    }
  })

  // Index sets-per-day and sessions-per-day
  const setsByDay: Record<string, number> = {}
  const sessionsByDay: Record<string, number> = {}
  for (const s of agg) {
    const k = dayKey(s.date)
    setsByDay[k] = (setsByDay[k] ?? 0) + s.totalSets
    sessionsByDay[k] = (sessionsByDay[k] ?? 0) + 1
  }

  // ── This week (last 7 days) ──
  const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  const wk = agg.filter(s => s.date >= weekAgo)
  const thisWeek: ThisWeek = {
    sessions: wk.length,
    sets: wk.reduce((a, s) => a + s.totalSets, 0),
    volume: wk.reduce((a, s) => a + s.totalVol, 0),
    goal: WEEKLY_GOAL,
  }

  // ── Recent (4 newest) ──
  const recent: RecentSession[] = agg.slice(0, 4).map(s => ({
    id: s.id,
    name: s.label,
    focus: focusText(s.topMuscles),
    date: s.date.toISOString(),
    totalSets: s.totalSets,
    totalVol: s.totalVol,
    topMuscles: s.topMuscles,
  }))

  // ── Consistency heatmap + streaks ──
  const todayKey = dayKey(today)
  const cols: HeatWeek[] = []
  let prevMonth = -1
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = new Date(curMon)
    weekStart.setDate(curMon.getDate() - (WEEKS - 1 - w) * 7)
    const days: HeatDay[] = []
    let weekSessions = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + d)
      const k = dayKey(date)
      const future = date > today && k !== todayKey
      const sets = setsByDay[k] ?? 0
      const trained = sets > 0
      weekSessions += sessionsByDay[k] ?? 0
      days.push({
        date: k,
        trained,
        sets,
        level: future ? 0 : levelFor(sets),
        future,
        isToday: k === todayKey,
      })
    }
    const m = weekStart.getMonth()
    const monthLabel = m !== prevMonth ? weekStart.toLocaleDateString('en-US', { month: 'short' }) : ''
    prevMonth = m
    cols.push({ weekIdx: w, monthLabel, sessions: weekSessions, days })
  }

  // streak = consecutive COMPLETED weeks with ≥3 sessions (exclude current partial week)
  const hit = cols.map(c => c.sessions >= 3)
  const completed = hit.slice(0, hit.length - 1)
  let current = 0
  for (let i = completed.length - 1; i >= 0; i--) {
    if (completed[i]) current++
    else break
  }
  let best = 0, run = 0
  for (const h of hit) {
    if (h) { run++; best = Math.max(best, run) } else run = 0
  }
  const thisMonth = cols.slice(-4).reduce((a, c) => a + c.sessions, 0)
  const windowTotal = cols.reduce((a, c) => a + c.sessions, 0)
  const weeklyAvg = (windowTotal / WEEKS).toFixed(1)

  return {
    thisWeek,
    recent,
    consistency: { cols, current, best, thisMonth, weeklyAvg, total },
  }
}

import { muscleGroup } from '@/lib/muscles'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Build a short focus line from the top muscle groups, e.g. "Chest · Arms"
function focusText(topMuscles: string[]): string {
  if (topMuscles.length === 0) return 'Training'
  const groups: string[] = []
  for (const m of topMuscles) {
    const g = muscleGroup(m)
    if (!groups.includes(g)) groups.push(g)
  }
  return groups.slice(0, 2).map(cap).join(' · ')
}
