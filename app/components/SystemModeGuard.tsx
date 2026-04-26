'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Modus = {
  id: string
  aktiv: boolean
  seiten: string[] | null
}

type Benutzerprofil = {
  rolle: string | null
}

export default function SystemModeGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [lockdown, setLockdown] = useState<Modus | null>(null)
  const [wartung, setWartung] = useState<Modus | null>(null)
  const [profil, setProfil] = useState<Benutzerprofil | null>(null)
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    async function laden() {
      const sessionRes = await supabase.auth.getSession()
      const userId = sessionRes.data.session?.user?.id

      if (userId) {
        const profilRes = await supabase
          .from('benutzerprofile')
          .select('rolle')
          .eq('id', userId)
          .maybeSingle()

        setProfil((profilRes.data as Benutzerprofil | null) || null)
      }

      const modusRes = await supabase
        .from('system_modus')
        .select('*')
        .in('id', ['lockdown', 'wartung'])

      if (!modusRes.error) {
        const daten = (modusRes.data || []) as Modus[]
        setLockdown(daten.find((m) => m.id === 'lockdown') || null)
        setWartung(daten.find((m) => m.id === 'wartung') || null)
      }

      setGeladen(true)
    }

    laden()
  }, [pathname])

  const istAdmin = profil?.rolle === 'Admin'

  const wartungAktivFuerSeite = useMemo(() => {
    if (!wartung?.aktiv) return false
    const seiten = wartung.seiten || []
    return seiten.includes('*') || seiten.includes(pathname)
  }, [wartung, pathname])

  if (!geladen || pathname === '/login' || pathname === '/reset-passwort') {
    return <>{children}</>
  }

  if (lockdown?.aktiv && !istAdmin) {
    return (
      <div className="lockdown-screen">
        <div className="lockdown-pulse" />
        <div className="lockdown-card">
          <div className="lockdown-title">LOCKDOWN AKTIV</div>
          <div className="lockdown-subtitle">
            Das Werkstatt-System wurde durch die Administration gesperrt.
          </div>
          <div className="lockdown-warning">
            Zugriff verweigert · Sicherheitsmodus aktiv · Bitte auf Freigabe warten
          </div>
        </div>
      </div>
    )
  }

  if (wartungAktivFuerSeite && !istAdmin) {
    return (
      <div className="maintenance-screen">
        <div className="maintenance-card">
          <div className="maintenance-title">WARTUNGSMODUS</div>
          <div className="maintenance-subtitle">
            Diese Seite wird aktuell gewartet.
          </div>
          <div className="maintenance-warning">
            Bitte später erneut versuchen.
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}