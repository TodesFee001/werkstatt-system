import Link from 'next/link'
import './globals.css'

export const metadata = {
  title: 'Werkstatt System',
  description: 'Werkstatt- und Service-System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <aside
            style={{
              width: '250px',
              background: '#111827',
              color: 'white',
              padding: '24px 18px',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>Werkstatt</h2>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/" className="sidebar-link" style={{ color: 'white' }}>
                Dashboard
              </Link>
              <Link href="/kunden" className="sidebar-link" style={{ color: 'white' }}>
                Kunden
              </Link>
              <Link href="/fahrzeuge" className="sidebar-link" style={{ color: 'white' }}>
                Fahrzeuge
              </Link>
              <Link href="/serviceauftraege" className="sidebar-link" style={{ color: 'white' }}>
                Serviceaufträge
              </Link>
              <Link href="/rechnungen" className="sidebar-link" style={{ color: 'white' }}>
                Rechnungen
              </Link>
              <Link href="/zahlungen" className="sidebar-link" style={{ color: 'white' }}>
                Zahlungen
              </Link>
              <Link href="/mitarbeiter" className="sidebar-link" style={{ color: 'white' }}>
  Mitarbeiter
</Link>
<Link href="/einstellungen" className="sidebar-link" style={{ color: 'white' }}>
  Einstellungen
</Link>
<Link href="/abwesenheiten" className="sidebar-link" style={{ color: 'white' }}>
  Abwesenheiten
</Link>
<Link href="/dokumente" className="sidebar-link" style={{ color: 'white' }}>
  Dokumente
</Link>
<Link href="/servicehistorie" className="sidebar-link" style={{ color: 'white' }}>
  Fahrzeughistorie
</Link>
            </nav>
          </aside>

          <main style={{ flex: 1, padding: '24px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}