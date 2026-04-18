'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Fahrzeug = {
  id: string
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  kunde_id: string | null
}

export default function FahrzeugePage() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [kundeId, setKundeId] = useState('')
  const [kennzeichen, setKennzeichen] = useState('')
  const [marke, setMarke] = useState('')
  const [modell, setModell] = useState('')
  const [fehler, setFehler] = useState('')

  async function ladeKunden() {
    const { data, error } = await supabase.from('kunden').select('*')
    if (error) return setFehler(error.message)
    setKunden(data || [])
  }

  async function ladeFahrzeuge() {
    const { data, error } = await supabase
      .from('fahrzeuge')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return setFehler(error.message)
    setFahrzeuge(data || [])
  }

  useEffect(() => {
    ladeKunden()
    ladeFahrzeuge()
  }, [])

  async function fahrzeugAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!kundeId) {
      setFehler('Bitte zuerst einen Kunden auswählen.')
      return
    }

    const { error } = await supabase.from('fahrzeuge').insert({
      kunde_id: kundeId,
      kennzeichen: kennzeichen || null,
      marke: marke || null,
      modell: modell || null,
      status: 'aktiv',
    })

    if (error) return setFehler(error.message)

    setKundeId('')
    setKennzeichen('')
    setMarke('')
    setModell('')
    ladeFahrzeuge()
  }

  return (
    <div className="page-card">
      <h1>Fahrzeuge</h1>

      <form onSubmit={fahrzeugAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <select
            value={kundeId}
            onChange={(e) => setKundeId(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Kunde auswählen</option>
            {kunden.map((kunde) => (
              <option key={kunde.id} value={kunde.id}>
                {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
              </option>
            ))}
          </select>

          <input
            placeholder="Kennzeichen"
            value={kennzeichen}
            onChange={(e) => setKennzeichen(e.target.value)}
            style={{ minWidth: 160 }}
          />
          <input
            placeholder="Marke"
            value={marke}
            onChange={(e) => setMarke(e.target.value)}
            style={{ minWidth: 160 }}
          />
          <input
            placeholder="Modell"
            value={modell}
            onChange={(e) => setModell(e.target.value)}
            style={{ minWidth: 160 }}
          />

          <button type="submit">Fahrzeug anlegen</button>
        </div>
      </form>

      <div>
        {fahrzeuge.map((fahrzeug) => {
          const kunde = kunden.find((k) => k.id === fahrzeug.kunde_id)

          return (
            <div key={fahrzeug.id} className="list-box">
              {kunde
                ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
                : 'Unbekannt'}{' '}
              – {fahrzeug.kennzeichen || '-'} – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
            </div>
          )
        })}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}