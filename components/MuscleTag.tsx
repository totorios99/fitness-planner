import { muscleVar, muscleLabel } from '@/lib/muscles'

export function MuscleTag({
  muscle,
  secondary = false,
  size = 'sm',
}: {
  muscle: string
  secondary?: boolean
  size?: 'sm' | 'xs'
}) {
  const cssVar = muscleVar(muscle)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'xs' ? '1px 6px' : '2px 8px',
        borderRadius: 9999,
        fontSize: size === 'xs' ? 10 : 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: `var(${cssVar})`,
        background: `color-mix(in oklab, var(${cssVar}) 12%, transparent)`,
        opacity: secondary ? 0.7 : 1,
      }}
    >
      {muscleLabel(muscle)}
    </span>
  )
}
