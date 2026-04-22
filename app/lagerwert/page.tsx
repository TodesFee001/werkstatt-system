'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Lagerartikel = {
  id: string
  artikelnummer: string | null
  name: string
  bestand: number | null
  mindestbestand: number | null
  einkaufspreis: number | null
  verkaufspreis: number | null
  einheit: string | null
  lagerort: string | null
  aktiv: boolean | null
}

function LagerwertPageContent() {
  const [artikel, setArtikel] = useState<Lagerartikel[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeArtikel() {
    const { data, error } = await supabase
      .from('lagerartikel')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      setFehler(error.message)
      return
    }

    setArtikel(data || [])
  }

  useEffect(() => {
    ladeArtikel()
  }, [])

  const gesamtEinkaufswert = useMemo(() => {
    return artikel.reduce(
      (sum, a) => sum + Number(a.bestand || 0) * Number(a.einkaufspreis || 0),
      0
    )
  }, [artikel])

  const gesamtVerkaufswert = useMemo(() => {
    return artikel.reduce(
      (sum, a) => sum + Number(a.bestand || 0) * Number(a.verkaufspreis || 0),
      0
    )
  }, [artikel])

  const warnartikel = useMemo(() => {
    return artikel.filter(
      (a) => Number(a.bestand || 0) <= Number(a.mindestbestand || 0)
    )
  }, [artikel])

  return (
    <div className="page-card">
      <h1>Lagerwert</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="list-box">
          <strong>Gesamt-Einkaufswert</strong>
          <br />
          {gesamtEinkaufswert.toFixed(2)} €
        </div>

        <div className="list-box">
          <strong>Gesamt-Verkaufswert</strong>
          <br />
          {gesamtVerkaufswert.toFixed(2)} €
        </div>

        <div className="list-box">
          <strong>Warnartikel</strong>
          <br />
          {warnartikel.length}
        </div>
      </div>

      <div>
        {artikel.map((a) => {
          const einkaufswert = Number(a.bestand || 0) * Number(a.einkaufspreis || 0)
          const verkaufswert = Number(a.bestand || 0) * Number(a.verkaufspreis || 0)

          return (
            <div key={a.id} className="list-box">
              <strong>{a.name}</strong>
              <br />
              Artikelnummer: {a.artikelnummer || '-'}
              <br />
              Bestand: {Number(a.bestand || 0).toFixed(2)} {a.einheit || 'Stk'}
              <br />
              Mindestbestand: {Number(a.mindestbestand || 0).toFixed(2)}
              <br />
              Einkaufspreis: {Number(a.einkaufspreis || 0).toFixed(2)} €
              <br />
              Verkaufspreis: {Number(a.verkaufspreis || 0).toFixed(2)} €
              <br />
              Einkaufswert: {einkaufswert.toFixed(2)} €
              <br />
              Verkaufswert: {verkaufswert.toFixed(2)} €
              <br />
              Lagerort: {a.lagerort || '-'}
              <br />
              Warnung:{' '}
              {Number(a.bestand || 0) <= Number(a.mindestbestand || 0) ? 'ja' : 'nein'}
            </div>
          )
        })}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function LagerwertPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Lager']}>
      <LagerwertPageContent />
    </RoleGuard>
  )
}