'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Arbeitsplatz = {
  id: string
  name: string
  typ: string | null
  aktiv: boolean | null
}

export default function ArbeitsplaetzePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Behördenvertreter']}>
      <ArbeitsplaetzePageContent />
    </RoleGuard>
  )
}

function ArbeitsplaetzePageContent() {
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])
  const [name, setName] = useState('')
  const [typ, setTyp] = useState('Hebebühne')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenName, setBearbeitenName] = useState('')
  const [bearbeitenTyp, setBearbeitenTyp] = useState('Hebebühne')
  const [bearbeitenAktiv, setBearbeitenAktiv] = useState(true)

  const [fehler, setFehler] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('arbeitsplaetze')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setArbeitsplaetze(data || [])
  }

  useEffect(() => {
    laden()
  }, [])

  async function anlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!name.trim()) {
      setFehler('Bitte einen Namen eingeben.')
      return
    }

    const { error } = await supabase.from('arbeitsplaetze').insert({
      name: name.trim(),
      typ: typ || null,
      aktiv: true,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setName('')
    setTyp('Hebebühne')
    laden()
  }

  function bearbeitenStarten(a: Arbeitsplatz) {
    setBearbeitenId(a.id)
    setBearbeitenName(a.name)
    setBearbeitenTyp(a.typ || 'Hebebühne')
    setBearbeitenAktiv(Boolean(a.aktiv))
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenName('')
    setBearbeitenTyp('Hebebühne')
    setBearbeitenAktiv(true)
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    const { error } = await supabase
      .from('arbeitsplaetze')
      .update({
        name: bearbeitenName.trim(),
        typ: bearbeitenTyp || null,
        aktiv: bearbeitenAktiv,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    laden()
  }

  async function loeschen(id: string) {
    const ok = window.confirm('Arbeitsplatz wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('arbeitsplaetze').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    laden()
  }

  return (
    <div className="page-card">
      <h1>Arbeitsplätze / Hebebühnen</h1>

      <form onSubmit={anlegen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select value={typ} onChange={(e) => setTyp(e.target.value)}>
            <option value="Hebebühne">Hebebühne</option>
            <option value="Diagnoseplatz">Diagnoseplatz</option>
            <option value="Waschplatz">Waschplatz</option>
            <option value="Werkbank">Werkbank</option>
            <option value="Sonstiges">Sonstiges</option>
          </select>
        </div>

        <div className="action-row">
          <button type="submit">Arbeitsplatz anlegen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={speichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Arbeitsplatz bearbeiten</h3>

          <div className="form-row">
            <input
              placeholder="Name"
              value={bearbeitenName}
              onChange={(e) => setBearbeitenName(e.target.value)}
            />

            <select
              value={bearbeitenTyp}
              onChange={(e) => setBearbeitenTyp(e.target.value)}
            >
              <option value="Hebebühne">Hebebühne</option>
              <option value="Diagnoseplatz">Diagnoseplatz</option>
              <option value="Waschplatz">Waschplatz</option>
              <option value="Werkbank">Werkbank</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>

            <select
              value={bearbeitenAktiv ? 'ja' : 'nein'}
              onChange={(e) => setBearbeitenAktiv(e.target.value === 'ja')}
            >
              <option value="ja">aktiv</option>
              <option value="nein">inaktiv</option>
            </select>
          </div>

          <div className="action-row">
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {arbeitsplaetze.map((a) => (
        <div key={a.id} className="list-box">
          <strong>{a.name}</strong>
          <br />
          Typ: {a.typ || '-'}
          <br />
          Aktiv: {a.aktiv ? 'ja' : 'nein'}

          <div className="action-row">
            <button type="button" onClick={() => bearbeitenStarten(a)}>
              Bearbeiten
            </button>
            <button type="button" onClick={() => loeschen(a.id)} style={{ background: '#dc2626' }}>
              Löschen
            </button>
          </div>
        </div>
      ))}

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}