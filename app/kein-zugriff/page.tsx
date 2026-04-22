'use client'

import Link from 'next/link'

export default function KeinZugriffPage() {
  return (
    <div className="page-card">
      <h1>Kein Zugriff</h1>
      <p>Du hast keine Berechtigung, diese Seite aufzurufen.</p>

      <div className="action-row" style={{ marginTop: 16 }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            background: '#2563eb',
            color: 'white',
            borderRadius: 12,
            textDecoration: 'none',
          }}
        >
          Zum Dashboard
        </Link>

        <Link
          href="/login"
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            background: '#6b7280',
            color: 'white',
            borderRadius: 12,
            textDecoration: 'none',
          }}
        >
          Zum Login
        </Link>
      </div>
    </div>
  )
}