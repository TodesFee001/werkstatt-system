'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [benutzername, setBenutzername] = useState('')
  const [passwort, setPasswort] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function anmelden(e: FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')
    setLaden(true)

    try {
      if (!benutzername.trim() || !passwort.trim()) {
        setFehler('Bitte Benutzername und Passwort eingeben.')
        setLaden(false)
        return
      }

      const { data: loginData, error: loginError } = await supabase.rpc(
        'login_mit_benutzername',
        {
          p_benutzername: benutzername.trim(),
          p_passwort: passwort,
        }
      )

      if (loginError) {
        setFehler(loginError.message)
        setLaden(false)
        return
      }

      const loginResult = Array.isArray(loginData) ? loginData[0] : loginData

      if (!loginResult?.success) {
        setFehler(loginResult?.message || 'Anmeldung fehlgeschlagen.')
        setLaden(false)
        return
      }

      if (!loginResult.email) {
        setFehler('Kein gültiger Login-Eintrag gefunden.')
        setLaden(false)
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginResult.email,
        password: passwort,
      })

      if (authError) {
        setFehler(authError.message)
        setLaden(false)
        return
      }

      setMeldung('Anmeldung erfolgreich. Weiterleitung läuft ...')
      router.push('/')
      router.refresh()
    } catch (err) {
      setFehler(
        err instanceof Error
          ? err.message
          : 'Unbekannter Fehler bei der Anmeldung.'
      )
    } finally {
      setLaden(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: `
          linear-gradient(180deg, rgba(245,158,11,0.08), rgba(15,20,25,0) 220px),
          linear-gradient(135deg, #0a0d10, #11161b 45%, #0d1116)
        `,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1080,
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid #3a3f46',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          background: '#12181f',
        }}
      >
        <section
          style={{
            position: 'relative',
            padding: '42px 38px',
            background: `
              linear-gradient(180deg, rgba(245,158,11,0.16), rgba(245,158,11,0.03) 28%, rgba(18,24,31,1) 70%),
              linear-gradient(135deg, #1b232c, #141a21)
            `,
            borderRight: '1px solid #313842',
            display: 'grid',
            alignContent: 'space-between',
            gap: 24,
            minHeight: 680,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.1,
              pointerEvents: 'none',
              backgroundImage:
                'repeating-linear-gradient(135deg, #f59e0b 0 18px, #11161b 18px 36px)',
              mixBlendMode: 'screen',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid rgba(245,158,11,0.35)',
                background: 'rgba(245,158,11,0.12)',
                color: '#fbbf24',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: '#f59e0b',
                  boxShadow: '0 0 14px rgba(245,158,11,0.75)',
                }}
              />
              Werkstatt CRM
            </div>

            <div style={{ marginTop: 28 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 48,
                  lineHeight: 1.02,
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: -1,
                }}
              >
                Werkstatt-
                <br />
                Systemzugang
              </h1>

              <p
                style={{
                  marginTop: 18,
                  marginBottom: 0,
                  maxWidth: 520,
                  color: '#d1d5db',
                  fontSize: 18,
                  lineHeight: 1.65,
                }}
              >
                Sicherer Zugang für Serviceannahme, Werkstatt, Lager, Buchhaltung
                und Verwaltung.
              </p>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gap: 14,
            }}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.26)',
                border: '1px solid #39424d',
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div
                style={{
                  color: '#f59e0b',
                  fontWeight: 800,
                  fontSize: 14,
                  textTransform: 'uppercase',
                  letterSpacing: 0.7,
                  marginBottom: 8,
                }}
              >
                Systemhinweis
              </div>
              <div
                style={{
                  color: '#e5e7eb',
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                Anmeldung ausschließlich mit intern zugewiesenem Benutzerkonto.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(0,0,0,0.26)',
                border: '1px solid #39424d',
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div
                style={{
                  color: '#f59e0b',
                  fontWeight: 800,
                  fontSize: 14,
                  textTransform: 'uppercase',
                  letterSpacing: 0.7,
                  marginBottom: 8,
                }}
              >
                Bereiche
              </div>
              <div
                style={{
                  color: '#e5e7eb',
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                Aufträge · Fahrzeuge · Lager · Rechnungen · Zahlungen ·
                Mitarbeiter · Termine
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: '42px 36px',
            background: '#161d25',
            display: 'grid',
            alignContent: 'center',
          }}
        >
          <div
            style={{
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#ffffff',
                fontSize: 34,
                fontWeight: 850,
                letterSpacing: -0.5,
              }}
            >
              Login
            </h2>
            <p
              style={{
                margin: '12px 0 0 0',
                color: '#c7d0d9',
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              Melde dich mit Benutzername und Passwort an.
            </p>
          </div>

          <form onSubmit={anmelden} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <label
                htmlFor="benutzername"
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#f3f4f6',
                  letterSpacing: 0.2,
                }}
              >
                Benutzername
              </label>
              <input
                id="benutzername"
                type="text"
                value={benutzername}
                onChange={(e) => setBenutzername(e.target.value)}
                placeholder="Benutzername eingeben"
                autoComplete="username"
                style={{
                  width: '100%',
                  border: '1px solid #36414d',
                  background: '#0d141b',
                  color: '#f3f4f6',
                  borderRadius: 14,
                  padding: '15px 16px',
                  outline: 'none',
                  fontSize: 16,
                }}
              />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label
                htmlFor="passwort"
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#f3f4f6',
                  letterSpacing: 0.2,
                }}
              >
                Passwort
              </label>
              <input
                id="passwort"
                type="password"
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                placeholder="Passwort eingeben"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  border: '1px solid #36414d',
                  background: '#0d141b',
                  color: '#f3f4f6',
                  borderRadius: 14,
                  padding: '15px 16px',
                  outline: 'none',
                  fontSize: 16,
                }}
              />
            </div>

            {meldung && (
              <div
                style={{
                  background: 'rgba(22,163,74,0.18)',
                  color: '#d1fae5',
                  border: '1px solid rgba(22,163,74,0.45)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {meldung}
              </div>
            )}

            {fehler && (
              <div
                style={{
                  background: 'rgba(220,38,38,0.18)',
                  color: '#fecaca',
                  border: '1px solid rgba(220,38,38,0.45)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {fehler}
              </div>
            )}

            <button
              type="submit"
              disabled={laden}
              style={{
                marginTop: 6,
                border: 0,
                borderRadius: 14,
                padding: '15px 18px',
                background: laden
                  ? '#4b5563'
                  : 'linear-gradient(90deg, #f59e0b, #d97706)',
                color: '#111827',
                fontSize: 18,
                fontWeight: 900,
                cursor: laden ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 24px rgba(245,158,11,0.28)',
              }}
            >
              {laden ? 'Anmeldung läuft ...' : 'Anmelden'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}