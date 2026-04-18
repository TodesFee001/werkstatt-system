'use client'

import Link from 'next/link'
import './globals.css'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [eingeloggt, setEingeloggt] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkUser() {
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

      setEingeloggt(!!session)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== '/login') {
        router.push('/login')
        setEingeloggt(false)
      } else {
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