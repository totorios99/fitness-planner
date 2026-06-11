export type MuscleKey =
  | 'chest' | 'back' | 'lats' | 'traps'
  | 'shoulders' | 'triceps' | 'biceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core'

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
  core:       { label: 'Core',        hue: 220 },
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
