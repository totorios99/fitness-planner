'use client'

import { useState } from 'react'
import { Icon } from '@/components/Icon'

export default function MobilityNotes({
  slug, initialNotes,
}: {
  slug: string
  initialNotes: string
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const dirty = notes !== saved

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/exercises/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: notes }),
      })
      if (res.ok) setSaved(notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="chart-card mob-notes">
      <div className="chart-card-head">
        <span className="chart-title">Notes</span>
        {dirty && (
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>
      <textarea
        className="mob-notes-area"
        placeholder="e.g. Focus on stretching your glutes, hold at max contraction for at least 4 seconds."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={6}
      />
    </div>
  )
}
