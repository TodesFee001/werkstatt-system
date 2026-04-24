'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

const SEITEN = [
  { pfad: '/', name: 'Dashboard' },
  { pfad: '/kunden', name: 'Kunden' },
  { pfad: '/fahrzeuge', name: 'Fahrzeuge' },
  { pfad: '/serviceauftraege', name: 'Serviceaufträge' },
  { pfad: '/termine', name: 'Termine' },
  { pfad: '/kalender', name: 'Kalender / Planung' },
  { pfad: '/lager', name: 'Lager' },
  { pfad: '/rechnungen', name: 'Rechnungen' },
  { pfad: '/zahlungen', name: 'Zahlungen' },
  { pfad: '/forderungen', name: 'Forderungen' },
  { pfad: '/mahnungen', name: 'Mahnungen' },
  { pfad: '/dokumente', name: 'Dokumente' },
]

type Modus = {
  id: string
  aktiv: boolean
  seiten: string[] | null
}

export default function EinstellungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <EinstellungenPageContent />
    </RoleGuard>
  )
}

function EinstellungenPageContent() {
  const [lockdown, setLockdown] = useState<Modus | null>(null)
  const [wartung, setWartung] = useState<Modus | null>(null)
  const [popupOffen, setPopupOffen] = useState(false)
  const [wartungsSeiten, setWartungsSeiten] = useState<string[]>([])
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('system_modus')
      .select('*')
      .in('id', ['lockdown', 'wartung'])

    if (error) {
      setFehler(error.message)
      return
    }

    const rows = (data || []) as Modus[]
    const lockdownRow = rows.find((r) => r.id === 'lockdown') || null
    const wartungRow = rows.find((r) => r.id === 'wartung') || null

    setLockdown(lockdownRow)
    setWartung(wartungRow)
    setWartungsSeiten(wartungRow?.seiten || [])
  }

  useEffect(() => {
    laden()
  }, [])

  async function lockdownToggle() {
    setFehler('')
    setMeldung('')

    const neu = !lockdown?.aktiv

    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes.data.session?.user?.id || null

    const { error } = await supabase
      .from('system_modus')
      .update({
        aktiv: neu,
        aktualisiert_am: new Date().toISOString(),
        aktualisiert_von: userId,
      })
      .eq('id', 'lockdown')

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung(neu ? 'Lockdown wurde aktiviert.' : 'Lockdown wurde deaktiviert.')
    laden()
  }

  function toggleSeite(pfad: string) {
    setWartungsSeiten((prev) => {
      if (prev.includes(pfad)) {
        return prev.filter((p) => p !== pfad)
      }
      return [...prev, pfad]
    })
  }

  async function wartungSpeichern(aktiv: boolean) {
    setFehler('')
    setMeldung('')

    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes.data.session?.user?.id || null

    const { error } = await supabase
      .from('system_modus')
      .update({
        aktiv,
        seiten: wartungsSeiten,
        aktualisiert_am: new Date().toISOString(),
        aktualisiert_von: userId,
      })
      .eq('id', 'wartung')

    if (error) {
      setFehler(error.message)
      return
    }

    setPopupOffen(false)
    setMeldung(aktiv ? 'Wartungsmodus wurde gespeichert.' : 'Wartungsmodus wurde entfernt.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Einstellungen</h1>
          <div className="topbar-subtitle">
            Systemsteuerung für Lockdown, Wartung und Administrationsfunktionen.
          </div>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Lockdown-Modus</h2>
        <p>
          Sperrt das komplette System für alle Rollen außer Admin.
        </p>

        <div
          className="list-box"
          style={{
            border: lockdown?.aktiv ? '2px solid #dc2626' : '1px solid #36414d',
            background: lockdown?.aktiv ? 'rgba(220,38,38,0.18)' : undefined,
          }}
        >
          Status: <strong>{lockdown?.aktiv ? 'AKTIV' : 'INAKTIV'}</strong>
        </div>

        <div className="action-row">
          <button
            type="button"
            onClick={lockdownToggle}
            style={{
              background: lockdown?.aktiv ? '#16a34a' : '#dc2626',
            }}
          >
            {lockdown?.aktiv ? 'Lockdown deaktivieren' : 'Lockdown aktivieren'}
          </button>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Wartungsmodus</h2>
        <p>
          Einzelne Seiten können gezielt in Wartung gesetzt werden.
        </p>

        <div className="list-box">
          Status: <strong>{wartung?.aktiv ? 'AKTIV' : 'INAKTIV'}</strong>
          <br />
          Seiten: {(wartung?.seiten || []).length > 0 ? (wartung?.seiten || []).join(', ') : '-'}
        </div>

        <div className="action-row">
          <button type="button" onClick={() => setPopupOffen(true)}>
            Wartungsmodus verwalten
          </button>
        </div>
      </div>

      {popupOffen && (
        <div className="modal-backdrop">
          <div className="maintenance-modal">
            <h2 style={{ marginTop: 0 }}>Wartungsmodus verwalten</h2>
            <p>Wähle die Seiten aus, die gesperrt werden sollen.</p>

            <div style={{ display: 'grid', gap: 10 }}>
              {SEITEN.map((s) => (
                <label key={s.pfad} className="maintenance-option">
                  <input
                    type="checkbox"
                    checked={wartungsSeiten.includes(s.pfad)}
                    onChange={() => toggleSeite(s.pfad)}
                  />
                  <span>{s.name}</span>
                  <small>{s.pfad}</small>
                </label>
              ))}
            </div>

            <div className="action-row">
              <button type="button" onClick={() => wartungSpeichern(true)}>
                Wartung aktivieren / speichern
              </button>
              <button type="button" onClick={() => wartungSpeichern(false)} style={{ background: '#16a34a' }}>
                Wartung entfernen
              </button>
              <button type="button" onClick={() => setPopupOffen(false)} style={{ background: '#6b7280' }}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}