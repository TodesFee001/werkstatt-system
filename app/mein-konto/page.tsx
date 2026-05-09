'use client'

import { useCallback, useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/lib/useRealtimeTable'

type Profil = {
  id: string
  benutzername: string | null
  rolle: string | null
  aktiv: boolean | null
  muss_passwort_aendern: boolean | null
  letzte_anmeldung: string | null
  aktualisiert_am: string | null
}

type RpcResult = {
  ok: boolean
  message: string
}

export default function MeinKontoPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Lager', 'Behördenvertreter']}>
      <MeinKontoContent />
    </RoleGuard>
  )
}

function MeinKontoContent() {
  const [profil, setProfil] = useState<Profil | null>(null)
  const [altesPasswort, setAltesPasswort] = useState('')
  const [neuesPasswort, setNeuesPasswort] = useState('')
  const [neuesPasswort2, setNeuesPasswort2] = useState('')
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState('')

  const laden = useCallback(async () => {
    setFehler('')

    const userId = localStorage.getItem('werkstatt_benutzer_id')

    if (!userId) {
      setFehler('Keine aktive Sitzung gefunden.')
      return
    }

    const { data, error } = await supabase
      .from('benutzerprofile')
      .select('id, benutzername, rolle, aktiv, muss_passwort_aendern, letzte_anmeldung, aktualisiert_am')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setFehler(error.message)
      return
    }

    const p = (data as Profil | null) || null
    setProfil(p)

    if (p) {
      localStorage.setItem('werkstatt_benutzername', p.benutzername || '')
      localStorage.setItem('werkstatt_rolle', p.rolle || '')
      localStorage.setItem('werkstatt_aktiv', String(p.aktiv !== false))
      localStorage.setItem('werkstatt_muss_passwort_aendern', String(Boolean(p.muss_passwort_aendern)))
    }

    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('benutzerprofile', laden)

  async function passwortAendern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    const userId = localStorage.getItem('werkstatt_benutzer_id')

    if (!userId) {
      setFehler('Keine aktive Sitzung gefunden.')
      return
    }

    if (neuesPasswort.length < 8) {
      setFehler('Das neue Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }

    if (neuesPasswort !== neuesPasswort2) {
      setFehler('Die neuen Passwörter stimmen nicht überein.')
      return
    }

    const { data, error } = await supabase.rpc('eigenes_passwort_aendern', {
      p_benutzer_id: userId,
      p_altes_passwort: altesPasswort,
      p_neues_passwort: neuesPasswort,
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

    localStorage.setItem('werkstatt_muss_passwort_aendern', 'false')

    setAltesPasswort('')
    setNeuesPasswort('')
    setNeuesPasswort2('')
    setMeldung(result.message)
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Mein Konto</h1>
          <div className="topbar-subtitle">
            Benutzerkonto, Rollenstatus und Passwortverwaltung.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Kontoinformationen</h2>

        {profil ? (
          <div className="list-box">
            <strong>{profil.benutzername || '-'}</strong>
            <br />
            Rolle: {profil.rolle || '-'}
            <br />
            Status: {profil.aktiv === false ? 'Deaktiviert' : 'Aktiv'}
            <br />
            Passwortwechsel erforderlich: {profil.muss_passwort_aendern ? 'Ja' : 'Nein'}
            <br />
            Letzte Anmeldung:{' '}
            {profil.letzte_anmeldung ? new Date(profil.letzte_anmeldung).toLocaleString('de-DE') : '-'}
            <br />
            Zuletzt geändert:{' '}
            {profil.aktualisiert_am ? new Date(profil.aktualisiert_am).toLocaleString('de-DE') : '-'}
          </div>
        ) : (
          <div className="muted">Profil wird geladen...</div>
        )}
      </div>

      <form onSubmit={passwortAendern} className="page-card">
        <h2 style={{ marginTop: 0 }}>Passwort ändern</h2>

        {profil?.muss_passwort_aendern && (
          <div className="error-box" style={{ marginBottom: 12 }}>
            Du musst dein Passwort ändern, bevor du normal weiterarbeitest.
          </div>
        )}

        <div className="form-row">
          <input
            type="password"
            placeholder="Aktuelles Passwort"
            value={altesPasswort}
            onChange={(e) => setAltesPasswort(e.target.value)}
          />
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

        <div className="list-box" style={{ marginTop: 12 }}>
          Passwortregeln:
          <br />
          - mindestens 8 Zeichen
          <br />
          - nicht an andere Personen weitergeben
          <br />
          - bei Verdacht auf Fremdzugriff sofort ändern
        </div>

        <div className="action-row">
          <button type="submit">Passwort ändern</button>
        </div>
      </form>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}