'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profil = {
  id: string
  benutzername: string | null
  rolle: string | null
  aktiv: boolean | null
  muss_passwort_aendern: boolean | null
  nur_eine_sitzung: boolean | null
}

type SessionResult = {
  ok: boolean
  message: string
}

export default function SessionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [bereit, setBereit] = useState(false)

  useEffect(() => {
    let mounted = true

    async function pruefen() {
      setBereit(false)

      if (pathname === '/login') {
        if (mounted) setBereit(true)
        return
      }

      const benutzerId = localStorage.getItem('werkstatt_benutzer_id')

      if (!benutzerId) {
        localStorage.clear()
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('benutzerprofile')
        .select('id, benutzername, rolle, aktiv, muss_passwort_aendern, nur_eine_sitzung')
        .eq('id', benutzerId)
        .maybeSingle()

      if (error || !data) {
        localStorage.clear()
        router.push('/login')
        return
      }

      const profil = data as Profil

      if (profil.aktiv === false) {
        alert('Dein Benutzer wurde deaktiviert.')
        localStorage.clear()
        router.push('/login')
        return
      }

      localStorage.setItem('werkstatt_benutzername', profil.benutzername || '')
      localStorage.setItem('werkstatt_rolle', profil.rolle || '')
      localStorage.setItem('werkstatt_aktiv', String(profil.aktiv ?? true))
      localStorage.setItem('werkstatt_muss_passwort_aendern', String(Boolean(profil.muss_passwort_aendern)))
      localStorage.setItem('werkstatt_nur_eine_sitzung', String(Boolean(profil.nur_eine_sitzung)))

      if (profil.muss_passwort_aendern && pathname !== '/mein-konto') {
        router.push('/mein-konto')
        return
      }

      if (profil.nur_eine_sitzung === true) {
        const token = localStorage.getItem('werkstatt_sitzung_token')

        if (!token) {
          localStorage.clear()
          router.push('/login')
          return
        }

        const sessionRes = await supabase.rpc('pruefe_benutzer_sitzung', {
          p_benutzer_id: benutzerId,
          p_sitzung_token: token,
        })

        if (sessionRes.error) {
          localStorage.clear()
          router.push('/login')
          return
        }

        const result = sessionRes.data as SessionResult

        if (!result.ok) {
          alert(result.message || 'Deine Sitzung wurde beendet.')
          localStorage.clear()
          router.push('/login')
          return
        }
      }

      if (mounted) setBereit(true)
    }

    pruefen()

    return () => {
      mounted = false
    }
  }, [pathname, router])

  useEffect(() => {
    if (pathname === '/login') return

    const interval = window.setInterval(async () => {
      const benutzerId = localStorage.getItem('werkstatt_benutzer_id')

      if (!benutzerId) return

      const { data, error } = await supabase
        .from('benutzerprofile')
        .select('aktiv, nur_eine_sitzung')
        .eq('id', benutzerId)
        .maybeSingle()

      if (error || !data) return

      const profil = data as {
        aktiv: boolean | null
        nur_eine_sitzung: boolean | null
      }

      if (profil.aktiv === false) {
        alert('Dein Benutzer wurde deaktiviert.')
        localStorage.clear()
        router.push('/login')
        return
      }

      if (profil.nur_eine_sitzung !== true) {
        return
      }

      const token = localStorage.getItem('werkstatt_sitzung_token')

      if (!token) {
        localStorage.clear()
        router.push('/login')
        return
      }

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

  if (!bereit) return null

  return <>{children}</>
}