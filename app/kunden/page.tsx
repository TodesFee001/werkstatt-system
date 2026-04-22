'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  land: string | null
  email: string | null
  telefon: string | null
}

export default function KundenPage() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [firmenname, setFirmenname] = useState('')
  const [strasse, setStrasse] = useState('')
  const [plz, setPlz] = useState('')
  const [ort, setOrt] = useState('')
  const [land, setLand] = useState('Deutschland')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')

  const [suche, setSuche] = useState('')
  const [sortierung, setSortierung] = useState('name_asc')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenVorname, setBearbeitenVorname] = useState('')
  const [bearbeitenNachname, setBearbeitenNachname] = useState('')
  const [bearbeitenFirmenname, setBearbeitenFirmenname] = useState('')
  const [bearbeitenStrasse, setBearbeitenStrasse] = useState('')
  const [bearbeitenPlz, setBearbeitenPlz] = useState('')
  const [bearbeitenOrt, setBearbeitenOrt] = useState('')
  const [bearbeitenLand, setBearbeitenLand] = useState('')
  const [bearbeitenEmail, setBearbeitenEmail] = useState('')
  const [bearbeitenTelefon, setBearbeitenTelefon] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeKunden() {
    const { data, error } = await supabase
      .from('kunden')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden(data || [])
  }

  useEffect(() => {
    ladeKunden()
  }, [])

  async function kundeAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    const { error } = await supabase.from('kunden').insert({
      vorname: vorname || null,
      nachname: nachname || null,
      firmenname: firmenname || null,
      strasse: strasse || null,
      plz: plz || null,
      ort: ort || null,
      land: land || null,
      email: email || null,
      telefon: telefon || null,
      kundentyp: firmenname ? 'firma' : 'privat',
      status: 'aktiv',
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setVorname('')
    setNachname('')
    setFirmenname('')
    setStrasse('')
    setPlz('')
    setOrt('')
    setLand('Deutschland')
    setEmail('')
    setTelefon('')
    ladeKunden()
  }

  function bearbeitenStarten(kunde: Kunde) {
    setBearbeitenId(kunde.id)
    setBearbeitenVorname(kunde.vorname || '')
    setBearbeitenNachname(kunde.nachname || '')
    setBearbeitenFirmenname(kunde.firmenname || '')
    setBearbeitenStrasse(kunde.strasse || '')
    setBearbeitenPlz(kunde.plz || '')
    setBearbeitenOrt(kunde.ort || '')
    setBearbeitenLand(kunde.land || '')
    setBearbeitenEmail(kunde.email || '')
    setBearbeitenTelefon(kunde.telefon || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenVorname('')
    setBearbeitenNachname('')
    setBearbeitenFirmenname('')
    setBearbeitenStrasse('')
    setBearbeitenPlz('')
    setBearbeitenOrt('')
    setBearbeitenLand('')
    setBearbeitenEmail('')
    setBearbeitenTelefon('')
  }

  async function kundeSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    setFehler('')

    const { error } = await supabase
      .from('kunden')
      .update({
        vorname: bearbeitenVorname || null,
        nachname: bearbeitenNachname || null,
        firmenname: bearbeitenFirmenname || null,
        strasse: bearbeitenStrasse || null,
        plz: bearbeitenPlz || null,
        ort: bearbeitenOrt || null,
        land: bearbeitenLand || null,
        email: bearbeitenEmail || null,
        telefon: bearbeitenTelefon || null,
        kundentyp: bearbeitenFirmenname ? 'firma' : 'privat',
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeKunden()
  }

  async function kundeLoeschen(id: string) {
    const bestaetigt = window.confirm('Kunden wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase.from('kunden').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (bearbeitenId === id) {
      bearbeitenAbbrechen()
    }

    ladeKunden()
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    let liste = kunden.filter((k) => {
      if (!q) return true
      return [
        k.vorname,
        k.nachname,
        k.firmenname,
        k.email,
        k.telefon,
        k.ort,
        k.plz,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })

    liste = [...liste].sort((a, b) => {
      const aName = (a.firmenname || `${a.vorname || ''} ${a.nachname || ''}`.trim()).toLowerCase()
      const bName = (b.firmenname || `${b.vorname || ''} ${b.nachname || ''}`.trim()).toLowerCase()

      if (sortierung === 'name_asc') return aName.localeCompare(bName)
      if (sortierung === 'name_desc') return bName.localeCompare(aName)
      if (sortierung === 'ort_asc') return (a.ort || '').localeCompare(b.ort || '')
      if (sortierung === 'ort_desc') return (b.ort || '').localeCompare(a.ort || '')
      return 0
    })

    return liste
  }, [kunden, suche, sortierung])

  return (
    <div className="page-card">
      <h1>Kunden</h1>

      <form onSubmit={kundeAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <input placeholder="Vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
          <input placeholder="Nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} />
          <input placeholder="Firma" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} />
          <input placeholder="Straße" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
          <input placeholder="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} />
          <input placeholder="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
          <input placeholder="Land" value={land} onChange={(e) => setLand(e.target.value)} />
          <input placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          <button type="submit">Kunde anlegen</button>
        </div>
      </form>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            placeholder="Kunden suchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
          <select value={sortierung} onChange={(e) => setSortierung(e.target.value)}>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="ort_asc">Ort A-Z</option>
            <option value="ort_desc">Ort Z-A</option>
          </select>
        </div>
      </div>

      {bearbeitenId && (
        <form onSubmit={kundeSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Kunde bearbeiten</h3>

          <div className="form-row">
            <input placeholder="Vorname" value={bearbeitenVorname} onChange={(e) => setBearbeitenVorname(e.target.value)} />
            <input placeholder="Nachname" value={bearbeitenNachname} onChange={(e) => setBearbeitenNachname(e.target.value)} />
            <input placeholder="Firma" value={bearbeitenFirmenname} onChange={(e) => setBearbeitenFirmenname(e.target.value)} />
            <input placeholder="Straße" value={bearbeitenStrasse} onChange={(e) => setBearbeitenStrasse(e.target.value)} />
            <input placeholder="PLZ" value={bearbeitenPlz} onChange={(e) => setBearbeitenPlz(e.target.value)} />
            <input placeholder="Ort" value={bearbeitenOrt} onChange={(e) => setBearbeitenOrt(e.target.value)} />
            <input placeholder="Land" value={bearbeitenLand} onChange={(e) => setBearbeitenLand(e.target.value)} />
            <input placeholder="E-Mail" value={bearbeitenEmail} onChange={(e) => setBearbeitenEmail(e.target.value)} />
            <input placeholder="Telefon" value={bearbeitenTelefon} onChange={(e) => setBearbeitenTelefon(e.target.value)} />
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
        {gefiltert.map((kunde) => (
          <div key={kunde.id} className="list-box">
            <strong>
              {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
            </strong>
            <br />
            Adresse: {[kunde.strasse, kunde.plz, kunde.ort, kunde.land].filter(Boolean).join(', ') || '-'}
            <br />
            E-Mail: {kunde.email || '-'}
            <br />
            Telefon: {kunde.telefon || '-'}
            <br />
            <a href={`/kunden/${kunde.id}`}>Zur Kundendetailseite</a>

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => bearbeitenStarten(kunde)}>
                Bearbeiten
              </button>
              <button type="button" onClick={() => kundeLoeschen(kunde.id)} style={{ background: '#dc2626' }}>
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