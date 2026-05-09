'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LoginResult = {
  ok: boolean
  message: string
  benutzer?: {
    id: string
    benutzername: string
    rolle: string
    aktiv: boolean
    muss_passwort_aendern: boolean
  }
}

export default function LoginPage() {
  const router = useRouter()

  const [benutzername, setBenutzername] = useState('')
  const [passwort, setPasswort] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setLaden(true)

    const { data, error } = await supabase.rpc('login_mit_benutzername', {
      p_benutzername: benutzername,
      p_passwort: passwort,
    })

    setLaden(false)

    if (error) {
      setFehler(error.message)
      return
    }

    const result = data as LoginResult

    if (!result.ok || !result.benutzer) {
      setFehler(result.message || 'Login fehlgeschlagen.')
      return
    }

    localStorage.setItem('werkstatt_benutzer_id', result.benutzer.id)
    localStorage.setItem('werkstatt_benutzername', result.benutzer.benutzername)
    localStorage.setItem('werkstatt_rolle', result.benutzer.rolle)
    localStorage.setItem('werkstatt_aktiv', String(result.benutzer.aktiv))
    localStorage.setItem('werkstatt_muss_passwort_aendern', String(result.benutzer.muss_passwort_aendern))

    if (result.benutzer.muss_passwort_aendern) {
      router.push('/mein-konto')
      return
    }

    router.push('/')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at top, rgba(245,158,11,0.18), transparent 40%), linear-gradient(135deg, #0f151b, #111827)',
        padding: 24,
      }}
    >
      <form
        onSubmit={login}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'rgba(17,24,39,0.92)',
          border: '1px solid rgba(245,158,11,0.45)',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 20px 80px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            marginBottom: 22,
            borderBottom: '1px solid rgba(245,158,11,0.25)',
            paddingBottom: 18,
          }}
        >
          <div
            style={{
              color: '#f59e0b',
              fontWeight: 1000,
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Werkstatt ERP
          </div>

          <h1
            style={{
              margin: '8px 0 0',
              color: '#fff',
              fontSize: 32,
              fontWeight: 1000,
            }}
          >
            Interner Login
          </h1>

          <p style={{ color: '#9ca3af', marginBottom: 0 }}>
            Anmeldung ausschließlich mit Benutzername und Passwort.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <input
            placeholder="Benutzername"
            value={benutzername}
            onChange={(e) => setBenutzername(e.target.value)}
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Passwort"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {fehler && (
          <div className="error-box" style={{ marginTop: 14 }}>
            {fehler}
          </div>
        )}

        <button
          type="submit"
          disabled={laden}
          style={{
            width: '100%',
            marginTop: 18,
            background: laden ? '#6b7280' : '#f59e0b',
            color: '#111827',
            fontWeight: 1000,
          }}
        >
          {laden ? 'Login läuft ...' : 'Einloggen'}
        </button>

        <div
          style={{
            marginTop: 18,
            color: '#6b7280',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Zugriff nur für berechtigte interne Benutzer.
        </div>
      </form>
    </main>
  )
}