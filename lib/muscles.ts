export type MuscleKey =
  | 'chest' | 'back' | 'lats' | 'traps'
  | 'shoulders' | 'triceps' | 'biceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'adductors' | 'abductors' | 'core'

export const MUSCLES: Record<MuscleKey, { label: string; hue: number }> = {
  chest:      { label: 'Chest',       hue: 0   },
  back:       { label: 'Back',        hue: 210 },
  lats:       { label: 'Lats',        hue: 220 },
  traps:      { label: 'Traps',       hue: 185 },
  shoulders:  { label: 'Shoulders',   hue: 270 },
  triceps:    { label: 'Triceps',     hue: 25  },
  biceps:     { label: 'Biceps',      hue: 140 },
  forearms:   { label: 'Forearms',    hue: 150 },
  quads:      { label: 'Quads',       hue: 45  },
  hamstrings: { label: 'Hamstrings',  hue: 30  },
  glutes:     { label: 'Glutes',      hue: 330 },
  calves:     { label: 'Calves',      hue: 35  },
  adductors:  { label: 'Adductors',   hue: 300 },
  abductors:  { label: 'Abductors',   hue: 285 },
  core:       { label: 'Core',        hue: 220 },
}

const MUSCLE_VAR_MAP: Record<string, string> = {
  chest:      '--m-chest',
  back:       '--m-back',
  lats:       '--m-back',
  traps:      '--m-back',
  shoulders:  '--m-shoulders',
  triceps:    '--m-arms',
  biceps:     '--m-arms',
  forearms:   '--m-arms',
  quads:      '--m-legs',
  hamstrings: '--m-legs',
  glutes:     '--m-legs',
  calves:     '--m-legs',
  adductors:  '--m-legs',
  abductors:  '--m-legs',
  core:       '--m-core',
}

export function muscleVar(key: string): string {
  return MUSCLE_VAR_MAP[key] ?? '--m-core'
}

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core'

// Collapse a fine-grained muscle key (e.g. 'triceps', 'quads') into one of the
// 6 display groups used by the planner / volume meters.
export function muscleGroup(key: string): MuscleGroup {
  return (MUSCLE_VAR_MAP[key]?.replace('--m-', '') ?? 'core') as MuscleGroup
}

export function muscleColor(key: string, opacity = 1): string {
  const m = MUSCLES[key as MuscleKey]
  if (!m) return `hsla(0,0%,50%,${opacity})`
  return `hsla(${m.hue},60%,42%,${opacity})`
}

export function muscleBg(key: string): string {
  return muscleColor(key, 0.12)
}

export function muscleLabel(key: string): string {
  return MUSCLES[key as MuscleKey]?.label ?? key
}

export function parseMuscles(json: string): MuscleKey[] {
  try { return JSON.parse(json) } catch { return [] }
}

// Unilateral exercises are logged one set per side, so a set count of N is really N/2
// effective sets per muscle. Bilateral exercises count their sets as-is.
export function effectiveSets(count: number, unilateral: boolean): number {
  return unilateral ? Math.ceil(count / 2) : count
}
