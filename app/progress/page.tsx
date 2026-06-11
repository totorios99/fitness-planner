import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/AppShell'
import { TopNav } from '@/components/TopNav'
import ProgressClient from './ProgressClient'

export const dynamic = 'force-dynamic'

export default async function ProgressPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, category: true },
  })

  return (
    <AppShell>
      <TopNav title="Progress" />
      <div className="page-content">
        <Suspense fallback={<div className="page-inner" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Loading…</div>}>
          <ProgressClient exercises={exercises} />
        </Suspense>
      </div>
    </AppShell>
  )
}
