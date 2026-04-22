'use client'

import { useEffect, useMemo, useState } from 'react'
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

export default function FahrzeugePage() {
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])

  const [kundeId, setKundeId] = useState('')
  const [kennzeichen, setKennzeichen] = useState('')
  const [marke, setMarke] = useState('')
  const [modell, setModell] = useState('')
  const [fahrgestellnummer, setFahrgestellnummer] = useState('')
  const [baujahr, setBaujahr] = useState('')

  const [suche, setSuche] = useState('')
  const [sortierung, setSortierung] = useState('kennzeichen_asc')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenKundeId, setBearbeitenKundeId] = useState('')
  const [bearbeitenKennzeichen, setBearbeitenKennzeichen] = useState('')
  const [bearbeitenMarke, setBearbeitenMarke] = useState('')
  const [bearbeitenModell, setBearbeitenModell] = useState('')
  const [bearbeitenFahrgestellnummer, setBearbeitenFahrgestellnummer] = useState('')
  const [bearbeitenBaujahr, setBearbeitenBaujahr] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [fahrzeugeRes, kundenRes] = await Promise.all([
      supabase.from('fahrzeuge').select('*').order('created_at', { ascending: false }),
      supabase.from('kunden').select('*'),
    ])

    const error = fahrzeugeRes.error || kundenRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setFahrzeuge(fahrzeugeRes.data || [])
    setKunden(kundenRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function fahrzeugAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    const { error } = await supabase.from('fahrzeuge').insert({
      kunde_id: kundeId || null,
      kennzeichen: kennzeichen || null,
      marke: marke || null,
      modell: modell || null,
      fahrgestellnummer: fahrgestellnummer || null,
      baujahr: baujahr ? Number(baujahr) : null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setKundeId('')
    setKennzeichen('')
    setMarke('')
    setModell('')
    setFahrgestellnummer('')
    setBaujahr('')
    ladeAlles()
  }

  function bearbeitenStarten(fahrzeug: Fahrzeug) {
    setBearbeitenId(fahrzeug.id)
    setBearbeitenKundeId(fahrzeug.kunde_id || '')
    setBearbeitenKennzeichen(fahrzeug.kennzeichen || '')
    setBearbeitenMarke(fahrzeug.marke || '')
    setBearbeitenModell(fahrzeug.modell || '')
    setBearbeitenFahrgestellnummer(fahrzeug.fahrgestellnummer || '')
    setBearbeitenBaujahr(String(fahrzeug.baujahr ?? ''))
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenKundeId('')
    setBearbeitenKennzeichen('')
    setBearbeitenMarke('')
    setBearbeitenModell('')
    setBearbeitenFahrgestellnummer('')
    setBearbeitenBaujahr('')
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
        fahrgestellnummer: bearbeitenFahrgestellnummer || null,
        baujahr: bearbeitenBaujahr ? Number(bearbeitenBaujahr) : null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeAlles()
  }

  async function fahrzeugLoeschen(id: string) {
    const bestaetigt = window.confirm('Fahrzeug wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase.from('fahrzeuge').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  function kundeName(id: string | null) {
    if (!id) return '-'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return '-'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    let liste = fahrzeuge.filter((f) => {
      if (!q) return true
      const kunde = kundeName(f.kunde_id)
      return [
        f.kennzeichen,
        f.marke,
        f.modell,
        f.fahrgestellnummer,
        kunde,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })

    liste = [...liste].sort((a, b) => {
      if (sortierung === 'kennzeichen_asc') return (a.kennzeichen || '').localeCompare(b.kennzeichen || '')
      if (sortierung === 'kennzeichen_desc') return (b.kennzeichen || '').localeCompare(a.kennzeichen || '')
      if (sortierung === 'marke_asc') return (a.marke || '').localeCompare(b.marke || '')
      if (sortierung === 'marke_desc') return (b.marke || '').localeCompare(a.marke || '')
      return 0
    })

    return liste
  }, [fahrzeuge, suche, sortierung])

  return (
    <div className="page-card">
      <h1>Fahrzeuge</h1>

      <form onSubmit={fahrzeugAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <select value={kundeId} onChange={(e) => setKundeId(e.target.value)}>
            <option value="">Kunde auswählen</option>
            {kunden.map((kunde) => (
              <option key={kunde.id} value={kunde.id}>
                {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
              </option>
            ))}
          </select>
          <input placeholder="Kennzeichen" value={kennzeichen} onChange={(e) => setKennzeichen(e.target.value)} />
          <input placeholder="Marke" value={marke} onChange={(e) => setMarke(e.target.value)} />
          <input placeholder="Modell" value={modell} onChange={(e) => setModell(e.target.value)} />
          <input placeholder="Fahrgestellnummer" value={fahrgestellnummer} onChange={(e) => setFahrgestellnummer(e.target.value)} />
          <input placeholder="Baujahr" value={baujahr} onChange={(e) => setBaujahr(e.target.value)} />
          <button type="submit">Fahrzeug anlegen</button>
        </div>
      </form>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            placeholder="Fahrzeuge suchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
          <select value={sortierung} onChange={(e) => setSortierung(e.target.value)}>
            <option value="kennzeichen_asc">Kennzeichen A-Z</option>
            <option value="kennzeichen_desc">Kennzeichen Z-A</option>
            <option value="marke_asc">Marke A-Z</option>
            <option value="marke_desc">Marke Z-A</option>
          </select>
        </div>
      </div>

      {bearbeitenId && (
        <form onSubmit={fahrzeugSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Fahrzeug bearbeiten</h3>

          <div className="form-row">
            <select value={bearbeitenKundeId} onChange={(e) => setBearbeitenKundeId(e.target.value)}>
              <option value="">Kunde auswählen</option>
              {kunden.map((kunde) => (
                <option key={kunde.id} value={kunde.id}>
                  {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
                </option>
              ))}
            </select>
            <input placeholder="Kennzeichen" value={bearbeitenKennzeichen} onChange={(e) => setBearbeitenKennzeichen(e.target.value)} />
            <input placeholder="Marke" value={bearbeitenMarke} onChange={(e) => setBearbeitenMarke(e.target.value)} />
            <input placeholder="Modell" value={bearbeitenModell} onChange={(e) => setBearbeitenModell(e.target.value)} />
            <input placeholder="Fahrgestellnummer" value={bearbeitenFahrgestellnummer} onChange={(e) => setBearbeitenFahrgestellnummer(e.target.value)} />
            <input placeholder="Baujahr" value={bearbeitenBaujahr} onChange={(e) => setBearbeitenBaujahr(e.target.value)} />
          </div>

          <div className="form-row">
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div>
        {gefiltert.map((fahrzeug) => (
          <div key={fahrzeug.id} className="list-box">
            <strong>{fahrzeug.kennzeichen || '-'}</strong> – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
            <br />
            Kunde: {kundeName(fahrzeug.kunde_id)}
            <br />
            FIN: {fahrzeug.fahrgestellnummer || '-'}
            <br />
            Baujahr: {fahrzeug.baujahr || '-'}
            <br />
            <a href={`/fahrzeuge/${fahrzeug.id}`}>Zur Fahrzeugdetailseite</a>

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => bearbeitenStarten(fahrzeug)}>
                Bearbeiten
              </button>
              <button type="button" onClick={() => fahrzeugLoeschen(fahrzeug.id)} style={{ background: '#dc2626' }}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}