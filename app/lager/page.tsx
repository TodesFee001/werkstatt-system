'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/lib/useRealtimeTable'

type Artikel = {
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
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Lager', 'Werkstatt', 'Behördenvertreter']}>
      <LagerContent />
    </RoleGuard>
  )
}

function LagerContent() {
  const [artikel, setArtikel] = useState<Artikel[]>([])
  const [suche, setSuche] = useState('')

  const [artikelnummer, setArtikelnummer] = useState('')
  const [name, setName] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [bestand, setBestand] = useState('')
  const [mindestbestand, setMindestbestand] = useState('')
  const [einkaufspreis, setEinkaufspreis] = useState('')
  const [verkaufspreis, setVerkaufspreis] = useState('')
  const [lagerort, setLagerort] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)

  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState('')

  const laden = useCallback(async () => {
    const { data, error } = await supabase
      .from('lagerartikel')
      .select('*')
      .order('artikelnummer', { ascending: true })

    if (error) {
      setFehler(error.message)
      return
    }

    setArtikel((data || []) as Artikel[])
    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('lagerartikel', laden)
  useRealtimeTable('lagerbewegungen', laden)

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return artikel
      .filter((a) => {
        if (!q) return true

        return [
          a.artikelnummer,
          a.name,
          a.beschreibung,
          a.lagerort,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      })
      .sort((a, b) => Number(a.artikelnummer || 0) - Number(b.artikelnummer || 0))
  }, [artikel, suche])

  function resetForm() {
    setBearbeitenId(null)
    setArtikelnummer('')
    setName('')
    setBeschreibung('')
    setBestand('')
    setMindestbestand('')
    setEinkaufspreis('')
    setVerkaufspreis('')
    setLagerort('')
  }

  function bearbeitenStarten(a: Artikel) {
    setBearbeitenId(a.id)
    setArtikelnummer(a.artikelnummer != null ? String(a.artikelnummer) : '')
    setName(a.name || '')
    setBeschreibung(a.beschreibung || '')
    setBestand(a.bestand != null ? String(a.bestand) : '')
    setMindestbestand(a.mindestbestand != null ? String(a.mindestbestand) : '')
    setEinkaufspreis(a.einkaufspreis != null ? String(a.einkaufspreis) : '')
    setVerkaufspreis(a.verkaufspreis != null ? String(a.verkaufspreis) : '')
    setLagerort(a.lagerort || '')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!artikelnummer.trim()) {
      setFehler('Bitte Artikelnummer eingeben.')
      return
    }

    if (!name.trim()) {
      setFehler('Bitte Name eingeben.')
      return
    }

    const payload = {
      artikelnummer: Number(artikelnummer),
      name,
      beschreibung: beschreibung || null,
      bestand: Number(bestand || 0),
      mindestbestand: Number(mindestbestand || 0),
      einkaufspreis: Number(einkaufspreis || 0),
      verkaufspreis: Number(verkaufspreis || 0),
      lagerort: lagerort || null,
    }

    const res = bearbeitenId
      ? await supabase.from('lagerartikel').update(payload).eq('id', bearbeitenId)
      : await supabase.from('lagerartikel').insert(payload)

    if (res.error) {
      setFehler(res.error.message)
      return
    }

    setMeldung(bearbeitenId ? 'Artikel wurde gespeichert.' : 'Artikel wurde erstellt.')
    resetForm()
    laden()
  }

  async function loeschen(id: string) {
    const ok = window.confirm('Artikel wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('lagerartikel').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Artikel wurde gelöscht.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Lager</h1>
          <div className="topbar-subtitle">
            Live-Bestandsverwaltung nach Artikelnummer.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>
      </div>

      <form onSubmit={speichern} className="page-card">
        <h2 style={{ marginTop: 0 }}>{bearbeitenId ? 'Artikel bearbeiten' : 'Artikel anlegen'}</h2>

        <div className="form-row">
          <input placeholder="Artikelnummer" value={artikelnummer} onChange={(e) => setArtikelnummer(e.target.value)} />
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Lagerort" value={lagerort} onChange={(e) => setLagerort(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Beschreibung" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="Bestand" value={bestand} onChange={(e) => setBestand(e.target.value)} />
          <input placeholder="Mindestbestand" value={mindestbestand} onChange={(e) => setMindestbestand(e.target.value)} />
          <input placeholder="Einkaufspreis" value={einkaufspreis} onChange={(e) => setEinkaufspreis(e.target.value)} />
          <input placeholder="Verkaufspreis" value={verkaufspreis} onChange={(e) => setVerkaufspreis(e.target.value)} />
        </div>

        <div className="action-row">
          <button type="submit">{bearbeitenId ? 'Speichern' : 'Artikel erstellen'}</button>
          {bearbeitenId && (
            <button type="button" onClick={resetForm} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="page-card">
        <input placeholder="Lager durchsuchen" value={suche} onChange={(e) => setSuche(e.target.value)} />

        <div style={{ marginTop: 16 }}>
          {gefiltert.map((a) => {
            const kritisch = Number(a.bestand || 0) < Number(a.mindestbestand || 0)

            return (
              <div
                key={a.id}
                className="list-box"
                style={{
                  border: kritisch ? '2px solid #dc2626' : '2px solid #16a34a',
                  background: kritisch ? 'rgba(220,38,38,0.13)' : 'rgba(22,163,74,0.10)',
                }}
              >
                <strong>
                  {a.artikelnummer ?? '-'} – {a.name || '-'}
                </strong>
                <br />
                Beschreibung: {a.beschreibung || '-'}
                <br />
                Bestand: <strong>{Number(a.bestand || 0).toFixed(2)}</strong>
                <br />
                Mindestbestand: {Number(a.mindestbestand || 0).toFixed(2)}
                <br />
                Einkaufspreis: {Number(a.einkaufspreis || 0).toFixed(2)} €
                <br />
                Verkaufspreis: {Number(a.verkaufspreis || 0).toFixed(2)} €
                <br />
                Lagerort: {a.lagerort || '-'}
                <br />
                Status:{' '}
                <strong style={{ color: kritisch ? '#fecaca' : '#bbf7d0' }}>
                  {kritisch ? 'Mindestbestand unterschritten' : 'Bestand OK'}
                </strong>

                <div className="action-row">
                  <button type="button" onClick={() => bearbeitenStarten(a)}>
                    Bearbeiten
                  </button>
                  <button type="button" onClick={() => loeschen(a.id)} style={{ background: '#dc2626' }}>
                    Löschen
                  </button>
                </div>
              </div>
            )
          })}

          {gefiltert.length === 0 && <div className="muted">Keine Lagerartikel gefunden.</div>}
        </div>
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}