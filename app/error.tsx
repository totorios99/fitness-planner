'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page-content">
      <div className="home">
        <div className="home-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h1 className="home-title" style={{ fontSize: 32, marginBottom: 8 }}>Something went wrong</h1>
          <p className="t-body" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>
            {error.message || 'Failed to load your home dashboard.'}
          </p>
          <button className="btn btn-primary" onClick={reset}>Try again</button>
        </div>
      </div>
    </div>
  )
}
