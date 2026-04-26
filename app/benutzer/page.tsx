'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Benutzer = {
  id: string
  benutzername: string | null
  auth_email: string | null
  rolle: string | null
  aktiv: boolean | null
  erstellt_am: string | null
  letzter_login: string | null
}

export default function BenutzerPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <BenutzerPageContent />
    </RoleGuard>
  )
}

function BenutzerPageContent() {
  const [benutzer, setBenutzer] = useState<Benutzer[]>([])
  const [benutzername, setBenutzername] = useState('')
  const [passwort, setPasswort] = useState('')
  const [rolle, setRolle] = useState('Werkstatt')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')
  const [laedt, setLaedt] = useState(false)

  async function ladeBenutzer() {
    const { data, error } = await supabase
      .from('benutzerprofile')
      .select('*')
      .order('erstellt_am', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setBenutzer(data || [])
  }

  useEffect(() => {
    ladeBenutzer()
  }, [])

  async function benutzerAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')
    setLaedt(true)

    try {
      if (!benutzername.trim()) {
        setFehler('Bitte einen Benutzernamen eingeben.')
        setLaedt(false)
        return
      }

      if (passwort.length < 6) {
        setFehler('Das Passwort muss mindestens 6 Zeichen lang sein.')
        setLaedt(false)
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        setFehler(sessionError.message)
        setLaedt(false)
        return
      }

      if (!session?.access_token) {
        setFehler('Keine aktive Session gefunden. Bitte neu einloggen.')
        setLaedt(false)
        return
      }

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          benutzername,
          passwort,
          rolle,
        }),
      })

      const contentType = res.headers.get('content-type') || ''

      if (!contentType.includes('application/json')) {
        const text = await res.text()
        setFehler(
          `API liefert kein JSON zurück. Wahrscheinlich Route/Pfad/Serverfehler. Antwort beginnt mit: ${text.slice(
            0,
            120
          )}`
        )
        setLaedt(false)
        return
      }

      const data = await res.json()

      if (!res.ok) {
        setFehler(data.error || 'Benutzer konnte nicht erstellt werden.')
        setLaedt(false)
        return
      }

      setBenutzername('')
      setPasswort('')
      setRolle('Werkstatt')
      setMeldung(data.message || `Benutzer ${data.benutzername} wurde erstellt.`)
      await ladeBenutzer()
    } catch (error: any) {
      setFehler(error?.message || 'Unbekannter Fehler beim Erstellen des Benutzers.')
    }

    setLaedt(false)
  }

  async function rolleAendern(id: string, neueRolle: string) {
    setFehler('')
    setMeldung('')

    const { error } = await supabase
      .from('benutzerprofile')
      .update({ rolle: neueRolle })
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Rolle aktualisiert.')
    ladeBenutzer()
  }

  async function aktivToggle(id: string, aktiv: boolean) {
    setFehler('')
    setMeldung('')

    const { error } = await supabase
      .from('benutzerprofile')
      .update({ aktiv: !aktiv })
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung(!aktiv ? 'Benutzer aktiviert.' : 'Benutzer deaktiviert.')
    ladeBenutzer()
  }

  return (
    <div className="page-card">
      <h1>Benutzerverwaltung</h1>

      <form onSubmit={benutzerAnlegen} className="list-box">
        <h3>Neuen Benutzer anlegen</h3>

        <div className="form-row">
          <input
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

          <select value={rolle} onChange={(e) => setRolle(e.target.value)}>
            <option>Admin</option>
            <option>Werkstatt</option>
            <option>Serviceannahme</option>
            <option>Buchhaltung</option>
            <option>Lager</option>
            <option>Behördenvertreter</option>
          </select>
        </div>

        <div className="action-row">
          <button type="submit" disabled={laedt}>
            {laedt ? 'Erstelle...' : 'Benutzer erstellen'}
          </button>
        </div>
      </form>

      <h2>Bestehende Benutzer</h2>

      {benutzer.map((b) => (
        <div key={b.id} className="list-box">
          <strong>{b.benutzername || b.id}</strong>
          <br />
          Rolle: {b.rolle}
          <br />
          Aktiv: {b.aktiv ? 'Ja' : 'Nein'}
          <br />
          Letzter Login:{' '}
          {b.letzter_login
            ? new Date(b.letzter_login).toLocaleString('de-DE')
            : '-'}

          <div className="action-row">
            <select
              value={b.rolle || ''}
              onChange={(e) => rolleAendern(b.id, e.target.value)}
            >
              <option>Admin</option>
              <option>Werkstatt</option>
              <option>Serviceannahme</option>
              <option>Buchhaltung</option>
              <option>Lager</option>
              <option>Behördenvertreter</option>
            </select>

            <button type="button" onClick={() => aktivToggle(b.id, !!b.aktiv)}>
              {b.aktiv ? 'Deaktivieren' : 'Aktivieren'}
            </button>
          </div>
        </div>
      ))}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}