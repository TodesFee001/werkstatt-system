'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Mitarbeiter = {
  id: string
  vorname: string
  nachname: string
}

type Arbeitszeit = {
  id: string
  mitarbeiter_id: string | null
  datum: string
  stunden: number
  stundensatz: number | null
  gesamtpreis: number | null
}

function ArbeitszeitAuswertungPageContent() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([])
  const [jahr, setJahr] = useState(String(new Date().getFullYear()))
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [mitarbeiterRes, arbeitszeitenRes] = await Promise.all([
      supabase.from('mitarbeiter').select('id, vorname, nachname'),
      supabase.from('serviceauftrag_arbeitszeiten').select('*'),
    ])

    const error = mitarbeiterRes.error || arbeitszeitenRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setMitarbeiter(mitarbeiterRes.data || [])
    setArbeitszeiten(arbeitszeitenRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  const auswertung = useMemo(() => {
    return mitarbeiter.map((person) => {
      const eintraege = arbeitszeiten.filter((z) => {
        if (!z.mitarbeiter_id || z.mitarbeiter_id !== person.id) return false
        const d = new Date(z.datum)
        return d.getFullYear() === Number(jahr)
      })

      const stunden = eintraege.reduce((sum, z) => sum + Number(z.stunden || 0), 0)
      const umsatz = eintraege.reduce((sum, z) => sum + Number(z.gesamtpreis || 0), 0)

      return {
        id: person.id,
        name: `${person.vorname} ${person.nachname}`,
        eintraege: eintraege.length,
        stunden,
        umsatz,
      }
    })
  }, [mitarbeiter, arbeitszeiten, jahr])

  return (
    <div className="page-card">
      <h1>Arbeitszeit-Auswertung</h1>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <strong>Jahr</strong>
        <br />
        <input value={jahr} onChange={(e) => setJahr(e.target.value)} />
      </div>

      <div>
        {auswertung.map((eintrag) => (
          <div key={eintrag.id} className="list-box">
            <strong>{eintrag.name}</strong>
            <br />
            Einträge: {eintrag.eintraege}
            <br />
            Stunden gesamt: {eintrag.stunden.toFixed(2)}
            <br />
            Arbeitsumsatz: {eintrag.umsatz.toFixed(2)} €
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function ArbeitszeitAuswertungPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Werkstatt']}>
      <ArbeitszeitAuswertungPageContent />
    </RoleGuard>
  )
}