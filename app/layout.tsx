import './globals.css'
import Link from 'next/link'
import { ReactNode } from 'react'
import SidebarUserRole from './components/SidebarUserRole'
import BehoerdenAuditTracker from './components/BehoerdenAuditTracker'

export const metadata = {
  title: 'Werkstatt CRM',
  description: 'Werkstattverwaltung',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <BehoerdenAuditTracker />

        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-title">Werkstatt CRM</div>

            <SidebarUserRole />

            <div className="sidebar-section">
              <Link href="/" className="sidebar-link">Dashboard</Link>
              <Link href="/suche" className="sidebar-link">Suche</Link>
              <Link href="/kunden" className="sidebar-link">Kunden</Link>
              <Link href="/fahrzeuge" className="sidebar-link">Fahrzeuge</Link>
              <Link href="/serviceauftraege" className="sidebar-link">Serviceaufträge</Link>
              <Link href="/termine" className="sidebar-link">Termine</Link>
              <Link href="/lager" className="sidebar-link">Lager</Link>
              <Link href="/arbeitsplaetze" className="sidebar-link">Arbeitsplätze</Link>
              <Link href="/schichten" className="sidebar-link">Schichten</Link>
              <Link href="/rechnungen" className="sidebar-link">Rechnungen</Link>
              <Link href="/zahlungen" className="sidebar-link">Zahlungen</Link>
              <Link href="/angebote" className="sidebar-link">Angebote</Link>
              <Link href="/offene-posten" className="sidebar-link">Offene Posten</Link>
              <Link href="/forderungen" className="sidebar-link">Forderungen</Link>
              <Link href="/mahnungen" className="sidebar-link">Mahnungen</Link>
              <Link href="/auswertung" className="sidebar-link">Auswertung</Link>
              <Link href="/arbeitszeit-auswertung" className="sidebar-link">Arbeitszeit-Auswertung</Link>
              <Link href="/lagerwert" className="sidebar-link">Lagerwert</Link>
              <Link href="/kunden-auswertung" className="sidebar-link">Kunden-Auswertung</Link>
              <Link href="/service-status" className="sidebar-link">Service-Status</Link>
              <Link href="/exporte" className="sidebar-link">Exporte</Link>
              <Link href="/benachrichtigungen" className="sidebar-link">Benachrichtigungen</Link>
              <Link href="/aufgaben" className="sidebar-link">Aufgaben</Link>
              <Link href="/fahrzeugannahme" className="sidebar-link">Fahrzeugannahme</Link>
              <Link href="/fahrzeugabholung" className="sidebar-link">Fahrzeugabholung</Link>
              <Link href="/firmenprofil" className="sidebar-link">Firmenprofil</Link>
              <Link href="/auftragsannahme" className="sidebar-link">Auftragsannahme</Link>
              <Link href="/zusatzfreigaben" className="sidebar-link">Zusatzfreigaben</Link>
              <Link href="/benutzer" className="sidebar-link">Benutzer</Link>
              <Link href="/einstellungen" className="sidebar-link">Einstellungen</Link>
            </div>
          </aside>

          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  )
}