'use client'

import Link from 'next/link'
import './globals.css'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'

type Benutzerprofil = {
  id: string
  rolle_id: string | null
}

type Rolle = {
  id: string
  name: string
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [eingeloggt, setEingeloggt] = useState<boolean | null>(null)
  const [rollenname, setRollenname] = useState<string | null>(null)

  useEffect(() => {
    async function checkUserUndRolle() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session && pathname !== '/login') {
        router.push('/login')
        setEingeloggt(false)
        return
      }

      if (session && pathname === '/login') {
        router.push('/')
      }

      if (session) {
        const { data: profil } = await supabase
          .from('benutzerprofile')
          .select('rolle_id')
          .eq('id', session.user.id)
          .single()

        if (profil?.rolle_id) {
          const { data: rolle } = await supabase
            .from('rollen')
            .select('name')
            .eq('id', profil.rolle_id)
            .single()

          setRollenname(rolle?.name || null)
        } else {
          setRollenname(null)
        }
      }

      setEingeloggt(!!session)
    }

    checkUserUndRolle()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session && pathname !== '/login') {
        router.push('/login')
        setEingeloggt(false)
        setRollenname(null)
      } else {
        if (session) {
          const { data: profil } = await supabase
            .from('benutzerprofile')
            .select('rolle_id')
            .eq('id', session.user.id)
            .single()

          if (profil?.rolle_id) {
            const { data: rolle } = await supabase
              .from('rollen')
              .select('name')
              .eq('id', profil.rolle_id)
              .single()

            setRollenname(rolle?.name || null)
          } else {
            setRollenname(null)
          }
        }

        setEingeloggt(!!session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (eingeloggt === null && pathname !== '/login') {
    return (
      <html lang="de">
        <body>
          <div style={{ padding: 40 }}>Lade...</div>
        </body>
      </html>
    )
  }

  if (pathname === '/login') {
    return (
      <html lang="de">
        <body>{children}</body>
      </html>
    )
  }

  const istAdmin = rollenname === 'Admin'
  const istBuchhaltung = rollenname === 'Buchhaltung'
  const istWerkstatt = rollenname === 'Werkstatt'
  const istServiceannahme = rollenname === 'Serviceannahme'
  const istLager = rollenname === 'Lager'

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
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Werkstatt</h2>
            <div style={{ marginBottom: 20, opacity: 0.8, fontSize: 14 }}>
              Rolle: {rollenname || 'keine Rolle'}
            </div>

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

              {(istAdmin || istWerkstatt || istServiceannahme) && (
                <Link href="/serviceauftraege" className="sidebar-link" style={{ color: 'white' }}>
                  Serviceaufträge
                </Link>
              )}

              {(istAdmin || istBuchhaltung) && (
                <Link href="/rechnungen" className="sidebar-link" style={{ color: 'white' }}>
                  Rechnungen
                </Link>
              )}

              {(istAdmin || istBuchhaltung) && (
                <Link href="/zahlungen" className="sidebar-link" style={{ color: 'white' }}>
                  Zahlungen
                </Link>
              )}

              {(istAdmin || istWerkstatt || istServiceannahme) && (
                <Link href="/servicehistorie" className="sidebar-link" style={{ color: 'white' }}>
                  Fahrzeughistorie
                </Link>
              )}

              {(istAdmin || istWerkstatt) && (
                <Link href="/mitarbeiter" className="sidebar-link" style={{ color: 'white' }}>
                  Mitarbeiter
                </Link>
              )}

              {(istAdmin || istWerkstatt) && (
                <Link href="/abwesenheiten" className="sidebar-link" style={{ color: 'white' }}>
                  Abwesenheiten
                </Link>
              )}

              {(istAdmin || istWerkstatt || istServiceannahme) && (
                <Link href="/dokumente" className="sidebar-link" style={{ color: 'white' }}>
                  Dokumente
                </Link>
              )}

              {(istAdmin || istLager) && (
                <div className="sidebar-link" style={{ color: 'white', opacity: 0.6 }}>
                  Lager
                </div>
              )}

              {istAdmin && (
                <Link href="/einstellungen" className="sidebar-link" style={{ color: 'white' }}>
                  Einstellungen
                </Link>
              )}

              {istAdmin && (
                <Link href="/benutzer" className="sidebar-link" style={{ color: 'white' }}>
                  Benutzer
                </Link>
              )}
            </nav>

            <div style={{ marginTop: 24 }}>
              <button
                onClick={logout}
                style={{
                  width: '100%',
                  background: '#dc2626',
                }}
              >
                Logout
              </button>
            </div>
          </aside>

          <main style={{ flex: 1, padding: '24px' }}>{children}</main>
        </div>
      </body>
    </html>
  )
}