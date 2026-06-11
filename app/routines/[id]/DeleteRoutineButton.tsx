'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteRoutineButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/routines/${id}`, { method: 'DELETE' })
    router.push('/routines')
    router.refresh()
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
        <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Confirm Delete'}
        </button>
      </div>
    )
  }

  return (
    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirm(true)}>
      Delete
    </button>
  )
}
