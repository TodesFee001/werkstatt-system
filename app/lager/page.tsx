'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Lagerartikel = {
  id: string
  artikelnummer: string | null
  name: string
  beschreibung: string | null
  einheit: string | null
  bestand: number | null
  mindestbestand: number | null
  einkaufspreis: number | null
  verkaufspreis: number | null
  lagerort: string | null
  aktiv: boolean | null
}

type Lagerbewegung = {
  id: string
  lagerartikel_id: string
  bewegungstyp: string
  menge: number
  notiz: string | null
  created_at: string
}

function LagerPageContent() {
  const [artikel, setArtikel] = useState<Lagerartikel[]>([])
  const [bewegungen, setBewegungen] = useState<Lagerbewegung[]>([])

  const [artikelnummer, setArtikelnummer] = useState('')
  const [name, setName] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [einheit, setEinheit] = useState('Stk')
  const [bestand, setBestand] = useState('')
  const [mindestbestand, setMindestbestand] = useState('')
  const [einkaufspreis, setEinkaufspreis] = useState('')
  const [verkaufspreis, setVerkaufspreis] = useState('')
  const [lagerort, setLagerort] = useState('')

  const [bewegungArtikelId, setBewegungArtikelId] = useState('')
  const [bewegungstyp, setBewegungstyp] = useState('zugang')
  const [bewegungMenge, setBewegungMenge] = useState('')
  const [bewegungNotiz, setBewegungNotiz] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenArtikelnummer, setBearbeitenArtikelnummer] = useState('')
  const [bearbeitenName, setBearbeitenName] = useState('')
  const [bearbeitenBeschreibung, setBearbeitenBeschreibung] = useState('')
  const [bearbeitenEinheit, setBearbeitenEinheit] = useState('Stk')
  const [bearbeitenBestand, setBearbeitenBestand] = useState('')
  const [bearbeitenMindestbestand, setBearbeitenMindestbestand] = useState('')
  const [bearbeitenEinkaufspreis, setBearbeitenEinkaufspreis] = useState('')
  const [bearbeitenVerkaufspreis, setBearbeitenVerkaufspreis] = useState('')
  const [bearbeitenLagerort, setBearbeitenLagerort] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: artikelData, error: artikelError } = await supabase
      .from('lagerartikel')
      .select('*')
      .order('name', { ascending: true })

    const { data: bewegungData, error: bewegungError } = await supabase
      .from('lagerbewegungen')
      .select('*')
      .order('created_at', { ascending: false })

    if (artikelError || bewegungError) {
      setFehler(artikelError?.message || bewegungError?.message || 'Fehler')
      return
    }

    setArtikel(artikelData || [])
    setBewegungen(bewegungData || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function artikelAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!name.trim()) {
      setFehler('Bitte einen Artikelnamen eingeben.')
      return
    }

    const { error } = await supabase.from('lagerartikel').insert({
      artikelnummer: artikelnummer || null,
      name: name.trim(),
      beschreibung: beschreibung || null,
      einheit: einheit || 'Stk',
      bestand: bestand ? Number(bestand) : 0,
      mindestbestand: mindestbestand ? Number(mindestbestand) : 0,
      einkaufspreis: einkaufspreis ? Number(einkaufspreis) : 0,
      verkaufspreis: verkaufspreis ? Number(verkaufspreis) : 0,
      lagerort: lagerort || null,
      aktiv: true,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setArtikelnummer('')
    setName('')
    setBeschreibung('')
    setEinheit('Stk')
    setBestand('')
    setMindestbestand('')
    setEinkaufspreis('')
    setVerkaufspreis('')
    setLagerort('')

    ladeAlles()
  }

  async function bewegungBuchen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!bewegungArtikelId) {
      setFehler('Bitte einen Artikel auswählen.')
      return
    }

    if (!bewegungMenge) {
      setFehler('Bitte eine Menge eingeben.')
      return
    }

    const menge = Number(bewegungMenge)
    const artikelEintrag = artikel.find((a) => a.id === bewegungArtikelId)

    if (!artikelEintrag) {
      setFehler('Artikel nicht gefunden.')
      return
    }

    let neuerBestand = Number(artikelEintrag.bestand || 0)

    if (bewegungstyp === 'zugang') {
      neuerBestand += menge
    } else if (bewegungstyp === 'abgang') {
      neuerBestand -= menge
    } else if (bewegungstyp === 'korrektur') {
      neuerBestand = menge
    }

    if (neuerBestand < 0) {
      setFehler('Bestand darf nicht negativ werden.')
      return
    }

    const { error: bewegungError } = await supabase.from('lagerbewegungen').insert({
      lagerartikel_id: bewegungArtikelId,
      bewegungstyp,
      menge,
      notiz: bewegungNotiz || null,
    })

    if (bewegungError) {
      setFehler(bewegungError.message)
      return
    }

    const { error: artikelError } = await supabase
      .from('lagerartikel')
      .update({
        bestand: neuerBestand,
      })
      .eq('id', bewegungArtikelId)

    if (artikelError) {
      setFehler(artikelError.message)
      return
    }

    setBewegungArtikelId('')
    setBewegungstyp('zugang')
    setBewegungMenge('')
    setBewegungNotiz('')

    ladeAlles()
  }

  function bearbeitenStarten(a: Lagerartikel) {
    setBearbeitenId(a.id)
    setBearbeitenArtikelnummer(a.artikelnummer || '')
    setBearbeitenName(a.name || '')
    setBearbeitenBeschreibung(a.beschreibung || '')
    setBearbeitenEinheit(a.einheit || 'Stk')
    setBearbeitenBestand(String(a.bestand ?? ''))
    setBearbeitenMindestbestand(String(a.mindestbestand ?? ''))
    setBearbeitenEinkaufspreis(String(a.einkaufspreis ?? ''))
    setBearbeitenVerkaufspreis(String(a.verkaufspreis ?? ''))
    setBearbeitenLagerort(a.lagerort || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenArtikelnummer('')
    setBearbeitenName('')
    setBearbeitenBeschreibung('')
    setBearbeitenEinheit('Stk')
    setBearbeitenBestand('')
    setBearbeitenMindestbestand('')
    setBearbeitenEinkaufspreis('')
    setBearbeitenVerkaufspreis('')
    setBearbeitenLagerort('')
  }

  async function artikelSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    const { error } = await supabase
      .from('lagerartikel')
      .update({
        artikelnummer: bearbeitenArtikelnummer || null,
        name: bearbeitenName.trim(),
        beschreibung: bearbeitenBeschreibung || null,
        einheit: bearbeitenEinheit || 'Stk',
        bestand: bearbeitenBestand ? Number(bearbeitenBestand) : 0,
        mindestbestand: bearbeitenMindestbestand ? Number(bearbeitenMindestbestand) : 0,
        einkaufspreis: bearbeitenEinkaufspreis ? Number(bearbeitenEinkaufspreis) : 0,
        verkaufspreis: bearbeitenVerkaufspreis ? Number(bearbeitenVerkaufspreis) : 0,
        lagerort: bearbeitenLagerort || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeAlles()
  }

  async function artikelLoeschen(id: string) {
    const bestaetigt = window.confirm('Artikel wirklich löschen?')
    if (!bestaetigt) return

    await supabase.from('lagerbewegungen').delete().eq('lagerartikel_id', id)

    const { error } = await supabase.from('lagerartikel').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (bearbeitenId === id) {
      bearbeitenAbbrechen()
    }

    ladeAlles()
  }

  function artikelName(id: string) {
    return artikel.find((a) => a.id === id)?.name || 'Unbekannt'
  }

  function istMindestbestandUnterschritten(a: Lagerartikel) {
    return Number(a.bestand || 0) <= Number(a.mindestbestand || 0)
  }

  return (
    <div className="page-card">
      <h1>Lager</h1>

      <form onSubmit={artikelAnlegen} className="list-box" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Artikel anlegen</h3>

        <div className="form-row">
          <input
            placeholder="Artikelnummer"
            value={artikelnummer}
            onChange={(e) => setArtikelnummer(e.target.value)}
          />
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Beschreibung"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
          />
          <input
            placeholder="Einheit"
            value={einheit}
            onChange={(e) => setEinheit(e.target.value)}
          />
          <input
            placeholder="Startbestand"
            value={bestand}
            onChange={(e) => setBestand(e.target.value)}
          />
          <input
            placeholder="Mindestbestand"
            value={mindestbestand}
            onChange={(e) => setMindestbestand(e.target.value)}
          />
          <input
            placeholder="Einkaufspreis"
            value={einkaufspreis}
            onChange={(e) => setEinkaufspreis(e.target.value)}
          />
          <input
            placeholder="Verkaufspreis"
            value={verkaufspreis}
            onChange={(e) => setVerkaufspreis(e.target.value)}
          />
          <input
            placeholder="Lagerort"
            value={lagerort}
            onChange={(e) => setLagerort(e.target.value)}
          />

          <button type="submit">Artikel anlegen</button>
        </div>
      </form>

      <form onSubmit={bewegungBuchen} className="list-box" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Lagerbewegung buchen</h3>

        <div className="form-row">
          <select
            value={bewegungArtikelId}
            onChange={(e) => setBewegungArtikelId(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Artikel auswählen</option>
            {artikel.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.bestand ?? 0} {a.einheit || 'Stk'})
              </option>
            ))}
          </select>

          <select
            value={bewegungstyp}
            onChange={(e) => setBewegungstyp(e.target.value)}
          >
            <option value="zugang">zugang</option>
            <option value="abgang">abgang</option>
            <option value="korrektur">korrektur</option>
          </select>

          <input
            placeholder="Menge"
            value={bewegungMenge}
            onChange={(e) => setBewegungMenge(e.target.value)}
          />

          <input
            placeholder="Notiz"
            value={bewegungNotiz}
            onChange={(e) => setBewegungNotiz(e.target.value)}
            style={{ minWidth: 260 }}
          />

          <button type="submit">Bewegung buchen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={artikelSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Artikel bearbeiten</h3>

          <div className="form-row">
            <input
              placeholder="Artikelnummer"
              value={bearbeitenArtikelnummer}
              onChange={(e) => setBearbeitenArtikelnummer(e.target.value)}
            />
            <input
              placeholder="Name"
              value={bearbeitenName}
              onChange={(e) => setBearbeitenName(e.target.value)}
            />
            <input
              placeholder="Beschreibung"
              value={bearbeitenBeschreibung}
              onChange={(e) => setBearbeitenBeschreibung(e.target.value)}
            />
            <input
              placeholder="Einheit"
              value={bearbeitenEinheit}
              onChange={(e) => setBearbeitenEinheit(e.target.value)}
            />
            <input
              placeholder="Bestand"
              value={bearbeitenBestand}
              onChange={(e) => setBearbeitenBestand(e.target.value)}
            />
            <input
              placeholder="Mindestbestand"
              value={bearbeitenMindestbestand}
              onChange={(e) => setBearbeitenMindestbestand(e.target.value)}
            />
            <input
              placeholder="Einkaufspreis"
              value={bearbeitenEinkaufspreis}
              onChange={(e) => setBearbeitenEinkaufspreis(e.target.value)}
            />
            <input
              placeholder="Verkaufspreis"
              value={bearbeitenVerkaufspreis}
              onChange={(e) => setBearbeitenVerkaufspreis(e.target.value)}
            />
            <input
              placeholder="Lagerort"
              value={bearbeitenLagerort}
              onChange={(e) => setBearbeitenLagerort(e.target.value)}
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

      <h2>Artikel</h2>
      <div style={{ marginBottom: 24 }}>
        {artikel.map((a) => (
          <div key={a.id} className="list-box">
            <strong>{a.name}</strong>
            <br />
            Artikelnummer: {a.artikelnummer || '-'}
            <br />
            Beschreibung: {a.beschreibung || '-'}
            <br />
            Bestand: {a.bestand ?? 0} {a.einheit || 'Stk'}
            <br />
            Mindestbestand: {a.mindestbestand ?? 0}
            <br />
            Einkaufspreis: {a.einkaufspreis ?? 0} €
            <br />
            Verkaufspreis: {a.verkaufspreis ?? 0} €
            <br />
            Lagerort: {a.lagerort || '-'}

            {istMindestbestandUnterschritten(a) && (
              <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 700 }}>
                Mindestbestand erreicht oder unterschritten
              </div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => bearbeitenStarten(a)}>
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => artikelLoeschen(a.id)}
                style={{ background: '#dc2626' }}
              >
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2>Lagerbewegungen</h2>
      <div>
        {bewegungen.map((b) => (
          <div key={b.id} className="list-box">
            <strong>{artikelName(b.lagerartikel_id)}</strong>
            <br />
            Typ: {b.bewegungstyp}
            <br />
            Menge: {b.menge}
            <br />
            Notiz: {b.notiz || '-'}
            <br />
            Datum: {new Date(b.created_at).toLocaleString()}
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function LagerPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Lager']}>
      <LagerPageContent />
    </RoleGuard>
  )
}