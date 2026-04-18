'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [offeneRechnungen, setOffeneRechnungen] = useState(0)
  const [umsatz, setUmsatz] = useState(0)
  const [fahrzeugeInArbeit, setFahrzeugeInArbeit] = useState(0)
  const [mitarbeiterAktiv, setMitarbeiterAktiv] = useState(0)

  async function ladeDaten() {
    const { data: rechnungen } = await supabase.from('rechnungen').select('*')
    const { data: service } = await supabase.from('serviceauftraege').select('*')
    const { data: mitarbeiter } = await supabase.from('mitarbeiter').select('*')

    const offen = rechnungen?.filter((r) => r.status !== 'bezahlt').length || 0
    const summe =
      rechnungen?.reduce((sum, r) => sum + (r.brutto_summe || 0), 0) || 0

    const inArbeit =
      service?.filter((s) => s.status === 'in_arbeit').length || 0

    const aktiv =
      mitarbeiter?.filter((m) => m.status === 'aktiv').length || 0

    setOffeneRechnungen(offen)
    setUmsatz(summe)
    setFahrzeugeInArbeit(inArbeit)
    setMitarbeiterAktiv(aktiv)
  }

  useEffect(() => {
    ladeDaten()
  }, [])

  return (
    <div className="page-card">
      <h1>Dashboard</h1>

      <div className="form-row" style={{ flexWrap: 'wrap' }}>
        <div className="list-box">
          <strong>Offene Rechnungen</strong>
          <br />
          {offeneRechnungen}
        </div>

        <div className="list-box">
          <strong>Gesamtumsatz</strong>
          <br />
          {umsatz} €
        </div>

        <div className="list-box">
          <strong>Fahrzeuge in Arbeit</strong>
          <br />
          {fahrzeugeInArbeit}
        </div>

        <div className="list-box">
          <strong>Mitarbeiter aktiv</strong>
          <br />
          {mitarbeiterAktiv}
        </div>
      </div>
    </div>
  )
}