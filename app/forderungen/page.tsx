'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  rechnungsdatum: string | null
  faellig_am: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  status: string | null
  mahnstufe: number | null
  letzte_mahnung_am: string | null
  forderungsstatus: string | null
  inkasso_am: string | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

export default function ForderungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <ForderungenPageContent />
    </RoleGuard>
  )
}

function ForderungenPageContent() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [statusFilter, setStatusFilter] = useState('alle')
  const [suche, setSuche] = useState('')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const [rRes, kRes] = await Promise.all([
      supabase.from('rechnungen').select('*').order('created_at', { ascending: false }),
      supabase.from('kunden').select('*'),
    ])

    if (rRes.error || kRes.error) {
      setFehler(rRes.error?.message || kRes.error?.message || '')
      return
    }

    setRechnungen(rRes.data || [])
    setKunden(kRes.data || [])
  }

  useEffect(() => {
    laden()
  }, [])

  function kundeName(id: string | null) {
    if (!id) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return 'Unbekannter Kunde'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  async function alsInkassoMarkieren(rechnung: Rechnung) {
    setFehler('')
    setMeldung('')

    const { error } = await supabase
      .from('rechnungen')
      .update({
        forderungsstatus: 'inkasso',
        inkasso_am: new Date().toISOString(),
      })
      .eq('id', rechnung.id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung(`Rechnung ${rechnung.rechnungsnummer || rechnung.id} auf Inkasso gesetzt.`)
    laden()
  }

  async function alsStorniertMarkieren(rechnung: Rechnung) {
    setFehler('')
    setMeldung('')

    const { error } = await supabase
      .from('rechnungen')
      .update({
        status: 'storniert',
        forderungsstatus: 'storniert',
      })
      .eq('id', rechnung.id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung(`Rechnung ${rechnung.rechnungsnummer || rechnung.id} wurde storniert.`)
    laden()
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return rechnungen.filter((r) => {
      if (Number(r.offener_betrag || 0) <= 0) return false

      const statusOk =
        statusFilter === 'alle' || (r.forderungsstatus || 'offen') === statusFilter

      if (!statusOk) return false

      if (!q) return true

      return [
        r.rechnungsnummer,
        r.status,
        r.forderungsstatus,
        kundeName(r.kunde_id),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [rechnungen, statusFilter, suche, kunden])

  const offeneSumme = gefiltert.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0)

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Offene Forderungen</h1>
          <div className="topbar-subtitle">
            Interne Übersicht über offene Rechnungen, Mahnstufen und Forderungsstatus.
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">
          Offene Forderungen
          <strong>{gefiltert.length}</strong>
        </div>
        <div className="kpi-pill">
          Offene Summe
          <strong>{offeneSumme.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="page-card">
        <div className="form-row">
          <input
            placeholder="Forderungen suchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="alle">Alle Forderungsstatus</option>
            <option value="offen">offen</option>
            <option value="zahlungserinnerung">zahlungserinnerung</option>
            <option value="mahnung_1">mahnung_1</option>
            <option value="mahnung_2">mahnung_2</option>
            <option value="mahnung_3">mahnung_3</option>
            <option value="inkasso">inkasso</option>
            <option value="storniert">storniert</option>
          </select>
        </div>
      </div>

      {gefiltert.map((rechnung) => (
        <div key={rechnung.id} className="list-box">
          <strong>{rechnung.rechnungsnummer || rechnung.id}</strong>
          <br />
          Kunde: {kundeName(rechnung.kunde_id)}
          <br />
          Rechnungsdatum: {rechnung.rechnungsdatum || '-'}
          <br />
          Fällig am: {rechnung.faellig_am || '-'}
          <br />
          Status: <StatusBadge status={rechnung.status} />
          <br />
          Forderungsstatus: <StatusBadge status={rechnung.forderungsstatus || 'offen'} />
          <br />
          Mahnstufe: {rechnung.mahnstufe || 0}
          <br />
          Letzte Mahnung:{' '}
          {rechnung.letzte_mahnung_am
            ? new Date(rechnung.letzte_mahnung_am).toLocaleString('de-DE')
            : '-'}
          <br />
          Inkasso am:{' '}
          {rechnung.inkasso_am
            ? new Date(rechnung.inkasso_am).toLocaleString('de-DE')
            : '-'}
          <br />
          Offener Betrag: {Number(rechnung.offener_betrag || 0).toFixed(2)} €

          <div className="action-row">
            <a
              href={`/mahnungen?rechnung=${rechnung.id}`}
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                background: '#2563eb',
                color: 'white',
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              Mahnungen öffnen
            </a>

            <button type="button" onClick={() => alsInkassoMarkieren(rechnung)}>
              Als Inkasso markieren
            </button>

            <button
              type="button"
              onClick={() => alsStorniertMarkieren(rechnung)}
              style={{ background: '#dc2626' }}
            >
              Stornieren
            </button>
          </div>
        </div>
      ))}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}