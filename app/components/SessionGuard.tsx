'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type SessionResult = {
  ok: boolean
  message: string
  benutzer?: {
    id: string
    benutzername: string
    rolle: string
    aktiv: boolean
    muss_passwort_aendern: boolean
    nur_eine_sitzung: boolean
  }
}

export default function SessionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [bereit, setBereit] = useState(false)

  useEffect(() => {
    async function pruefen() {
      if (pathname === '/login') {
        setBereit(true)
        return
      }

      const benutzerId = localStorage.getItem('werkstatt_benutzer_id')
      const sitzungToken = localStorage.getItem('werkstatt_sitzung_token')

      if (!benutzerId || !sitzungToken) {
        localStorage.clear()
        router.push('/login')
        return
      }

      const { data, error } = await supabase.rpc('pruefe_benutzer_sitzung', {
        p_benutzer_id: benutzerId,
        p_sitzung_token: sitzungToken,
      })

      if (error) {
        localStorage.clear()
        router.push('/login')
        return
      }

      const result = data as SessionResult

      if (!result.ok || !result.benutzer) {
        alert(result.message || 'Deine Sitzung ist nicht mehr gültig.')
        localStorage.clear()
        router.push('/login')
        return
      }

      localStorage.setItem('werkstatt_benutzername', result.benutzer.benutzername)
      localStorage.setItem('werkstatt_rolle', result.benutzer.rolle)
      localStorage.setItem('werkstatt_aktiv', String(result.benutzer.aktiv))
      localStorage.setItem('werkstatt_muss_passwort_aendern', String(result.benutzer.muss_passwort_aendern))
      localStorage.setItem('werkstatt_nur_eine_sitzung', String(result.benutzer.nur_eine_sitzung))

      setBereit(true)
    }

    pruefen()
  }, [pathname, router])

  useEffect(() => {
    if (pathname === '/login') return

    const interval = window.setInterval(async () => {
      const benutzerId = localStorage.getItem('werkstatt_benutzer_id')
      const sitzungToken = localStorage.getItem('werkstatt_sitzung_token')

      if (!benutzerId || !sitzungToken) return

      const { data, error } = await supabase.rpc('pruefe_benutzer_sitzung', {
        p_benutzer_id: benutzerId,
        p_sitzung_token: sitzungToken,
      })

      if (error) return

      const result = data as SessionResult

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