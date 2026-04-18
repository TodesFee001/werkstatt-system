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

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenKundeId, setBearbeitenKundeId] = useState('')
  const [bearbeitenKennzeichen, setBearbeitenKennzeichen] = useState('')
  const [bearbeitenMarke, setBearbeitenMarke] = useState('')
  const [bearbeitenModell, setBearbeitenModell] = useState('')

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

  function bearbeitenStarten(fahrzeug: Fahrzeug) {
    setBearbeitenId(fahrzeug.id)
    setBearbeitenKundeId(fahrzeug.kunde_id || '')
    setBearbeitenKennzeichen(fahrzeug.kennzeichen || '')
    setBearbeitenMarke(fahrzeug.marke || '')
    setBearbeitenModell(fahrzeug.modell || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenKundeId('')
    setBearbeitenKennzeichen('')
    setBearbeitenMarke('')
    setBearbeitenModell('')
  }

  async function fahrzeugSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    const { error } = await supabase
      .from('fahrzeuge')
      .update({
        kunde_id: bearbeitenKundeId || null,
        kennzeichen: bearbeitenKennzeichen || null,
        marke: bearbeitenMarke || null,
        modell: bearbeitenModell || null,
      })
      .eq('id', bearbeitenId)

    if (error) return setFehler(error.message)

    bearbeitenAbbrechen()
    ladeFahrzeuge()
  }

  async function fahrzeugLoeschen(id: string) {
    const bestaetigt = window.confirm('Fahrzeug wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase.from('fahrzeuge').delete().eq('id', id)

    if (error) return setFehler(error.message)

    if (bearbeitenId === id) {
      bearbeitenAbbrechen()
    }

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

      {bearbeitenId && (
        <form onSubmit={fahrzeugSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Fahrzeug bearbeiten</h3>

          <div className="form-row">
            <select
              value={bearbeitenKundeId}
              onChange={(e) => setBearbeitenKundeId(e.target.value)}
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
              value={bearbeitenKennzeichen}
              onChange={(e) => setBearbeitenKennzeichen(e.target.value)}
            />
            <input
              placeholder="Marke"
              value={bearbeitenMarke}
              onChange={(e) => setBearbeitenMarke(e.target.value)}
            />
            <input
              placeholder="Modell"
              value={bearbeitenModell}
              onChange={(e) => setBearbeitenModell(e.target.value)}
            />
          </div>

          <div className="form-row">
            <button type="submit">Speichern</button>
            <button
              type="button"
              onClick={bearbeitenAbbrechen}
              style={{ background: '#6b7280' }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div>
        {fahrzeuge.map((fahrzeug) => {
          const kunde = kunden.find((k) => k.id === fahrzeug.kunde_id)

          return (
            <div key={fahrzeug.id} className="list-box">
              <strong>
                {kunde
                  ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
                  : 'Unbekannt'}
              </strong>{' '}
              – {fahrzeug.kennzeichen || '-'} – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}

              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => bearbeitenStarten(fahrzeug)}>
                  Bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => fahrzeugLoeschen(fahrzeug.id)}
                  style={{ background: '#dc2626' }}
                >
                  Löschen
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}