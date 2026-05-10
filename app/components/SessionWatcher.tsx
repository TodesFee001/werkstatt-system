'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profil = {
  aktiv: boolean | null
  nur_eine_sitzung: boolean | null
}

type SessionResult = {
  ok: boolean
  message: string
}

export default function SessionWatcher() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/login') return

    const interval = window.setInterval(async () => {
      const benutzerId = localStorage.getItem('werkstatt_benutzer_id')
      const token = localStorage.getItem('werkstatt_sitzung_token')

      if (!benutzerId) return

      const profilRes = await supabase
        .from('benutzerprofile')
        .select('aktiv, nur_eine_sitzung')
        .eq('id', benutzerId)
        .maybeSingle()

      if (profilRes.error || !profilRes.data) return

      const profil = profilRes.data as Profil

      if (profil.aktiv === false) {
        alert('Dein Benutzer wurde deaktiviert.')
        localStorage.clear()
        router.push('/login')
        return
      }

      if (profil.nur_eine_sitzung !== true) return
      if (!token) return

      const sessionRes = await supabase.rpc('pruefe_benutzer_sitzung', {
        p_benutzer_id: benutzerId,
        p_sitzung_token: token,
      })

      if (sessionRes.error) return

      const result = sessionRes.data as SessionResult

      if (!result.ok) {
        alert(result.message || 'Deine Sitzung wurde beendet.')
        localStorage.clear()
        router.push('/login')
      }
    }, 15000)

    return () => window.clearInterval(interval)
  }, [pathname, router])

  return null
}