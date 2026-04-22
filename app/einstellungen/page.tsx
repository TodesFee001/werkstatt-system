'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Rang = {
  id: string
  name: string
  beschreibung: string | null
}

type Qualifikation = {
  id: string
  name: string
  beschreibung: string | null
}

function EinstellungenPageContent() {
  const [raenge, setRaenge] = useState<Rang[]>([])
  const [qualifikationen, setQualifikationen] = useState<Qualifikation[]>([])

  const [rangName, setRangName] = useState('')
  const [rangBeschreibung, setRangBeschreibung] = useState('')

  const [qualiName, setQualiName] = useState('')
  const [qualiBeschreibung, setQualiBeschreibung] = useState('')

  const [bearbeitenRangId, setBearbeitenRangId] = useState<string | null>(null)
  const [bearbeitenRangName, setBearbeitenRangName] = useState('')
  const [bearbeitenRangBeschreibung, setBearbeitenRangBeschreibung] = useState('')

  const [bearbeitenQualiId, setBearbeitenQualiId] = useState<string | null>(null)
  const [bearbeitenQualiName, setBearbeitenQualiName] = useState('')
  const [bearbeitenQualiBeschreibung, setBearbeitenQualiBeschreibung] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: rData, error: rError } = await supabase
      .from('raenge')
      .select('*')
      .order('name', { ascending: true })

    const { data: qData, error: qError } = await supabase
      .from('qualifikationen')
      .select('*')
      .order('name', { ascending: true })

    if (rError || qError) {
      setFehler(rError?.message || qError?.message || 'Fehler')
      return
    }

    setRaenge(rData || [])
    setQualifikationen(qData || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function rangAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!rangName.trim()) {
      setFehler('Bitte einen Rangnamen eingeben.')
      return
    }

    const { error } = await supabase.from('raenge').insert({
      name: rangName.trim(),
      beschreibung: rangBeschreibung || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setRangName('')
    setRangBeschreibung('')
    ladeAlles()
  }

  async function qualiAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!qualiName.trim()) {
      setFehler('Bitte einen Qualifikationsnamen eingeben.')
      return
    }

    const { error } = await supabase.from('qualifikationen').insert({
      name: qualiName.trim(),
      beschreibung: qualiBeschreibung || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setQualiName('')
    setQualiBeschreibung('')
    ladeAlles()
  }

  function rangBearbeitenStarten(rang: Rang) {
    setBearbeitenRangId(rang.id)
    setBearbeitenRangName(rang.name || '')
    setBearbeitenRangBeschreibung(rang.beschreibung || '')
  }

  function rangBearbeitenAbbrechen() {
    setBearbeitenRangId(null)
    setBearbeitenRangName('')
    setBearbeitenRangBeschreibung('')
  }

  async function rangSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenRangId) return

    const { error } = await supabase
      .from('raenge')
      .update({
        name: bearbeitenRangName.trim(),
        beschreibung: bearbeitenRangBeschreibung || null,
      })
      .eq('id', bearbeitenRangId)

    if (error) {
      setFehler(error.message)
      return
    }

    rangBearbeitenAbbrechen()
    ladeAlles()
  }

  async function rangLoeschen(id: string) {
    const bestaetigt = window.confirm('Rang wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase.from('raenge').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (bearbeitenRangId === id) {
      rangBearbeitenAbbrechen()
    }

    ladeAlles()
  }

  function qualiBearbeitenStarten(quali: Qualifikation) {
    setBearbeitenQualiId(quali.id)
    setBearbeitenQualiName(quali.name || '')
    setBearbeitenQualiBeschreibung(quali.beschreibung || '')
  }

  function qualiBearbeitenAbbrechen() {
    setBearbeitenQualiId(null)
    setBearbeitenQualiName('')
    setBearbeitenQualiBeschreibung('')
  }

  async function qualiSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenQualiId) return

    const { error } = await supabase
      .from('qualifikationen')
      .update({
        name: bearbeitenQualiName.trim(),
        beschreibung: bearbeitenQualiBeschreibung || null,
      })
      .eq('id', bearbeitenQualiId)

    if (error) {
      setFehler(error.message)
      return
    }

    qualiBearbeitenAbbrechen()
    ladeAlles()
  }

  async function qualiLoeschen(id: string) {
    const bestaetigt = window.confirm('Qualifikation wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase
      .from('qualifikationen')
      .delete()
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (bearbeitenQualiId === id) {
      qualiBearbeitenAbbrechen()
    }

    ladeAlles()
  }

  return (
    <div className="page-card">
      <h1>Einstellungen</h1>

      <h2>Ränge</h2>

      <form onSubmit={rangAnlegen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            placeholder="Rangname"
            value={rangName}
            onChange={(e) => setRangName(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <input
            placeholder="Beschreibung"
            value={rangBeschreibung}
            onChange={(e) => setRangBeschreibung(e.target.value)}
            style={{ minWidth: 300 }}
          />
          <button type="submit">Rang anlegen</button>
        </div>
      </form>

      {bearbeitenRangId && (
        <form onSubmit={rangSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Rang bearbeiten</h3>

          <div className="form-row">
            <input
              placeholder="Rangname"
              value={bearbeitenRangName}
              onChange={(e) => setBearbeitenRangName(e.target.value)}
            />
            <input
              placeholder="Beschreibung"
              value={bearbeitenRangBeschreibung}
              onChange={(e) => setBearbeitenRangBeschreibung(e.target.value)}
              style={{ minWidth: 300 }}
            />
          </div>

          <div className="form-row">
            <button type="submit">Speichern</button>
            <button
              type="button"
              onClick={rangBearbeitenAbbrechen}
              style={{ background: '#6b7280' }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div style={{ marginBottom: 32 }}>
        {raenge.map((rang) => (
          <div key={rang.id} className="list-box">
            <strong>{rang.name}</strong>
            <br />
            {rang.beschreibung || '-'}

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => rangBearbeitenStarten(rang)}>
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => rangLoeschen(rang.id)}
                style={{ background: '#dc2626' }}
              >
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2>Qualifikationen</h2>

      <form onSubmit={qualiAnlegen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            placeholder="Qualifikationsname"
            value={qualiName}
            onChange={(e) => setQualiName(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <input
            placeholder="Beschreibung"
            value={qualiBeschreibung}
            onChange={(e) => setQualiBeschreibung(e.target.value)}
            style={{ minWidth: 300 }}
          />
          <button type="submit">Qualifikation anlegen</button>
        </div>
      </form>

      {bearbeitenQualiId && (
        <form onSubmit={qualiSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Qualifikation bearbeiten</h3>

          <div className="form-row">
            <input
              placeholder="Qualifikationsname"
              value={bearbeitenQualiName}
              onChange={(e) => setBearbeitenQualiName(e.target.value)}
            />
            <input
              placeholder="Beschreibung"
              value={bearbeitenQualiBeschreibung}
              onChange={(e) => setBearbeitenQualiBeschreibung(e.target.value)}
              style={{ minWidth: 300 }}
            />
          </div>

          <div className="form-row">
            <button type="submit">Speichern</button>
            <button
              type="button"
              onClick={qualiBearbeitenAbbrechen}
              style={{ background: '#6b7280' }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div>
        {qualifikationen.map((quali) => (
          <div key={quali.id} className="list-box">
            <strong>{quali.name}</strong>
            <br />
            {quali.beschreibung || '-'}

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => qualiBearbeitenStarten(quali)}>
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => qualiLoeschen(quali.id)}
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

export default function EinstellungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <EinstellungenPageContent />
    </RoleGuard>
  )
}