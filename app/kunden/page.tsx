'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

export default function KundenPage() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [firmenname, setFirmenname] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenVorname, setBearbeitenVorname] = useState('')
  const [bearbeitenNachname, setBearbeitenNachname] = useState('')
  const [bearbeitenFirmenname, setBearbeitenFirmenname] = useState('')

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
    ladeKunden()
  }

  function bearbeitenStarten(kunde: Kunde) {
    setBearbeitenId(kunde.id)
    setBearbeitenVorname(kunde.vorname || '')
    setBearbeitenNachname(kunde.nachname || '')
    setBearbeitenFirmenname(kunde.firmenname || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenVorname('')
    setBearbeitenNachname('')
    setBearbeitenFirmenname('')
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

    setFehler('')

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

  return (
    <div className="page-card">
      <h1>Kunden</h1>

      <form onSubmit={kundeAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <input
            placeholder="Vorname"
            value={vorname}
            onChange={(e) => setVorname(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <input
            placeholder="Nachname"
            value={nachname}
            onChange={(e) => setNachname(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <input
            placeholder="Firma"
            value={firmenname}
            onChange={(e) => setFirmenname(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <button type="submit">Kunde anlegen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={kundeSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Kunde bearbeiten</h3>

          <div className="form-row">
            <input
              placeholder="Vorname"
              value={bearbeitenVorname}
              onChange={(e) => setBearbeitenVorname(e.target.value)}
            />
            <input
              placeholder="Nachname"
              value={bearbeitenNachname}
              onChange={(e) => setBearbeitenNachname(e.target.value)}
            />
            <input
              placeholder="Firma"
              value={bearbeitenFirmenname}
              onChange={(e) => setBearbeitenFirmenname(e.target.value)}
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
        {kunden.map((kunde) => (
          <div key={kunde.id} className="list-box">
            <strong>
              {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
            </strong>

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => bearbeitenStarten(kunde)}>
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => kundeLoeschen(kunde.id)}
                style={{ background: '#dc2626' }}
              >
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