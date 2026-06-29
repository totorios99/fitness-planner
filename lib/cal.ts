export function calLevel(level: 0 | 1 | 2 | 3): string {
  return level === 0 ? 'var(--bg-sunken)'
    : level === 1 ? 'color-mix(in oklab, var(--accent) 32%, var(--bg-sunken))'
    : level === 2 ? 'color-mix(in oklab, var(--accent) 62%, var(--bg-sunken))'
    : 'var(--accent)'
}
