'use client'

import { ReactNode, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import SidebarUserRole from './SidebarUserRole'
import BehoerdenAuditTracker from './BehoerdenAuditTracker'

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [openSection, setOpenSection] = useState<string | null>('kunden')

  const hideSidebar = pathname === '/login' || pathname === '/reset-passwort'

  if (hideSidebar) {
    return (
      <>
        <BehoerdenAuditTracker />
        <main>{children}</main>
      </>
    )
  }

  function toggleSection(section: string) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  return (
    <>
      <BehoerdenAuditTracker />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-title">Werkstatt CRM</div>

          <SidebarUserRole />

          <div className="sidebar-group">
            <button className="sidebar-group-title" onClick={() => toggleSection('dashboard')} type="button">
              Übersicht
            </button>
            {openSection === 'dashboard' && (
              <div className="sidebar-section">
                <Link href="/" className="sidebar-link">Dashboard</Link>
                <Link href="/suche" className="sidebar-link">Suche</Link>
                <Link href="/benachrichtigungen" className="sidebar-link">Benachrichtigungen</Link>
              </div>
            )}
          </div>

          <div className="sidebar-group">
            <button className="sidebar-group-title" onClick={() => toggleSection('kunden')} type="button">
              Kunden & Fahrzeuge
            </button>
            {openSection === 'kunden' && (
              <div className="sidebar-section">
                <Link href="/kunden" className="sidebar-link">Kunden</Link>
                <Link href="/fahrzeuge" className="sidebar-link">Fahrzeuge</Link>
                <Link href="/fahrzeugannahme" className="sidebar-link">Fahrzeugannahme</Link>
                <Link href="/auftragsannahme" className="sidebar-link">Auftragsannahme</Link>
              </div>
            )}
          </div>

          <div className="sidebar-group">
            <button className="sidebar-group-title" onClick={() => toggleSection('service')} type="button">
              Werkstattbetrieb
            </button>
            {openSection === 'service' && (
              <div className="sidebar-section">
                <Link href="/serviceauftraege" className="sidebar-link">Serviceaufträge</Link>
                <Link href="/termine" className="sidebar-link">Termine</Link>
                <Link href="/arbeitsplaetze" className="sidebar-link">Arbeitsplätze</Link>
                <Link href="/schichten" className="sidebar-link">Schichten</Link>
              </div>
            )}
          </div>

          <div className="sidebar-group">
            <button className="sidebar-group-title" onClick={() => toggleSection('lager')} type="button">
              Lager
            </button>
            {openSection === 'lager' && (
              <div className="sidebar-section">
                <Link href="/lager" className="sidebar-link">Lager</Link>
                <Link href="/lagerwert" className="sidebar-link">Lagerwert</Link>
              </div>
            )}
          </div>

          <div className="sidebar-group">
            <button className="sidebar-group-title" onClick={() => toggleSection('finanzen')} type="button">
              Finanzen
            </button>
            {openSection === 'finanzen' && (
              <div className="sidebar-section">
                <Link href="/angebote" className="sidebar-link">Angebote</Link>
                <Link href="/rechnungen" className="sidebar-link">Rechnungen</Link>
                <Link href="/zahlungen" className="sidebar-link">Zahlungen</Link>
                <Link href="/offene-posten" className="sidebar-link">Offene Posten</Link>
                <Link href="/forderungen" className="sidebar-link">Forderungen</Link>
                <Link href="/mahnungen" className="sidebar-link">Mahnungen</Link>
              </div>
            )}
          </div>

          <div className="sidebar-group">
            <button className="sidebar-group-title" onClick={() => toggleSection('verwaltung')} type="button">
              Verwaltung
            </button>
            {openSection === 'verwaltung' && (
              <div className="sidebar-section">
                <Link href="/firmenprofil" className="sidebar-link">Firmenprofil</Link>
                <Link href="/benutzer" className="sidebar-link">Benutzer</Link>
                <Link href="/einstellungen" className="sidebar-link">Einstellungen</Link>
              </div>
            )}
          </div>
        </aside>

        <main className="main-content">{children}</main>
      </div>
    </>
  )
}