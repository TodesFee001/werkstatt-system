'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Rechnung = {
  id: string
  kunde_id: string | null
  brutto_summe: number | null
  netto_summe: number | null
  status: string | null
  rechnungsdatum: string | null
}

function KundenAuswertungPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [jahr, setJahr] = useState(String(new Date().getFullYear()))
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [kundenRes, rechnungenRes] = await Promise.all([
      supabase.from('kunden').select('*'),
      supabase.from('rechnungen').select('*'),
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

  const topKunden = useMemo(() => {
    return kunden
      .map((kunde) => {
        const kundenRechnungen = rechnungen.filter((r) => {
          if (r.kunde_id !== kunde.id || !r.rechnungsdatum) return false
          return new Date(r.rechnungsdatum).getFullYear() === Number(jahr)
        })

        return {
          id: kunde.id,
          name: kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim(),
          anzahl: kundenRechnungen.length,
          netto: kundenRechnungen.reduce((sum, r) => sum + Number(r.netto_summe || 0), 0),
          brutto: kundenRechnungen.reduce((sum, r) => sum + Number(r.brutto_summe || 0), 0),
        }
      })
      .sort((a, b) => b.brutto - a.brutto)
  }, [kunden, rechnungen, jahr])

  return (
    <div className="page-card">
      <h1>Kunden-Auswertung</h1>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <strong>Jahr</strong>
        <br />
        <input value={jahr} onChange={(e) => setJahr(e.target.value)} />
      </div>

      <div>
        {topKunden.map((kunde) => (
          <div key={kunde.id} className="list-box">
            <strong>{kunde.name || 'Unbekannter Kunde'}</strong>
            <br />
            Rechnungen: {kunde.anzahl}
            <br />
            Umsatz netto: {kunde.netto.toFixed(2)} €
            <br />
            Umsatz brutto: {kunde.brutto.toFixed(2)} €
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function KundenAuswertungPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <KundenAuswertungPageContent />
    </RoleGuard>
  )
}