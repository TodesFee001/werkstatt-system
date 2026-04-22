'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Mitarbeiter = {
  id: string
  vorname: string | null
  nachname: string | null
}

type Schicht = {
  id: string
  mitarbeiter_id: string
  datum: string
  startzeit: string
  endzeit: string
  notiz: string | null
}

export default function SchichtenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme']}>
      <SchichtenPageContent />
    </RoleGuard>
  )
}

function SchichtenPageContent() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [schichten, setSchichten] = useState<Schicht[]>([])

  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [startzeit, setStartzeit] = useState('08:00')
  const [endzeit, setEndzeit] = useState('17:00')
  const [notiz, setNotiz] = useState('')

  const [fehler, setFehler] = useState('')

  async function laden() {
    const [mRes, sRes] = await Promise.all([
      supabase.from('mitarbeiter').select('id, vorname, nachname'),
      supabase.from('mitarbeiter_schichten').select('*').order('datum').order('startzeit'),
    ])

    if (mRes.error || sRes.error) {
      setFehler(mRes.error?.message || sRes.error?.message || '')
      return
    }

    setMitarbeiter(mRes.data || [])
    setSchichten(sRes.data || [])
  }

  useEffect(() => {
    laden()
  }, [])

  async function anlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!mitarbeiterId) {
      setFehler('Bitte einen Mitarbeiter auswählen.')
      return
    }

    const { error } = await supabase.from('mitarbeiter_schichten').insert({
      mitarbeiter_id: mitarbeiterId,
      datum,
      startzeit,
      endzeit,
      notiz: notiz || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setMitarbeiterId('')
    setDatum(new Date().toISOString().slice(0, 10))
    setStartzeit('08:00')
    setEndzeit('17:00')
    setNotiz('')
    laden()
  }

  async function loeschen(id: string) {
    const ok = window.confirm('Schicht wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('mitarbeiter_schichten').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    laden()
  }

  function mitarbeiterName(id: string) {
    const person = mitarbeiter.find((m) => m.id === id)
    return person ? `${person.vorname || ''} ${person.nachname || ''}`.trim() : id
  }

  return (
    <div className="page-card">
      <h1>Mitarbeiter-Schichten</h1>

      <form onSubmit={anlegen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <select value={mitarbeiterId} onChange={(e) => setMitarbeiterId(e.target.value)}>
            <option value="">Mitarbeiter auswählen</option>
            {mitarbeiter.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
              </option>
            ))}
          </select>

          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          <input type="time" value={startzeit} onChange={(e) => setStartzeit(e.target.value)} />
          <input type="time" value={endzeit} onChange={(e) => setEndzeit(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Notiz"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div className="action-row">
          <button type="submit">Schicht anlegen</button>
        </div>
      </form>

      {schichten.map((s) => (
        <div key={s.id} className="list-box">
          <strong>{mitarbeiterName(s.mitarbeiter_id)}</strong>
          <br />
          Datum: {s.datum}
          <br />
          Zeit: {s.startzeit} - {s.endzeit}
          <br />
          Notiz: {s.notiz || '-'}

          <div className="action-row">
            <button type="button" onClick={() => loeschen(s.id)} style={{ background: '#dc2626' }}>
              Löschen
            </button>
          </div>
        </div>
      ))}

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}