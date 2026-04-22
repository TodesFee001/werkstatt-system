'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  rechnungsdatum: string | null
  status: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  interne_notiz: string | null
  versendet_am: string | null
  mahnstufe: number | null
  faellig_am: string | null
  letzte_mahnung_am: string | null
  forderungsstatus: string | null
  inkasso_am: string | null
}

function RechnungenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [suche, setSuche] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function ladeAlles() {
    const [kundenRes, rechnungenRes] = await Promise.all([
      supabase.from('kunden').select('*'),
      supabase.from('rechnungen').select('*').order('created_at', { ascending: false }),
    ])

    const error = kundenRes.error || rechnungenRes.error
    if (error) {
      setFehler(error.message)
      return
    }

    setKunden(kundenRes.data || [])
    setRechnungen(rechnungenRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  function kundeName(id: string | null) {
    if (!id) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return 'Unbekannter Kunde'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  async function alsBezahltMarkieren(rechnung: Rechnung) {
    const { error } = await supabase
      .from('rechnungen')
      .update({
        status: 'bezahlt',
        offener_betrag: 0,
        forderungsstatus: 'bezahlt',
      })
      .eq('id', rechnung.id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung(`${rechnung.rechnungsnummer || rechnung.id} wurde als bezahlt markiert.`)
    ladeAlles()
  }

  async function alsUeberfaelligMarkieren(rechnung: Rechnung) {
    const { error } = await supabase
      .from('rechnungen')
      .update({
        status: 'ueberfaellig',
        forderungsstatus: 'offen',
      })
      .eq('id', rechnung.id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung(`${rechnung.rechnungsnummer || rechnung.id} wurde als überfällig markiert.`)
    ladeAlles()
  }

  async function mahnungErzeugen(rechnung: Rechnung) {
    const neueStufe = Number(rechnung.mahnstufe || 0) + 1
    const betreff = `Mahnung Stufe ${neueStufe} zu Rechnung ${rechnung.rechnungsnummer || rechnung.id}`
    const text = `Offener Betrag: ${Number(rechnung.offener_betrag || 0).toFixed(2)} €. Zahlung intern nachverfolgen.`

    const { error: mahnungError } = await supabase.from('mahnungen').insert({
      rechnung_id: rechnung.id,
      mahnstufe: neueStufe,
      betreff,
      text,
      status: 'erstellt',
    })

    if (mahnungError) {
      setFehler(mahnungError.message)
      return
    }

    let neuerForderungsstatus = 'zahlungserinnerung'
    if (neueStufe === 1) neuerForderungsstatus = 'mahnung_1'
    if (neueStufe === 2) neuerForderungsstatus = 'mahnung_2'
    if (neueStufe >= 3) neuerForderungsstatus = 'mahnung_3'

    const { error: rechnungError } = await supabase
      .from('rechnungen')
      .update({
        mahnstufe: neueStufe,
        letzte_mahnung_am: new Date().toISOString(),
        status: 'ueberfaellig',
        forderungsstatus: neuerForderungsstatus,
      })
      .eq('id', rechnung.id)

    if (rechnungError) {
      setFehler(rechnungError.message)
      return
    }

    setMeldung(`Mahnung Stufe ${neueStufe} für ${rechnung.rechnungsnummer || rechnung.id} erstellt.`)
    ladeAlles()
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return rechnungen.filter((r) => {
      const statusOk = statusFilter === 'alle' || (r.status || '') === statusFilter
      if (!statusOk) return false

      if (!q) return true

      return [r.rechnungsnummer, r.status, r.id, kundeName(r.kunde_id), r.forderungsstatus]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [rechnungen, suche, statusFilter, kunden])

  const gesamtumsatz = gefiltert.reduce((sum, r) => sum + Number(r.brutto_summe || 0), 0)
  const gesamtOffen = gefiltert.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0)

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Rechnungen</h1>
          <div className="topbar-subtitle">
            Überblick über Rechnungsstatus, Mahnstufen und offene Beträge.
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">
          Rechnungen
          <strong>{gefiltert.length}</strong>
        </div>
        <div className="kpi-pill">
          Bruttovolumen
          <strong>{gesamtumsatz.toFixed(2)} €</strong>
        </div>
        <div className="kpi-pill">
          Offen gesamt
          <strong>{gesamtOffen.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="page-card">
        <div className="form-row">
          <input
            placeholder="Rechnungen suchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="alle">Alle Status</option>
            <option value="entwurf">entwurf</option>
            <option value="offen">offen</option>
            <option value="teilbezahlt">teilbezahlt</option>
            <option value="bezahlt">bezahlt</option>
            <option value="ueberfaellig">ueberfaellig</option>
            <option value="storniert">storniert</option>
          </select>
        </div>
      </div>

      <div>
        {gefiltert.map((rechnung) => (
          <div key={rechnung.id} className="list-box">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong>{rechnung.rechnungsnummer || rechnung.id}</strong>
                <br />
                Kunde: {kundeName(rechnung.kunde_id)}
                <br />
                Rechnungsdatum: {rechnung.rechnungsdatum || '-'}
                <br />
                Fällig am: {rechnung.faellig_am || '-'}
                <br />
                Brutto: {Number(rechnung.brutto_summe || 0).toFixed(2)} €
                <br />
                Offen: {Number(rechnung.offener_betrag || 0).toFixed(2)} €
                <br />
                Mahnstufe: {rechnung.mahnstufe || 0}
                <br />
                Forderungsstatus: {rechnung.forderungsstatus || 'offen'}
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
                Interne Notiz: {rechnung.interne_notiz || '-'}
              </div>

              <div>
                <StatusBadge status={rechnung.status} />
              </div>
            </div>

            <div className="action-row">
              <button type="button" onClick={() => alsBezahltMarkieren(rechnung)}>
                Als bezahlt markieren
              </button>

              <button type="button" onClick={() => alsUeberfaelligMarkieren(rechnung)}>
                Als überfällig markieren
              </button>

              <button type="button" onClick={() => mahnungErzeugen(rechnung)}>
                Mahnung erzeugen
              </button>

              <a
                href={`/mahnungen?rechnung=${rechnung.id}`}
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#7c3aed',
                  color: 'white',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Mahnverlauf
              </a>

              <a
                href={`/rechnungen/${rechnung.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                PDF / Druckansicht
              </a>
            </div>
          </div>
        ))}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}

export default function RechnungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <RechnungenPageContent />
    </RoleGuard>
  )
}