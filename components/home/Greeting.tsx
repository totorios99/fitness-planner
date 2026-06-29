'use client'

import { useState, useEffect } from 'react'

function compute(name: string) {
  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night'
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return { greeting, date, name }
}

export function Greeting({ name }: { name: string }) {
  // Initial value renders on the server too; re-derive on mount so the
  // greeting/date reflect the visitor's LOCAL time, not the server's.
  const [{ greeting, date }, set] = useState(() => compute(name))
  useEffect(() => { set(compute(name)) }, [name])

  return (
    <div className="home-mast-text">
      <div className="home-eyebrow" suppressHydrationWarning>{date}</div>
      <h1 className="home-title" suppressHydrationWarning>{greeting}, <em>{name}</em></h1>
      <p className="home-sub">Here&apos;s your training at a glance.</p>
    </div>
  )
}
