'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Aufgabe = {
  id: string
  titel: string
  beschreibung: string | null
  status: string | null
  prioritaet: string | null
  faellig_am: string | null
  mitarbeiter_id: string | null
  bezug_typ: string | null
  bezug_id: string | null
}

type Mitarbeiter = {
  id: string
  vorname: string
  nachname: string
}

function AufgabenPageContent() {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])

  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [status, setStatus] = useState('offen')
  const [prioritaet, setPrioritaet] = useState('normal')
  const [faelligAm, setFaelligAm] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenTitel, setBearbeitenTitel] = useState('')
  const [bearbeitenBeschreibung, setBearbeitenBeschreibung] = useState('')
  const [bearbeitenStatus, setBearbeitenStatus] = useState('offen')
  const [bearbeitenPrioritaet, setBearbeitenPrioritaet] = useState('normal')
  const [bearbeitenFaelligAm, setBearbeitenFaelligAm] = useState('')
  const [bearbeitenMitarbeiterId, setBearbeitenMitarbeiterId] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [aufgabenRes, mitarbeiterRes] = await Promise.all([
      supabase.from('aufgaben').select('*').order('created_at', { ascending: false }),
      supabase.from('mitarbeiter').select('id, vorname, nachname'),
    ])

    const error = aufgabenRes.error || mitarbeiterRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setAufgaben(aufgabenRes.data || [])
    setMitarbeiter(mitarbeiterRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function anlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!titel.trim()) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    const { error } = await supabase.from('aufgaben').insert({
      titel: titel.trim(),
      beschreibung: beschreibung || null,
      status,
      prioritaet,
      faellig_am: faelligAm || null,
      mitarbeiter_id: mitarbeiterId || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setTitel('')
    setBeschreibung('')
    setStatus('offen')
    setPrioritaet('normal')
    setFaelligAm('')
    setMitarbeiterId('')
    ladeAlles()
  }

  function bearbeitenStarten(aufgabe: Aufgabe) {
    setBearbeitenId(aufgabe.id)
    setBearbeitenTitel(aufgabe.titel || '')
    setBearbeitenBeschreibung(aufgabe.beschreibung || '')
    setBearbeitenStatus(aufgabe.status || 'offen')
    setBearbeitenPrioritaet(aufgabe.prioritaet || 'normal')
    setBearbeitenFaelligAm(aufgabe.faellig_am || '')
    setBearbeitenMitarbeiterId(aufgabe.mitarbeiter_id || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenTitel('')
    setBearbeitenBeschreibung('')
    setBearbeitenStatus('offen')
    setBearbeitenPrioritaet('normal')
    setBearbeitenFaelligAm('')
    setBearbeitenMitarbeiterId('')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    const { error } = await supabase
      .from('aufgaben')
      .update({
        titel: bearbeitenTitel.trim(),
        beschreibung: bearbeitenBeschreibung || null,
        status: bearbeitenStatus,
        prioritaet: bearbeitenPrioritaet,
        faellig_am: bearbeitenFaelligAm || null,
        mitarbeiter_id: bearbeitenMitarbeiterId || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeAlles()
  }

  async function loeschen(id: string) {
    const bestaetigt = window.confirm('Aufgabe wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase.from('aufgaben').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  function mitarbeiterName(id: string | null) {
    if (!id) return '-'
    const person = mitarbeiter.find((m) => m.id === id)
    return person ? `${person.vorname} ${person.nachname}` : '-'
  }

  return (
    <div className="page-card">
      <h1>Aufgaben / To-dos</h1>

      <form onSubmit={anlegen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input placeholder="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="offen">offen</option>
            <option value="in_arbeit">in_arbeit</option>
            <option value="erledigt">erledigt</option>
            <option value="storniert">storniert</option>
          </select>
          <select value={prioritaet} onChange={(e) => setPrioritaet(e.target.value)}>
            <option value="niedrig">niedrig</option>
            <option value="normal">normal</option>
            <option value="hoch">hoch</option>
            <option value="kritisch">kritisch</option>
          </select>
          <input type="date" value={faelligAm} onChange={(e) => setFaelligAm(e.target.value)} />
          <select value={mitarbeiterId} onChange={(e) => setMitarbeiterId(e.target.value)}>
            <option value="">Mitarbeiter auswählen</option>
            {mitarbeiter.map((m) => (
              <option key={m.id} value={m.id}>
                {m.vorname} {m.nachname}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Beschreibung"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Aufgabe anlegen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={speichern} className="list-box" style={{ marginBottom: 20 }}>
          <div className="form-row">
            <input placeholder="Titel" value={bearbeitenTitel} onChange={(e) => setBearbeitenTitel(e.target.value)} />
            <select value={bearbeitenStatus} onChange={(e) => setBearbeitenStatus(e.target.value)}>
              <option value="offen">offen</option>
              <option value="in_arbeit">in_arbeit</option>
              <option value="erledigt">erledigt</option>
              <option value="storniert">storniert</option>
            </select>
            <select value={bearbeitenPrioritaet} onChange={(e) => setBearbeitenPrioritaet(e.target.value)}>
              <option value="niedrig">niedrig</option>
              <option value="normal">normal</option>
              <option value="hoch">hoch</option>
              <option value="kritisch">kritisch</option>
            </select>
            <input type="date" value={bearbeitenFaelligAm} onChange={(e) => setBearbeitenFaelligAm(e.target.value)} />
            <select value={bearbeitenMitarbeiterId} onChange={(e) => setBearbeitenMitarbeiterId(e.target.value)}>
              <option value="">Mitarbeiter auswählen</option>
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.vorname} {m.nachname}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Beschreibung"
              value={bearbeitenBeschreibung}
              onChange={(e) => setBearbeitenBeschreibung(e.target.value)}
              style={{ width: '100%', minHeight: 90 }}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div>
        {aufgaben.map((a) => (
          <div key={a.id} className="list-box">
            <strong>{a.titel}</strong>
            <br />
            Status: {a.status || '-'}
            <br />
            Priorität: {a.prioritaet || '-'}
            <br />
            Fällig am: {a.faellig_am || '-'}
            <br />
            Mitarbeiter: {mitarbeiterName(a.mitarbeiter_id)}
            <br />
            Beschreibung: {a.beschreibung || '-'}

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => bearbeitenStarten(a)}>
                Bearbeiten
              </button>
              <button type="button" onClick={() => loeschen(a.id)} style={{ background: '#dc2626' }}>
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

export default function AufgabenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Buchhaltung']}>
      <AufgabenPageContent />
    </RoleGuard>
  )
}