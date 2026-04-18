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

      <div>
        {kunden.map((kunde) => (
          <div key={kunde.id} className="list-box">
            {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}