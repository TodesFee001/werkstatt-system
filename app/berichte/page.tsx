'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsdatum: string | null
  brutto_summe: number | null
  netto_summe: number | null
  offener_betrag: number | null
  status: string | null
}

type Zahlung = {
  id: string
  zahlungsdatum: string | null
  betrag: number | null
  storniert: boolean | null
}

export default function BerichtePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <BerichtePageContent />
    </RoleGuard>
  )
}

function BerichtePageContent() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])
  const [jahr, setJahr] = useState(String(new Date().getFullYear()))
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [rechnungenRes, zahlungenRes] = await Promise.all([
      supabase.from('rechnungen').select('*'),
      supabase.from('zahlungen').select('*'),
    ])

    const error = rechnungenRes.error || zahlungenRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setRechnungen(rechnungenRes.data || [])
    setZahlungen(zahlungenRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  const daten = useMemo(() => {
    const rechnungenImJahr = rechnungen.filter((r) => {
      if (!r.rechnungsdatum) return false
      return new Date(r.rechnungsdatum).getFullYear() === Number(jahr)
    })

    const zahlungenImJahr = zahlungen.filter((z) => {
      if (!z.zahlungsdatum || z.storniert) return false
      return new Date(z.zahlungsdatum).getFullYear() === Number(jahr)
    })

    const netto = rechnungenImJahr.reduce((sum, r) => sum + Number(r.netto_summe || 0), 0)
    const brutto = rechnungenImJahr.reduce((sum, r) => sum + Number(r.brutto_summe || 0), 0)
    const offen = rechnungenImJahr.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0)
    const eingang = zahlungenImJahr.reduce((sum, z) => sum + Number(z.betrag || 0), 0)

    return {
      rechnungenImJahr,
      zahlungenImJahr,
      netto,
      brutto,
      offen,
      eingang,
    }
  }, [rechnungen, zahlungen, jahr])

  return (
    <div className="page-card">
      <style>{`
        @media print {
          button, input { display: none !important; }
        }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="topbar-title">Finanzbericht</h1>
          <div className="topbar-subtitle">Druckbare Übersicht über Umsatz, Zahlungen und offene Beträge.</div>
        </div>

        <button type="button" onClick={() => window.print()}>
          Drucken / als PDF speichern
        </button>
      </div>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <strong>Jahr</strong>
        <br />
        <input value={jahr} onChange={(e) => setJahr(e.target.value)} />
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Netto-Umsatz</div>
          <div className="stat-value">{daten.netto.toFixed(2)} €</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Brutto-Umsatz</div>
          <div className="stat-value">{daten.brutto.toFixed(2)} €</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Zahlungseingänge</div>
          <div className="stat-value">{daten.eingang.toFixed(2)} €</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Offene Beträge</div>
          <div className="stat-value">{daten.offen.toFixed(2)} €</div>
        </div>
      </div>

      <h2>Zusammenfassung</h2>
      <div className="list-box">
        Rechnungen im Jahr: {daten.rechnungenImJahr.length}
        <br />
        Zahlungen im Jahr: {daten.zahlungenImJahr.length}
        <br />
        Anteil offen am Brutto-Umsatz:{' '}
        {daten.brutto > 0 ? ((daten.offen / daten.brutto) * 100).toFixed(2) : '0.00'} %
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}