'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  rechnungsdatum: string | null
  faellig_am: string | null
  status: string | null
  brutto_summe: number | null
  netto_summe: number | null
  offener_betrag: number | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

function ExportePageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
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

  function kundeName(id: string | null) {
    if (!id) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return 'Unbekannter Kunde'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function exportOffenePosten() {
    const offene = rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0)

    const rows = [
      ['Rechnungsnummer', 'Kunde', 'Rechnungsdatum', 'Faellig am', 'Status', 'Brutto', 'Offen'],
      ...offene.map((r) => [
        r.rechnungsnummer || r.id,
        kundeName(r.kunde_id),
        r.rechnungsdatum || '',
        r.faellig_am || '',
        r.status || '',
        Number(r.brutto_summe || 0).toFixed(2),
        Number(r.offener_betrag || 0).toFixed(2),
      ]),
    ]

    downloadCsv('offene-posten.csv', rows)
  }

  function exportRechnungen() {
    const rows = [
      ['Rechnungsnummer', 'Kunde', 'Rechnungsdatum', 'Status', 'Netto', 'Brutto', 'Offen'],
      ...rechnungen.map((r) => [
        r.rechnungsnummer || r.id,
        kundeName(r.kunde_id),
        r.rechnungsdatum || '',
        r.status || '',
        Number(r.netto_summe || 0).toFixed(2),
        Number(r.brutto_summe || 0).toFixed(2),
        Number(r.offener_betrag || 0).toFixed(2),
      ]),
    ]

    downloadCsv('rechnungen.csv', rows)
  }

  return (
    <div className="page-card">
      <h1>Exporte</h1>

      <div className="list-box">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={exportOffenePosten}>
            Offene Posten als CSV
          </button>

          <button type="button" onClick={exportRechnungen}>
            Rechnungen als CSV
          </button>
        </div>
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function ExportePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <ExportePageContent />
    </RoleGuard>
  )
}