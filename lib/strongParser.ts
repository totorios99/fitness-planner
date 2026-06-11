export interface ParsedSet {
  setNumber: number
  weightLb: number
  reps: number
}

export interface ParsedExercise {
  rawName: string
  sets: ParsedSet[]
}

export interface ParsedSession {
  label: string
  date: Date
  exercises: ParsedExercise[]
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

function parseStrongDate(str: string): Date {
  const match = str.match(/(\d+)\s+(\w+)\s+(\d{4})\s+at\s+(\d+):(\d+)/)
  if (!match) return new Date()
  const [, day, month, year, hour, min] = match
  return new Date(
    parseInt(year),
    MONTHS[month.toLowerCase()] ?? 0,
    parseInt(day),
    parseInt(hour),
    parseInt(min),
  )
}

export function parseStrongExport(text: string): ParsedSession {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const label = lines[0] ?? 'Workout'
  const date = parseStrongDate(lines[1] ?? '')

  const exercises: ParsedExercise[] = []
  let current: ParsedExercise | null = null

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('http')) continue

    const setMatch = line.match(/^Set\s+(\d+):\s+([\d.]+)\s+lb\s+[x×]\s+(\d+)/i)
    if (setMatch) {
      current?.sets.push({
        setNumber: parseInt(setMatch[1]),
        weightLb: parseFloat(setMatch[2]),
        reps: parseInt(setMatch[3]),
      })
    } else {
      if (current) exercises.push(current)
      current = { rawName: line, sets: [] }
    }
  }
  if (current) exercises.push(current)

  return { label, date, exercises }
}
