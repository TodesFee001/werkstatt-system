'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

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
  faellig_am: string | null
  status: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  interne_notiz: string | null
  mahnstufe: number | null
  forderungsstatus: string | null
}

export default function RechnungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Serviceannahme']}>
      <RechnungenPageContent />
    </RoleGuard>
  )
}

function RechnungenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])

  const [sucheKunde, setSucheKunde] = useState('')
  const [kundeId, setKundeId] = useState('')
  const [rechnungsnummer, setRechnungsnummer] = useState('')
  const [rechnungsdatum, setRechnungsdatum] = useState(new Date().toISOString().slice(0, 10))
  const [faelligAm, setFaelligAm] = useState('')
  const [bruttoSumme, setBruttoSumme] = useState('')
  const [interneNotiz, setInterneNotiz] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const [kRes, rRes] = await Promise.all([
      supabase.from('kunden').select('*').order('created_at', { ascending: false }),
      supabase.from('rechnungen').select('*').order('created_at', { ascending: false }),
    ])

    if (kRes.error || rRes.error) {
      setFehler(kRes.error?.message || rRes.error?.message || '')
      return
    }

    setKunden((kRes.data || []) as Kunde[])
    setRechnungen((rRes.data || []) as Rechnung[])
  }

  useEffect(() => {
    laden()
  }, [])

  const kundenTreffer = useMemo(() => {
    const q = sucheKunde.trim().toLowerCase()
    return kunden.filter((k) => {
      if (!q) return true
      return [
        k.firmenname,
        `${k.vorname || ''} ${k.nachname || ''}`.trim(),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [kunden, sucheKunde])

  function kundeName(id: string | null) {
    const kunde = kunden.find((k) => k.id === id)
    return kunde
      ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
      : '-'
  }

  async function erstellen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!kundeId) {
      setFehler('Bitte Kunde direkt über die Suche auswählen.')
      return
    }

    if (!rechnungsnummer.trim()) {
      setFehler('Bitte eine Rechnungsnummer eingeben.')
      return
    }

    if (!bruttoSumme) {
      setFehler('Bitte eine Bruttosumme eingeben.')
      return
    }

    const betrag = Number(bruttoSumme)
    if (Number.isNaN(betrag)) {
      setFehler('Bruttosumme ist ungültig.')
      return
    }

    const { error } = await supabase.from('rechnungen').insert({
      kunde_id: kundeId,
      rechnungsnummer: rechnungsnummer.trim(),
      rechnungsdatum,
      faellig_am: faelligAm || null,
      status: 'offen',
      brutto_summe: betrag,
      offener_betrag: betrag,
      interne_notiz: interneNotiz || null,
      mahnstufe: 0,
      forderungsstatus: 'offen',
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setSucheKunde('')
    setKundeId('')
    setRechnungsnummer('')
    setRechnungsdatum(new Date().toISOString().slice(0, 10))
    setFaelligAm('')
    setBruttoSumme('')
    setInterneNotiz('')
    setMeldung('Rechnung wurde manuell erstellt.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Rechnungen</h1>
          <div className="topbar-subtitle">
            Direktauswahl des Kunden in der Suche.
          </div>
        </div>
      </div>

      <form onSubmit={erstellen} className="page-card">
        <h2 style={{ marginTop: 0 }}>Rechnung manuell erstellen</h2>

        <div className="form-row">
          <input
            list="kunden-liste"
            placeholder="Kunde suchen und direkt auswählen"
            value={sucheKunde}
            onChange={(e) => {
              const value = e.target.value
              setSucheKunde(value)
              const match = kundenTreffer.find((k) => {
                const label =
                  k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim()
                return label === value
              })
              if (match) {
                setKundeId(match.id)
              }
            }}
          />
          <datalist id="kunden-liste">
            {kundenTreffer.map((k) => (
              <option
                key={k.id}
                value={k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim()}
              />
            ))}
          </datalist>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            placeholder="Rechnungsnummer"
            value={rechnungsnummer}
            onChange={(e) => setRechnungsnummer(e.target.value)}
          />
          <input
            type="date"
            value={rechnungsdatum}
            onChange={(e) => setRechnungsdatum(e.target.value)}
          />
          <input
            type="date"
            value={faelligAm}
            onChange={(e) => setFaelligAm(e.target.value)}
          />
          <input
            placeholder="Bruttosumme"
            value={bruttoSumme}
            onChange={(e) => setBruttoSumme(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Interne Notiz"
            value={interneNotiz}
            onChange={(e) => setInterneNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div className="action-row">
          <button type="submit">Rechnung erstellen</button>
        </div>
      </form>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Rechnungsliste</h2>

        {rechnungen.map((r) => (
          <div key={r.id} className="list-box">
            <strong>{r.rechnungsnummer || r.id}</strong>
            <br />
            Kunde: {kundeName(r.kunde_id)}
            <br />
            Rechnungsdatum: {r.rechnungsdatum || '-'}
            <br />
            Fällig am: {r.faellig_am || '-'}
            <br />
            Brutto: {Number(r.brutto_summe || 0).toFixed(2)} €
            <br />
            Offen: {Number(r.offener_betrag || 0).toFixed(2)} €
            <br />
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={r.status || 'offen'} />
            </div>
          </div>
        ))}

        {rechnungen.length === 0 && <div className="muted">Noch keine Rechnungen vorhanden.</div>}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}