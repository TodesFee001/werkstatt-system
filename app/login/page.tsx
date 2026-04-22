'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [benutzername, setBenutzername] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')
  const [laedt, setLaedt] = useState(false)

  async function anmelden(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')
    setLaedt(true)

    if (!benutzername.trim()) {
      setFehler('Bitte Benutzernamen eingeben.')
      setLaedt(false)
      return
    }

    const { data: authEmail, error: lookupError } = await supabase.rpc(
      'get_auth_login_email_for_username',
      {
        p_benutzername: benutzername.trim(),
      }
    )

    if (lookupError || !authEmail) {
      setFehler('Benutzername nicht gefunden oder Benutzer deaktiviert.')
      setLaedt(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: passwort,
    })

    if (error) {
      setFehler(error.message)
      setLaedt(false)
      return
    }

    await supabase.rpc('touch_last_login')

    await supabase.rpc('log_behoerden_event', {
      p_event_typ: 'login',
      p_pfad: '/login',
      p_details: {
        zeitpunkt: new Date().toISOString(),
        user_agent:
          typeof window !== 'undefined' ? window.navigator.userAgent : null,
      },
    })

    setLaedt(false)
    setMeldung('Login erfolgreich. Du wirst weitergeleitet ...')
    router.push('/')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'linear-gradient(135deg, #dbeafe 0%, #eef2ff 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'white',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Login</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Melde dich mit Benutzername und Passwort an.
        </p>

        <form onSubmit={anmelden}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="text"
              placeholder="Benutzername"
              value={benutzername}
              onChange={(e) => setBenutzername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Passwort"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
            />

            <button type="submit" disabled={laedt}>
              {laedt ? 'Anmeldung läuft ...' : 'Anmelden'}
            </button>
          </div>
        </form>

        {meldung && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: '#dcfce7',
              color: '#166534',
            }}
          >
            {meldung}
          </div>
        )}

        {fehler && <div className="error-box">{fehler}</div>}
      </div>
    </div>
  )
}