'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SidebarUserRole from './SidebarUserRole'
import BehoerdenAuditTracker from './BehoerdenAuditTracker'
import SystemModeGuard from './SystemModeGuard'

type Benutzerprofil = {
  id: string
  rolle: string | null
  aktiv: boolean | null
}

type NavItem = {
  href: string
  label: string
}

type NavGroup = {
  key: string
  label: string
  items: NavItem[]
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profil, setProfil] = useState<Benutzerprofil | null>(null)
  const [openSection, setOpenSection] = useState<string | null>('uebersicht')
  const [logoutLaden, setLogoutLaden] = useState(false)

  const hideSidebar = pathname === '/login' || pathname === '/reset-passwort'

  useEffect(() => {
    async function laden() {
      const sessionRes = await supabase.auth.getSession()
      const userId = sessionRes.data.session?.user?.id

      if (!userId) {
        setProfil(null)
        return
      }

      const { data } = await supabase
        .from('benutzerprofile')
        .select('id, rolle, aktiv')
        .eq('id', userId)
        .maybeSingle()

      setProfil((data as Benutzerprofil | null) || null)
    }

    laden()
  }, [])

  async function logout() {
    setLogoutLaden(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    setLogoutLaden(false)
  }

  const rolle = profil?.rolle || 'Unbekannt'
  const istBehoerde = rolle === 'Behördenvertreter'
  const istAdmin = rolle === 'Admin'
  const istWerkstattmeister = rolle === 'Werkstattmeister'

  const groups = useMemo<NavGroup[]>(() => {
    const overviewGroup: NavGroup = {
      key: 'uebersicht',
      label: 'Übersicht',
      items: [
        { href: '/', label: 'Dashboard' },
        { href: '/suche', label: 'Suche' },
        { href: '/benachrichtigungen', label: 'Benachrichtigungen' },
        { href: '/wiki', label: 'Wiki / User Guide' },
      ],
    }

    const kundenGroup: NavGroup = {
      key: 'kunden',
      label: 'Kunden & Fahrzeuge',
      items: [
        { href: '/kunden', label: 'Kunden' },
        { href: '/fahrzeuge', label: 'Fahrzeuge' },
        { href: '/auftragsannahme', label: 'Auftragsannahme' },
      ],
    }

    const serviceGroup: NavGroup = {
      key: 'service',
      label: 'Werkstattbetrieb',
      items: [
        { href: '/serviceauftraege', label: 'Serviceaufträge' },
        { href: '/termine', label: 'Termine' },
        { href: '/kalender', label: 'Kalender / Planung' },
        { href: '/arbeitsplaetze', label: 'Arbeitsplätze' },
        { href: '/schichten', label: 'Schichten' },
      ],
    }

    const lagerGroup: NavGroup = {
      key: 'lager',
      label: 'Lager',
      items: [
        { href: '/lager', label: 'Lager' },
        { href: '/lagerwert', label: 'Lagerwert' },
      ],
    }

    const finanzenGroup: NavGroup = {
      key: 'finanzen',
      label: 'Finanzen',
      items: [
        { href: '/angebote', label: 'Angebote' },
        { href: '/rechnungen', label: 'Rechnungen' },
        { href: '/zahlungen', label: 'Zahlungen' },
        { href: '/offene-posten', label: 'Offene Posten' },
        { href: '/forderungen', label: 'Forderungen' },
        { href: '/mahnungen', label: 'Mahnungen' },
        { href: '/dokumente', label: 'Dokumente' },
      ],
    }

    const verwaltungGroup: NavGroup = {
      key: 'verwaltung',
      label: 'Verwaltung',
      items: [
        { href: '/firmenprofil', label: 'Firmenprofil' },
        { href: '/benutzer', label: 'Benutzer' },
        { href: '/einstellungen', label: 'Einstellungen' },
        { href: '/aktivitaetslog', label: 'Aktivitätslog' },
      ],
    }

    if (istBehoerde) {
      return [overviewGroup, kundenGroup, serviceGroup, lagerGroup, finanzenGroup]
    }

    if (istAdmin) {
      return [overviewGroup, kundenGroup, serviceGroup, lagerGroup, finanzenGroup, verwaltungGroup]
    }

    if (istWerkstattmeister) {
      return [overviewGroup, kundenGroup, serviceGroup, lagerGroup]
    }

    return [overviewGroup, kundenGroup, serviceGroup, lagerGroup, finanzenGroup]
  }, [istAdmin, istBehoerde, istWerkstattmeister])

  if (hideSidebar) {
    return (
      <>
        <BehoerdenAuditTracker />
        <SystemModeGuard>
          <main>{children}</main>
        </SystemModeGuard>
      </>
    )
  }

  return (
    <>
      <BehoerdenAuditTracker />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-top">Werkstatt CRM</div>
            <div className="sidebar-brand-sub">
              {istBehoerde
                ? 'Behördenansicht · Nur Lesemodus'
                : istAdmin
                ? 'Adminbereich'
                : istWerkstattmeister
                ? 'Werkstattmeister'
                : 'Werkstattverwaltung'}
            </div>
          </div>

          <div className="hazard-bar" aria-hidden="true" />

          <SidebarUserRole />

          {istBehoerde && (
            <div className="sidebar-mode-card behoerde">
              <div className="sidebar-mode-title">🛡 Behördenmodus</div>
              <div className="sidebar-mode-text">
                Voller Lesezugriff, keine Bearbeitung oder Erstellung.
              </div>
            </div>
          )}

          {istAdmin && (
            <div className="sidebar-mode-card admin">
              <div className="sidebar-mode-title">🛡 Adminmodus</div>
              <div className="sidebar-mode-text">
                Vollzugriff auf System, Benutzer, Einstellungen und Logs.
              </div>
            </div>
          )}

          <div className="sidebar-logout-wrap">
            <button
              type="button"
              className="sidebar-logout-button"
              onClick={logout}
              disabled={logoutLaden}
            >
              {logoutLaden ? 'Abmeldung läuft ...' : '⏻ Abmelden'}
            </button>
          </div>

          <nav className="sidebar-nav">
            {groups.map((group) => (
              <div className="sidebar-group" key={group.key}>
                <button
                  className="sidebar-group-title"
                  onClick={() => setOpenSection((prev) => (prev === group.key ? null : group.key))}
                  type="button"
                >
                  <span>{group.label}</span>
                  <span className="sidebar-group-chevron">
                    {openSection === group.key ? '−' : '+'}
                  </span>
                </button>

                {openSection === group.key && (
                  <div className="sidebar-section">
                    {group.items.map((item) => {
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`sidebar-link ${active ? 'active' : ''}`}
                        >
                          <span>{item.label}</span>
                          {istBehoerde && group.key !== 'uebersicht' && (
                            <span className="sidebar-readonly-badge">RO</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className={`main-content ${istBehoerde ? 'behoerde-layout' : ''}`}>
          <SystemModeGuard>
            {istBehoerde && (
              <>
                <div className="behoerde-watermark" aria-hidden="true">
                  NUR LESEZUGRIFF · BEHÖRDENVERTRETER
                </div>
                <div className="behoerde-hinweis">
                  <div>
                    <strong>Lesemodus aktiv</strong>
                    <div>Diese Ansicht ist nur zur Einsicht freigegeben. Änderungen sind nicht erlaubt.</div>
                  </div>
                </div>
              </>
            )}

            {children}
          </SystemModeGuard>
        </main>
      </div>
    </>
  )
}