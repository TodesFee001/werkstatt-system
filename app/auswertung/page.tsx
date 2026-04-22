'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Rechnung = {
  id: string
  rechnungsdatum: string | null
  brutto_summe: number | null
  netto_summe: number | null
  status: string | null
}

type Zahlung = {
  id: string
  zahlungsdatum: string | null
  betrag: number | null
  storniert: boolean | null
}

function AuswertungPageContent() {
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

  const monate = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1).map((monat) => {
      const rechnungenMonat = rechnungen.filter((r) => {
        if (!r.rechnungsdatum) return false
        const d = new Date(r.rechnungsdatum)
        return d.getFullYear() === Number(jahr) && d.getMonth() + 1 === monat
      })

      const zahlungenMonat = zahlungen.filter((z) => {
        if (!z.zahlungsdatum || z.storniert) return false
        const d = new Date(z.zahlungsdatum)
        return d.getFullYear() === Number(jahr) && d.getMonth() + 1 === monat
      })

      return {
        monat,
        umsatzBrutto: rechnungenMonat.reduce((sum, r) => sum + Number(r.brutto_summe || 0), 0),
        umsatzNetto: rechnungenMonat.reduce((sum, r) => sum + Number(r.netto_summe || 0), 0),
        eingang: zahlungenMonat.reduce((sum, z) => sum + Number(z.betrag || 0), 0),
        anzahlRechnungen: rechnungenMonat.length,
      }
    })
  }, [rechnungen, zahlungen, jahr])

  return (
    <div className="page-card">
      <h1>Auswertung</h1>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <strong>Jahr</strong>
        <br />
        <input value={jahr} onChange={(e) => setJahr(e.target.value)} />
      </div>

      <div>
        {monate.map((m) => (
          <div key={m.monat} className="list-box">
            <strong>Monat {m.monat}</strong>
            <br />
            Rechnungen: {m.anzahlRechnungen}
            <br />
            Umsatz netto: {m.umsatzNetto.toFixed(2)} €
            <br />
            Umsatz brutto: {m.umsatzBrutto.toFixed(2)} €
            <br />
            Zahlungseingang: {m.eingang.toFixed(2)} €
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function AuswertungPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <AuswertungPageContent />
    </RoleGuard>
  )
}