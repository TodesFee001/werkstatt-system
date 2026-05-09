'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/lib/useRealtimeTable'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Fahrzeug = {
  id: string
  kunde_id: string | null
  kennzeichen: string | null
  marke: string | null
  modell: string | null
}

type Mitarbeiter = {
  id: string
  vorname: string | null
  nachname: string | null
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  fahrzeug_id: string | null
  mitarbeiter_id: string | null
  art: string | null
  status: string | null
  fehlerbeschreibung: string | null
  interne_notiz: string | null
  created_at: string | null
}

const AUFTRAGSARTEN = [
  'Inspektion',
  'Reparatur',
  'Diagnose',
  'Wartung',
  'Ölwechsel',
  'Bremsen',
  'Reifen',
  'Karosserie',
  'Elektrik',
  'Tuning',
  'Gutachten',
  'Sonstiges',
]

const STATUS = [
  'offen',
  'angenommen',
  'in_arbeit',
  'wartet',
  'wartet_auf_freigabe',
  'fertig',
  'abgeschlossen',
  'archiviert',
]

export default function ServiceauftraegePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Behördenvertreter']}>
      <ServiceauftraegeContent />
    </RoleGuard>
  )
}

function ServiceauftraegeContent() {
  const [auftraege, setAuftraege] = useState<Serviceauftrag[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])

  const [suche, setSuche] = useState('')
  const [kundeSuche, setKundeSuche] = useState('')
  const [fahrzeugSuche, setFahrzeugSuche] = useState('')
  const [mitarbeiterSuche, setMitarbeiterSuche] = useState('')

  const [kundeId, setKundeId] = useState('')
  const [fahrzeugId, setFahrzeugId] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [art, setArt] = useState('Reparatur')
  const [status, setStatus] = useState('offen')
  const [fehlerbeschreibung, setFehlerbeschreibung] = useState('')
  const [interneNotiz, setInterneNotiz] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState('')

  const laden = useCallback(async () => {
    const [aRes, kRes, fRes, mRes] = await Promise.all([
      supabase.from('serviceauftraege').select('*').order('created_at', { ascending: false }),
      supabase.from('kunden').select('*').order('firmenname'),
      supabase.from('fahrzeuge').select('*').order('kennzeichen'),
      supabase.from('mitarbeiter').select('*').order('vorname'),
    ])

    if (aRes.error || kRes.error || fRes.error || mRes.error) {
      setFehler(aRes.error?.message || kRes.error?.message || fRes.error?.message || mRes.error?.message || '')
      return
    }

    setAuftraege((aRes.data || []) as Serviceauftrag[])
    setKunden((kRes.data || []) as Kunde[])
    setFahrzeuge((fRes.data || []) as Fahrzeug[])
    setMitarbeiter((mRes.data || []) as Mitarbeiter[])
    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('serviceauftraege', laden)
  useRealtimeTable('serviceauftrag_material', laden)
  useRealtimeTable('serviceauftrag_arbeitszeiten', laden)
  useRealtimeTable('serviceauftrag_timeline', laden)

  function kundenName(id: string | null) {
    const k = kunden.find((x) => x.id === id)
    return k ? k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim() : '-'
  }

  function fahrzeugName(id: string | null) {
    const f = fahrzeuge.find((x) => x.id === id)
    return f ? `${f.kennzeichen || '-'} – ${f.marke || '-'} ${f.modell || '-'}` : '-'
  }

  function mitarbeiterName(id: string | null) {
    const m = mitarbeiter.find((x) => x.id === id)
    return m ? `${m.vorname || ''} ${m.nachname || ''}`.trim() : '-'
  }

  const kundenGefiltert = useMemo(() => {
    const q = kundeSuche.trim().toLowerCase()
    return kunden.filter((k) => {
      if (!q) return true
      return [k.firmenname, k.vorname, k.nachname]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [kunden, kundeSuche])

  const fahrzeugeGefiltert = useMemo(() => {
    const q = fahrzeugSuche.trim().toLowerCase()

    return fahrzeuge.filter((f) => {
      if (kundeId && f.kunde_id !== kundeId) return false
      if (!q) return true

      return [f.kennzeichen, f.marke, f.modell]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [fahrzeuge, fahrzeugSuche, kundeId])

  const mitarbeiterGefiltert = useMemo(() => {
    const q = mitarbeiterSuche.trim().toLowerCase()
    return mitarbeiter.filter((m) => {
      if (!q) return true
      return [m.vorname, m.nachname]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [mitarbeiter, mitarbeiterSuche])

  const auftraegeGefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return auftraege.filter((a) => {
      if (!q) return true

      return [
        a.art,
        a.status,
        a.fehlerbeschreibung,
        a.interne_notiz,
        kundenName(a.kunde_id),
        fahrzeugName(a.fahrzeug_id),
        mitarbeiterName(a.mitarbeiter_id),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [auftraege, suche, kunden, fahrzeuge, mitarbeiter])

  function resetForm() {
    setBearbeitenId(null)
    setKundeId('')
    setFahrzeugId('')
    setMitarbeiterId('')
    setKundeSuche('')
    setFahrzeugSuche('')
    setMitarbeiterSuche('')
    setArt('Reparatur')
    setStatus('offen')
    setFehlerbeschreibung('')
    setInterneNotiz('')
  }

  function bearbeitenStarten(a: Serviceauftrag) {
    setBearbeitenId(a.id)
    setKundeId(a.kunde_id || '')
    setFahrzeugId(a.fahrzeug_id || '')
    setMitarbeiterId(a.mitarbeiter_id || '')
    setKundeSuche(kundenName(a.kunde_id))
    setFahrzeugSuche(fahrzeugName(a.fahrzeug_id))
    setMitarbeiterSuche(mitarbeiterName(a.mitarbeiter_id))
    setArt(a.art || 'Reparatur')
    setStatus(a.status || 'offen')
    setFehlerbeschreibung(a.fehlerbeschreibung || '')
    setInterneNotiz(a.interne_notiz || '')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!kundeId) {
      setFehler('Bitte einen Kunden auswählen.')
      return
    }

    if (!fahrzeugId) {
      setFehler('Bitte ein Fahrzeug auswählen.')
      return
    }

    const payload = {
      kunde_id: kundeId,
      fahrzeug_id: fahrzeugId,
      mitarbeiter_id: mitarbeiterId || null,
      art,
      status,
      fehlerbeschreibung: fehlerbeschreibung || null,
      interne_notiz: interneNotiz || null,
    }

    const res = bearbeitenId
      ? await supabase.from('serviceauftraege').update(payload).eq('id', bearbeitenId)
      : await supabase.from('serviceauftraege').insert(payload)

    if (res.error) {
      setFehler(res.error.message)
      return
    }

    setMeldung(bearbeitenId ? 'Serviceauftrag wurde gespeichert.' : 'Serviceauftrag wurde erstellt.')
    resetForm()
    laden()
  }

  async function loeschen(id: string) {
    const ok = window.confirm('Serviceauftrag wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('serviceauftraege').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Serviceauftrag wurde gelöscht.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Serviceaufträge</h1>
          <div className="topbar-subtitle">
            Live-Übersicht aller Werkstattaufträge.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>
      </div>

      <form onSubmit={speichern} className="page-card">
        <h2 style={{ marginTop: 0 }}>{bearbeitenId ? 'Serviceauftrag bearbeiten' : 'Serviceauftrag erstellen'}</h2>

        <div className="form-row">
          <input
            placeholder="Kunde suchen und auswählen"
            value={kundeSuche}
            onChange={(e) => {
              setKundeSuche(e.target.value)
              setKundeId('')
              setFahrzeugId('')
              setFahrzeugSuche('')
            }}
          />

          <input
            placeholder="Fahrzeug suchen und auswählen"
            value={fahrzeugSuche}
            onChange={(e) => {
              setFahrzeugSuche(e.target.value)
              setFahrzeugId('')
            }}
          />
        </div>

        {kundeSuche && !kundeId && (
          <div className="list-box" style={{ marginTop: 12 }}>
            {kundenGefiltert.slice(0, 8).map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setKundeId(k.id)
                  setKundeSuche(kundenName(k.id))
                }}
                style={{ margin: 4, background: '#374151' }}
              >
                {kundenName(k.id)}
              </button>
            ))}
          </div>
        )}

        {fahrzeugSuche && !fahrzeugId && (
          <div className="list-box" style={{ marginTop: 12 }}>
            {fahrzeugeGefiltert.slice(0, 8).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFahrzeugId(f.id)
                  setFahrzeugSuche(fahrzeugName(f.id))
                }}
                style={{ margin: 4, background: '#374151' }}
              >
                {fahrzeugName(f.id)}
              </button>
            ))}
          </div>
        )}

        <div className="form-row" style={{ marginTop: 12 }}>
          <select value={art} onChange={(e) => setArt(e.target.value)}>
            {AUFTRAGSARTEN.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            placeholder="Mitarbeiter suchen und auswählen"
            value={mitarbeiterSuche}
            onChange={(e) => {
              setMitarbeiterSuche(e.target.value)
              setMitarbeiterId('')
            }}
          />
        </div>

        {mitarbeiterSuche && !mitarbeiterId && (
          <div className="list-box" style={{ marginTop: 12 }}>
            {mitarbeiterGefiltert.slice(0, 8).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMitarbeiterId(m.id)
                  setMitarbeiterSuche(mitarbeiterName(m.id))
                }}
                style={{ margin: 4, background: '#374151' }}
              >
                {mitarbeiterName(m.id)}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Fehlerbeschreibung / Kundenauftrag"
            value={fehlerbeschreibung}
            onChange={(e) => setFehlerbeschreibung(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Interne Notiz"
            value={interneNotiz}
            onChange={(e) => setInterneNotiz(e.target.value)}
          />
        </div>

        <div className="action-row">
          <button type="submit">{bearbeitenId ? 'Speichern' : 'Serviceauftrag erstellen'}</button>
          {bearbeitenId && (
            <button type="button" onClick={resetForm} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="page-card">
        <input
          placeholder="Serviceaufträge durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          {auftraegeGefiltert.map((a) => (
            <div key={a.id} className="list-box">
              <strong>{a.art || '-'}</strong>
              <br />
              Status: <StatusBadge status={a.status || 'offen'} />
              <br />
              Kunde: {kundenName(a.kunde_id)}
              <br />
              Fahrzeug: {fahrzeugName(a.fahrzeug_id)}
              <br />
              Mitarbeiter: {mitarbeiterName(a.mitarbeiter_id)}
              <br />
              Beschreibung: {a.fehlerbeschreibung || '-'}

              <div className="action-row">
                <Link
                  href={`/serviceauftraege/${a.id}`}
                  style={{
                    padding: '10px 16px',
                    background: '#2563eb',
                    color: 'white',
                    borderRadius: 12,
                    textDecoration: 'none',
                  }}
                >
                  Öffnen
                </Link>

                <button type="button" onClick={() => bearbeitenStarten(a)}>
                  Bearbeiten
                </button>

                <button type="button" onClick={() => loeschen(a.id)} style={{ background: '#dc2626' }}>
                  Löschen
                </button>
              </div>
            </div>
          ))}

          {auftraegeGefiltert.length === 0 && <div className="muted">Keine Serviceaufträge vorhanden.</div>}
        </div>
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}