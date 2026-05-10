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
  nur_eine_sitzung: boolean | null
}

type Sitzung = {
  id: string
  benutzer_id: string
  aktiv: boolean
  erstellt_am: string
  zuletzt_gesehen: string
  beendet_am: string | null
  beendet_grund: string | null
}

export default function BenutzerSitzungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <BenutzerSitzungenContent />
    </RoleGuard>
  )
}

function BenutzerSitzungenContent() {
  const [benutzer, setBenutzer] = useState<Benutzer[]>([])
  const [sitzungen, setSitzungen] = useState<Sitzung[]>([])
  const [suche, setSuche] = useState('')
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')

  const laden = useCallback(async () => {
    const [bRes, sRes] = await Promise.all([
      supabase
        .from('benutzerprofile')
        .select('id, benutzername, rolle, aktiv, nur_eine_sitzung')
        .order('benutzername'),
      supabase
        .from('benutzer_sitzungen')
        .select('*')
        .order('erstellt_am', { ascending: false }),
    ])

    if (bRes.error || sRes.error) {
      setFehler(bRes.error?.message || sRes.error?.message || '')
      return
    }

    setBenutzer((bRes.data || []) as Benutzer[])
    setSitzungen((sRes.data || []) as Sitzung[])
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('benutzerprofile', laden)
  useRealtimeTable('benutzer_sitzungen', laden)

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return benutzer.filter((b) => {
      if (!q) return true

      return [b.benutzername, b.rolle]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [benutzer, suche])

  function aktiveSitzungen(benutzerId: string) {
    return sitzungen.filter((s) => s.benutzer_id === benutzerId && s.aktiv)
  }

  async function toggleEinzelSitzung(b: Benutzer) {
    setFehler('')
    setMeldung('')

    const neuerWert = !b.nur_eine_sitzung

    const { error } = await supabase
      .from('benutzerprofile')
      .update({
        nur_eine_sitzung: neuerWert,
        aktualisiert_am: new Date().toISOString(),
      })
      .eq('id', b.id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (neuerWert) {
      const aktive = aktiveSitzungen(b.id)
      const neueste = aktive[0]

      const alteIds = aktive
        .filter((s) => s.id !== neueste?.id)
        .map((s) => s.id)

      if (alteIds.length > 0) {
        await supabase
          .from('benutzer_sitzungen')
          .update({
            aktiv: false,
            beendet_am: new Date().toISOString(),
            beendet_grund: 'Einzelsitzung durch Admin aktiviert',
          })
          .in('id', alteIds)
      }
    }

    setMeldung(
      neuerWert
        ? 'Einzelsitzung wurde für diesen Benutzer aktiviert.'
        : 'Mehrfach-Login wurde für diesen Benutzer erlaubt.'
    )

    laden()
  }

  async function alleSitzungenBeenden(b: Benutzer) {
    const ok = window.confirm(`Alle aktiven Sitzungen von ${b.benutzername || 'Benutzer'} beenden?`)
    if (!ok) return

    const { error } = await supabase
      .from('benutzer_sitzungen')
      .update({
        aktiv: false,
        beendet_am: new Date().toISOString(),
        beendet_grund: 'Durch Admin beendet',
      })
      .eq('benutzer_id', b.id)
      .eq('aktiv', true)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Aktive Sitzungen wurden beendet.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Sitzungsverwaltung</h1>
          <div className="topbar-subtitle">
            Admin-Steuerung für Mehrfach-Login und aktive Sitzungen pro Benutzer.
          </div>
        </div>
      </div>

      <div className="page-card">
        <input
          placeholder="Benutzer suchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          {gefiltert.map((b) => {
            const aktive = aktiveSitzungen(b.id)

            return (
              <div key={b.id} className="list-box">
                <strong>{b.benutzername || '-'}</strong>
                <br />
                Rolle: {b.rolle || '-'}
                <br />
                Status: {b.aktiv === false ? 'Deaktiviert' : 'Aktiv'}
                <br />
                Nur eine aktive Sitzung erlaubt:{' '}
                <strong>{b.nur_eine_sitzung ? 'Ja' : 'Nein'}</strong>
                <br />
                Aktive Sitzungen: <strong>{aktive.length}</strong>

                {aktive.map((s) => (
                  <div key={s.id} className="list-box" style={{ marginTop: 10 }}>
                    Erstellt: {new Date(s.erstellt_am).toLocaleString('de-DE')}
                    <br />
                    Zuletzt gesehen: {new Date(s.zuletzt_gesehen).toLocaleString('de-DE')}
                  </div>
                ))}

                <div className="action-row">
                  <button type="button" onClick={() => toggleEinzelSitzung(b)}>
                    {b.nur_eine_sitzung ? 'Mehrfach-Login erlauben' : 'Nur eine Sitzung erlauben'}
                  </button>

                  <button type="button" onClick={() => alleSitzungenBeenden(b)} style={{ background: '#dc2626' }}>
                    Alle Sitzungen beenden
                  </button>
                </div>
              </div>
            )
          })}

          {gefiltert.length === 0 && <div className="muted">Keine Benutzer gefunden.</div>}
        </div>
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}