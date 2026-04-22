'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswortPage() {
  const router = useRouter()

  const [passwort, setPasswort] = useState('')
  const [passwortWiederholen, setPasswortWiederholen] = useState('')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')
  const [laedt, setLaedt] = useState(false)

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!passwort.trim()) {
      setFehler('Bitte ein neues Passwort eingeben.')
      return
    }

    if (passwort.length < 6) {
      setFehler('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    if (passwort !== passwortWiederholen) {
      setFehler('Die Passwörter stimmen nicht überein.')
      return
    }

    setLaedt(true)

    const { error } = await supabase.auth.updateUser({
      password: passwort,
    })

    setLaedt(false)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Passwort erfolgreich aktualisiert.')

    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 1500)
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
        <h1 style={{ marginTop: 0 }}>Neues Passwort setzen</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Gib hier dein neues Passwort ein.
        </p>

        <form onSubmit={speichern}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="password"
              placeholder="Neues Passwort"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
            />

            <input
              type="password"
              placeholder="Passwort wiederholen"
              value={passwortWiederholen}
              onChange={(e) => setPasswortWiederholen(e.target.value)}
            />

            <button type="submit" disabled={laedt}>
              {laedt ? 'Speichern ...' : 'Passwort speichern'}
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