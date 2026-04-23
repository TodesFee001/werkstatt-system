'use client'

import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'

export default function FahrzeugannahmePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Serviceannahme', 'Werkstatt']}>
      <div className="page-card">
        <h1>Fahrzeugannahme</h1>
        <p>
          Diese Seite ist jetzt nur noch der direkte Einstieg zur gemeinsamen
          <strong> Auftragsannahme / Fahrzeugcheck</strong>-Maske.
        </p>

        <div className="action-row">
          <Link
            href="/auftragsannahme"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              background: '#2563eb',
              color: 'white',
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            Zur gemeinsamen Annahmeseite
          </Link>
        </div>
      </div>
    </RoleGuard>
  )
}