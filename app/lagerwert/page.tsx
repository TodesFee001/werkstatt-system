'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Lagerartikel = {
  id: string
  artikelnummer: number | null
  name: string | null
  bestand: number | null
  einkaufspreis: number | null
  lagerort: string | null
}

export default function LagerwertPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Lager', 'Behördenvertreter']}>
      <LagerwertPageContent />
    </RoleGuard>
  )
}

function LagerwertPageContent() {
  const [artikel, setArtikel] = useState<Lagerartikel[]>([])
  const [suche, setSuche] = useState('')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('lagerartikel')
      .select('id, artikelnummer, name, bestand, einkaufspreis, lagerort')

    if (error) {
      setFehler(error.message)
      return
    }

    setArtikel((data || []) as Lagerartikel[])
  }

  useEffect(() => {
    laden()
  }, [])

  const sortiert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return [...artikel]
      .filter((a) => {
        if (!q) return true
        return [a.artikelnummer, a.name, a.lagerort]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      })
      .sort((a, b) => Number(a.artikelnummer || 0) - Number(b.artikelnummer || 0))
  }, [artikel, suche])

  const gesamtwert = sortiert.reduce(
    (sum, a) => sum + Number(a.bestand || 0) * Number(a.einkaufspreis || 0),
    0
  )

  return (
    <div className="page-card">
      <h1>Lagerwert</h1>

      <div className="kpi-strip" style={{ marginBottom: 18 }}>
        <div className="kpi-pill">
          Gesamtwert
          <strong>{gesamtwert.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          placeholder="Lagerwert durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
      </div>

      {sortiert.map((a) => {
        const wert = Number(a.bestand || 0) * Number(a.einkaufspreis || 0)

        return (
          <div key={a.id} className="list-box">
            <strong>
              {a.artikelnummer || '-'} – {a.name || '-'}
            </strong>
            <br />
            Bestand: {Number(a.bestand || 0).toFixed(2)}
            <br />
            Einkaufspreis: {Number(a.einkaufspreis || 0).toFixed(2)} €
            <br />
            Lagerort: {a.lagerort || '-'}
            <br />
            Lagerwert: {wert.toFixed(2)} €
          </div>
        )
      })}

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}