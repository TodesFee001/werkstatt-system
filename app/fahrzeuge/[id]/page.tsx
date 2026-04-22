'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Fahrzeug = {
  id: string
  kunde_id: string | null
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  fahrgestellnummer: string | null
  baujahr: number | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Serviceauftrag = {
  id: string
  fahrzeug_id: string | null
  art: string | null
  status: string | null
  fehlerbeschreibung: string | null
}

type Historie = {
  id: string
  fahrzeug_id: string | null
  datum: string | null
  beschreibung: string | null
}

export default function FahrzeugDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [fahrzeug, setFahrzeug] = useState<Fahrzeug | null>(null)
  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [historie, setHistorie] = useState<Historie[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: fahrzeugData, error: fahrzeugError } = await supabase
      .from('fahrzeuge')
      .select('*')
      .eq('id', id)
      .single()

    if (fahrzeugError || !fahrzeugData) {
      setFehler(fahrzeugError?.message || 'Fahrzeug nicht gefunden')
      return
    }

    setFahrzeug(fahrzeugData)

    const [kundeRes, serviceRes, historieRes] = await Promise.all([
      fahrzeugData.kunde_id
        ? supabase.from('kunden').select('*').eq('id', fahrzeugData.kunde_id).single()
        : Promise.resolve({ data: null, error: null } as any),
      supabase.from('serviceauftraege').select('*').eq('fahrzeug_id', id),
      supabase.from('servicehistorie').select('*').eq('fahrzeug_id', id),
    ])

    const error = kundeRes.error || serviceRes.error || historieRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunde(kundeRes.data || null)
    setServiceauftraege(serviceRes.data || [])
    setHistorie(historieRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [id])

  return (
    <div className="page-card">
      <h1>Fahrzeugdetail</h1>

      {fahrzeug && (
        <div className="list-box">
          <strong>{fahrzeug.kennzeichen || '-'}</strong>
          <br />
          Marke/Modell: {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
          <br />
          FIN: {fahrzeug.fahrgestellnummer || '-'}
          <br />
          Baujahr: {fahrzeug.baujahr || '-'}
          <br />
          Kunde: {kunde ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim() : '-'}
          <br />
          {kunde && <Link href={`/kunden/${kunde.id}`}>Zur Kundendetailseite</Link>}
        </div>
      )}

      <h2>Serviceaufträge</h2>
      {serviceauftraege.map((s) => (
        <div key={s.id} className="list-box">
          <strong>{s.art || '-'}</strong> – {s.status || '-'}
          <br />
          Fehler: {s.fehlerbeschreibung || '-'}
          <br />
          <Link href={`/serviceauftraege/${s.id}`}>Zur Auftragsdetailseite</Link>
        </div>
      ))}

      <h2>Servicehistorie</h2>
      {historie.map((h) => (
        <div key={h.id} className="list-box">
          <strong>{h.datum || '-'}</strong>
          <br />
          {h.beschreibung || '-'}
        </div>
      ))}

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}