'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SidebarUserRole() {
  const router = useRouter()

  const [rolle, setRolle] = useState('Lade...')
  const [benutzername, setBenutzername] = useState('')
  const [fehler, setFehler] = useState('')

  async function ladeProfil() {
    setFehler('')

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      setRolle('Unbekannt')
      setFehler(sessionError.message)
      return
    }

    const user = session?.user

    if (!user) {
      setRolle('Nicht eingeloggt')
      setBenutzername('')
      return
    }

    const { data, error } = await supabase
      .from('benutzerprofile')
      .select('rolle, aktiv, benutzername')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      setRolle('Unbekannt')
      setFehler(error?.message || 'Kein Benutzerprofil gefunden')
      return
    }

    if (!data.aktiv) {
      setRolle('Deaktiviert')
      setBenutzername(data.benutzername || '')
      return
    }

    setRolle(data.rolle || 'Unbekannt')
    setBenutzername(data.benutzername || '')
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    ladeProfil()
  }, [])

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8 }}>Angemeldete Rolle</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{rolle}</div>

      {benutzername ? (
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
          Benutzer: {benutzername}
        </div>
      ) : null}

      <div className="action-row" style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={logout}
          style={{ background: '#dc2626', width: '100%' }}
        >
          Logout
        </button>
      </div>

      {fehler && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          {fehler}
        </div>
      )}
    </div>
  )
}