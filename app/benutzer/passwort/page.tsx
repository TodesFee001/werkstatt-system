'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import RoleGuard from '../../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/lib/useRealtimeTable'

type Benutzer = {
  id: string
  benutzername: string | null
  rolle: string | null
  aktiv: boolean | null
  muss_passwort_aendern: boolean | null
  letzte_anmeldung: string | null
}

type RpcResult = {
  ok: boolean
  message: string
}

export default function BenutzerPasswortPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <BenutzerPasswortContent />
    </RoleGuard>
  )
}

function BenutzerPasswortContent() {
  const [benutzer, setBenutzer] = useState<Benutzer[]>([])
  const [suche, setSuche] = useState('')
  const [auswahl, setAuswahl] = useState<Benutzer | null>(null)
  const [neuesPasswort, setNeuesPasswort] = useState('')
  const [neuesPasswort2, setNeuesPasswort2] = useState('')
  const [wechselErzwingen, setWechselErzwingen] = useState(true)
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState('')

  const laden = useCallback(async () => {
    const { data, error } = await supabase
      .from('benutzerprofile')
      .select('id, benutzername, rolle, aktiv, muss_passwort_aendern, letzte_anmeldung')
      .order('benutzername')

    if (error) {
      setFehler(error.message)
      return
    }

    setBenutzer((data || []) as Benutzer[])
    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('benutzerprofile', laden)

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return benutzer.filter((b) => {
      if (!q) return true

      return [b.benutzername, b.rolle]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [benutzer, suche])

  async function resetPasswort(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!auswahl) {
      setFehler('Bitte einen Benutzer auswählen.')
      return
    }

    if (neuesPasswort.length < 8) {
      setFehler('Das neue Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }

    if (neuesPasswort !== neuesPasswort2) {
      setFehler('Die Passwörter stimmen nicht überein.')
      return
    }

    const { data, error } = await supabase.rpc('admin_passwort_zuruecksetzen', {
      p_benutzer_id: auswahl.id,
      p_neues_passwort: neuesPasswort,
      p_wechsel_erzwingen: wechselErzwingen,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    const result = data as RpcResult

    if (!result.ok) {
      setFehler(result.message)
      return
    }

    setNeuesPasswort('')
    setNeuesPasswort2('')
    setMeldung(result.message)
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Passwortverwaltung</h1>
          <div className="topbar-subtitle">
            Admin-Funktion zum Zurücksetzen von Benutzerpasswörtern.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Benutzer auswählen</h2>

        <input
          placeholder="Benutzer suchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          {gefiltert.map((b) => (
            <div
              key={b.id}
              className="list-box"
              style={{
                border: auswahl?.id === b.id ? '2px solid #f59e0b' : undefined,
              }}
            >
              <strong>{b.benutzername || '-'}</strong>
              <br />
              Rolle: {b.rolle || '-'}
              <br />
              Status: {b.aktiv === false ? 'Deaktiviert' : 'Aktiv'}
              <br />
              Passwortwechsel erforderlich: {b.muss_passwort_aendern ? 'Ja' : 'Nein'}
              <br />
              Letzte Anmeldung:{' '}
              {b.letzte_anmeldung ? new Date(b.letzte_anmeldung).toLocaleString('de-DE') : '-'}

              <div className="action-row">
                <button type="button" onClick={() => setAuswahl(b)}>
                  Auswählen
                </button>
              </div>
            </div>
          ))}

          {gefiltert.length === 0 && <div className="muted">Keine Benutzer gefunden.</div>}
        </div>
      </div>

      <form onSubmit={resetPasswort} className="page-card">
        <h2 style={{ marginTop: 0 }}>Passwort zurücksetzen</h2>

        <div className="list-box">
          Ausgewählter Benutzer: <strong>{auswahl?.benutzername || '-'}</strong>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            type="password"
            placeholder="Neues Passwort"
            value={neuesPasswort}
            onChange={(e) => setNeuesPasswort(e.target.value)}
          />
          <input
            type="password"
            placeholder="Neues Passwort wiederholen"
            value={neuesPasswort2}
            onChange={(e) => setNeuesPasswort2(e.target.value)}
          />
        </div>

        <label className="list-box" style={{ marginTop: 12, display: 'block' }}>
          <input
            type="checkbox"
            checked={wechselErzwingen}
            onChange={(e) => setWechselErzwingen(e.target.checked)}
          />{' '}
          Benutzer muss Passwort beim nächsten Login ändern
        </label>

        <div className="action-row">
          <button type="submit">Passwort zurücksetzen</button>
        </div>
      </form>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}