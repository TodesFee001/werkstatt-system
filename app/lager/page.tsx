'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Lagerartikel = {
  id: string
  artikelnummer: number | null
  name: string | null
  beschreibung: string | null
  bestand: number | null
  mindestbestand: number | null
  einkaufspreis: number | null
  verkaufspreis: number | null
  lagerort: string | null
}

export default function LagerPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Lager', 'Buchhaltung']}>
      <LagerPageContent />
    </RoleGuard>
  )
}

function LagerPageContent() {
  const [artikelListe, setArtikelListe] = useState<Lagerartikel[]>([])
  const [suche, setSuche] = useState('')

  const [artikelnummer, setArtikelnummer] = useState('')
  const [name, setName] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [bestand, setBestand] = useState('')
  const [mindestbestand, setMindestbestand] = useState('')
  const [einkaufspreis, setEinkaufspreis] = useState('')
  const [verkaufspreis, setVerkaufspreis] = useState('')
  const [lagerort, setLagerort] = useState('')

  const [bewegungArtikelId, setBewegungArtikelId] = useState('')
  const [bewegungArt, setBewegungArt] = useState('zugang')
  const [bewegungMenge, setBewegungMenge] = useState('')
  const [bewegungZielLagerort, setBewegungZielLagerort] = useState('')
  const [bewegungNotiz, setBewegungNotiz] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenArtikelnummer, setBearbeitenArtikelnummer] = useState('')
  const [bearbeitenName, setBearbeitenName] = useState('')
  const [bearbeitenBeschreibung, setBearbeitenBeschreibung] = useState('')
  const [bearbeitenBestand, setBearbeitenBestand] = useState('')
  const [bearbeitenMindestbestand, setBearbeitenMindestbestand] = useState('')
  const [bearbeitenEinkaufspreis, setBearbeitenEinkaufspreis] = useState('')
  const [bearbeitenVerkaufspreis, setBearbeitenVerkaufspreis] = useState('')
  const [bearbeitenLagerort, setBearbeitenLagerort] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    setFehler('')
    const { data, error } = await supabase.from('lagerartikel').select('*')

    if (error) {
      setFehler(error.message)
      return
    }

    setArtikelListe((data || []) as Lagerartikel[])
  }

  useEffect(() => {
    laden()
  }, [])

  async function erstellen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!name.trim()) {
      setFehler('Bitte einen Artikelnamen eingeben.')
      return
    }

    const { error } = await supabase.from('lagerartikel').insert({
      artikelnummer: artikelnummer ? Number(artikelnummer) : null,
      name: name.trim(),
      beschreibung: beschreibung || null,
      bestand: bestand ? Number(bestand) : 0,
      mindestbestand: mindestbestand ? Number(mindestbestand) : 0,
      einkaufspreis: einkaufspreis ? Number(einkaufspreis) : 0,
      verkaufspreis: verkaufspreis ? Number(verkaufspreis) : 0,
      lagerort: lagerort || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setArtikelnummer('')
    setName('')
    setBeschreibung('')
    setBestand('')
    setMindestbestand('')
    setEinkaufspreis('')
    setVerkaufspreis('')
    setLagerort('')
    setMeldung('Lagerartikel wurde erstellt.')
    laden()
  }

  function bearbeitenStarten(a: Lagerartikel) {
    setBearbeitenId(a.id)
    setBearbeitenArtikelnummer(
      a.artikelnummer !== null && a.artikelnummer !== undefined ? String(a.artikelnummer) : ''
    )
    setBearbeitenName(a.name || '')
    setBearbeitenBeschreibung(a.beschreibung || '')
    setBearbeitenBestand(
      a.bestand !== null && a.bestand !== undefined ? String(a.bestand) : ''
    )
    setBearbeitenMindestbestand(
      a.mindestbestand !== null && a.mindestbestand !== undefined ? String(a.mindestbestand) : ''
    )
    setBearbeitenEinkaufspreis(
      a.einkaufspreis !== null && a.einkaufspreis !== undefined ? String(a.einkaufspreis) : ''
    )
    setBearbeitenVerkaufspreis(
      a.verkaufspreis !== null && a.verkaufspreis !== undefined ? String(a.verkaufspreis) : ''
    )
    setBearbeitenLagerort(a.lagerort || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenArtikelnummer('')
    setBearbeitenName('')
    setBearbeitenBeschreibung('')
    setBearbeitenBestand('')
    setBearbeitenMindestbestand('')
    setBearbeitenEinkaufspreis('')
    setBearbeitenVerkaufspreis('')
    setBearbeitenLagerort('')
  }

  async function bearbeitenSpeichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!bearbeitenId) return

    if (!bearbeitenName.trim()) {
      setFehler('Bitte einen Artikelnamen eingeben.')
      return
    }

    const { error } = await supabase
      .from('lagerartikel')
      .update({
        artikelnummer: bearbeitenArtikelnummer ? Number(bearbeitenArtikelnummer) : null,
        name: bearbeitenName.trim(),
        beschreibung: bearbeitenBeschreibung || null,
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
    setMeldung('Lagerartikel wurde gespeichert.')
    laden()
  }

  async function loeschen(id: string) {
    setFehler('')
    setMeldung('')

    const ok = window.confirm('Lagerartikel wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('lagerartikel').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Lagerartikel wurde gelöscht.')
    laden()
  }

  async function bestandAnpassen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!bewegungArtikelId) {
      setFehler('Bitte einen Artikel auswählen.')
      return
    }

    if (!bewegungMenge) {
      setFehler('Bitte eine Menge eingeben.')
      return
    }

    const mengeNum = Number(bewegungMenge)
    const gefundenerArtikel = artikelListe.find((a) => a.id === bewegungArtikelId)

    if (!gefundenerArtikel) {
      setFehler('Artikel nicht gefunden.')
      return
    }

    let neuerBestand = Number(gefundenerArtikel.bestand || 0)
    let neuerLagerort = gefundenerArtikel.lagerort || null

    if (bewegungArt === 'zugang') {
      neuerBestand += mengeNum
    } else if (bewegungArt === 'entnahme') {
      neuerBestand -= mengeNum
    } else if (bewegungArt === 'manuell') {
      neuerBestand = mengeNum
    } else if (bewegungArt === 'umdisponierung') {
      neuerLagerort = bewegungZielLagerort || neuerLagerort
    }

    const { error: updateError } = await supabase
      .from('lagerartikel')
      .update({
        bestand: neuerBestand,
        lagerort: neuerLagerort,
      })
      .eq('id', bewegungArtikelId)

    if (updateError) {
      setFehler(updateError.message)
      return
    }

    await supabase.from('lagerbewegungen').insert({
      lagerartikel_id: bewegungArtikelId,
      bewegungsart: bewegungArt,
      menge: mengeNum,
      notiz: bewegungNotiz || null,
      referenz_typ: 'manuell',
      referenz_id: null,
    })

    setBewegungArtikelId('')
    setBewegungArt('zugang')
    setBewegungMenge('')
    setBewegungZielLagerort('')
    setBewegungNotiz('')
    setMeldung('Bestandsbewegung wurde gespeichert.')
    laden()
  }

  const sortiert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return [...artikelListe]
      .filter((a) => {
        if (!q) return true
        return [a.name, a.beschreibung, a.artikelnummer, a.lagerort]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      })
      .sort((a, b) => Number(a.artikelnummer || 0) - Number(b.artikelnummer || 0))
  }, [artikelListe, suche])

  return (
    <div className="page-card">
      <h1>Lager</h1>

      <form onSubmit={erstellen} className="list-box" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Neuen Lagerartikel anlegen</h3>

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
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Beschreibung"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            placeholder="Bestand"
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
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            placeholder="Lagerort"
            value={lagerort}
            onChange={(e) => setLagerort(e.target.value)}
          />
        </div>

        <div className="action-row">
          <button type="submit">Artikel anlegen</button>
        </div>
      </form>

      <form onSubmit={bestandAnpassen} className="list-box" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Bestandsanpassung</h3>

        <div className="form-row">
          <select
            value={bewegungArtikelId}
            onChange={(e) => setBewegungArtikelId(e.target.value)}
          >
            <option value="">Artikel auswählen</option>
            {artikelListe
              .sort((a, b) => Number(a.artikelnummer || 0) - Number(b.artikelnummer || 0))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.artikelnummer || '-'} – {a.name || '-'}
                </option>
              ))}
          </select>

          <select value={bewegungArt} onChange={(e) => setBewegungArt(e.target.value)}>
            <option value="zugang">Bestand hinzufügen</option>
            <option value="entnahme">Bestand entfernen</option>
            <option value="manuell">Bestand manuell setzen</option>
            <option value="umdisponierung">In anderes Lager umdisponieren</option>
          </select>

          <input
            placeholder="Menge"
            value={bewegungMenge}
            onChange={(e) => setBewegungMenge(e.target.value)}
          />
        </div>

        {bewegungArt === 'umdisponierung' && (
          <div className="form-row" style={{ marginTop: 12 }}>
            <input
              placeholder="Ziel-Lagerort"
              value={bewegungZielLagerort}
              onChange={(e) => setBewegungZielLagerort(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Notiz"
            value={bewegungNotiz}
            onChange={(e) => setBewegungNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 70 }}
          />
        </div>

        <div className="action-row">
          <button type="submit">Bestandsbewegung speichern</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={bearbeitenSpeichern} className="list-box" style={{ marginBottom: 18 }}>
          <h3 style={{ marginTop: 0 }}>Lagerartikel bearbeiten</h3>

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
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Beschreibung"
              value={bearbeitenBeschreibung}
              onChange={(e) => setBearbeitenBeschreibung(e.target.value)}
              style={{ width: '100%', minHeight: 80 }}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
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
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <input
              placeholder="Lagerort"
              value={bearbeitenLagerort}
              onChange={(e) => setBearbeitenLagerort(e.target.value)}
            />
          </div>

          <div className="action-row">
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          placeholder="Lager durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
      </div>

      {sortiert.map((a) => {
        const bestandOk = Number(a.bestand || 0) >= Number(a.mindestbestand || 0)

        return (
          <div
            key={a.id}
            className="list-box"
            style={{
              background: bestandOk ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)',
              border: `2px solid ${bestandOk ? '#16a34a' : '#dc2626'}`,
            }}
          >
            <strong>
              {a.artikelnummer || '-'} – {a.name || '-'}
            </strong>
            <br />
            Beschreibung: {a.beschreibung || '-'}
            <br />
            Bestand: {Number(a.bestand || 0).toFixed(2)}
            <br />
            Mindestbestand: {Number(a.mindestbestand || 0).toFixed(2)}
            <br />
            Einkaufspreis: {Number(a.einkaufspreis || 0).toFixed(2)} €
            <br />
            Verkaufspreis: {Number(a.verkaufspreis || 0).toFixed(2)} €
            <br />
            Lagerort: {a.lagerort || '-'}
            <div className="action-row" style={{ marginTop: 10 }}>
              <button type="button" onClick={() => bearbeitenStarten(a)}>
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => loeschen(a.id)}
                style={{ background: '#dc2626' }}
              >
                Löschen
              </button>
            </div>
          </div>
        )
      })}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}