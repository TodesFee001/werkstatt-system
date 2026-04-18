'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '@/components/RoleGuard'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Fahrzeug = {
  id: string
  kunde_id: string | null
  kennzeichen: string | null
  marke: string | null
  modell: string | null
}

type Historie = {
  id: string
  fahrzeug_id: string | null
  kunde_id: string | null
  historientyp: string | null
  datum: string
  kilometerstand: number | null
  titel: string
  beschreibung: string | null
}

function ServicehistoriePageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [historie, setHistorie] = useState<Historie[]>([])

  const [fahrzeugId, setFahrzeugId] = useState('')
  const [historientyp, setHistorientyp] = useState('service')
  const [datum, setDatum] = useState('')
  const [kilometerstand, setKilometerstand] = useState('')
  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: kundenData, error: kundenError } = await supabase
      .from('kunden')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: fahrzeugeData, error: fahrzeugeError } = await supabase
      .from('fahrzeuge')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: historieData, error: historieError } = await supabase
      .from('servicehistorie')
      .select('*')
      .order('datum', { ascending: false })

    if (kundenError || fahrzeugeError || historieError) {
      setFehler(
        kundenError?.message ||
          fahrzeugeError?.message ||
          historieError?.message ||
          'Fehler'
      )
      return
    }

    setKunden(kundenData || [])
    setFahrzeuge(fahrzeugeData || [])
    setHistorie(historieData || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function historieAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!fahrzeugId) {
      setFehler('Bitte ein Fahrzeug auswählen.')
      return
    }

    if (!titel) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    if (!datum) {
      setFehler('Bitte ein Datum eingeben.')
      return
    }

    const fahrzeug = fahrzeuge.find((f) => f.id === fahrzeugId)

    const { error } = await supabase.from('servicehistorie').insert({
      fahrzeug_id: fahrzeugId,
      kunde_id: fahrzeug?.kunde_id || null,
      historientyp,
      datum,
      kilometerstand: kilometerstand ? Number(kilometerstand) : null,
      titel,
      beschreibung: beschreibung || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setFahrzeugId('')
    setHistorientyp('service')
    setDatum('')
    setKilometerstand('')
    setTitel('')
    setBeschreibung('')

    ladeAlles()
  }

  function fahrzeugAnzeige(fahrzeugId: string | null) {
    if (!fahrzeugId) return 'Unbekanntes Fahrzeug'
    const fahrzeug = fahrzeuge.find((f) => f.id === fahrzeugId)
    if (!fahrzeug) return 'Unbekanntes Fahrzeug'

    return `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}`
  }

  function kundeAnzeige(kundeId: string | null) {
    if (!kundeId) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === kundeId)
    if (!kunde) return 'Unbekannter Kunde'

    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  return (
    <div className="page-card">
      <h1>Fahrzeughistorie</h1>

      <form onSubmit={historieAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <select
            value={fahrzeugId}
            onChange={(e) => setFahrzeugId(e.target.value)}
            style={{ minWidth: 260 }}
          >
            <option value="">Fahrzeug auswählen</option>
            {fahrzeuge.map((fahrzeug) => (
              <option key={fahrzeug.id} value={fahrzeug.id}>
                {fahrzeug.kennzeichen || '-'} – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
              </option>
            ))}
          </select>

          <select
            value={historientyp}
            onChange={(e) => setHistorientyp(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="service">service</option>
            <option value="wartung">wartung</option>
            <option value="reparatur">reparatur</option>
            <option value="diagnose">diagnose</option>
            <option value="inspektion">inspektion</option>
          </select>

          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            style={{ minWidth: 170 }}
          />

          <input
            placeholder="Kilometerstand"
            value={kilometerstand}
            onChange={(e) => setKilometerstand(e.target.value)}
            style={{ minWidth: 160 }}
          />

          <input
            placeholder="Titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            style={{ minWidth: 220 }}
          />
        </div>

        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <textarea
            placeholder="Beschreibung / Notiz"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 100 }}
          />
        </div>

        <button type="submit">Historieneintrag anlegen</button>
      </form>

      <div>
        {historie.map((eintrag) => (
          <div key={eintrag.id} className="list-box">
            <strong>{eintrag.titel}</strong>
            <br />
            Typ: {eintrag.historientyp || '-'}
            <br />
            Datum: {eintrag.datum}
            <br />
            Kilometerstand: {eintrag.kilometerstand ?? '-'}
            <br />
            Fahrzeug: {fahrzeugAnzeige(eintrag.fahrzeug_id)}
            <br />
            Kunde: {kundeAnzeige(eintrag.kunde_id)}
            <br />
            Beschreibung: {eintrag.beschreibung || '-'}
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function ServicehistoriePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme']}>
      <ServicehistoriePageContent />
    </RoleGuard>
  )
}