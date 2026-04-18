'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '@/components/RoleGuard'

type Mitarbeiter = {
  id: string
  mitarbeiternummer: string | null
  vorname: string
  nachname: string
  email: string | null
  telefon: string | null
  eintrittsdatum: string | null
  status: string | null
  rang_id: string | null
}

type Rang = {
  id: string
  name: string
}

type Qualifikation = {
  id: string
  name: string
}

type MitarbeiterQualifikation = {
  id: string
  mitarbeiter_id: string
  qualifikation_id: string
}

function MitarbeiterPageContent() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [raenge, setRaenge] = useState<Rang[]>([])
  const [qualifikationen, setQualifikationen] = useState<Qualifikation[]>([])
  const [mitarbeiterQualifikationen, setMitarbeiterQualifikationen] = useState<MitarbeiterQualifikation[]>([])

  const [mitarbeiternummer, setMitarbeiternummer] = useState('')
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [eintrittsdatum, setEintrittsdatum] = useState('')
  const [status, setStatus] = useState('aktiv')
  const [rangId, setRangId] = useState('')
  const [gewaehlteQualifikationen, setGewaehlteQualifikationen] = useState<string[]>([])

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: mData, error: mError } = await supabase
      .from('mitarbeiter')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: rData, error: rError } = await supabase
      .from('raenge')
      .select('*')
      .order('name', { ascending: true })

    const { data: qData, error: qError } = await supabase
      .from('qualifikationen')
      .select('*')
      .order('name', { ascending: true })

    const { data: mqData, error: mqError } = await supabase
      .from('mitarbeiter_qualifikationen')
      .select('*')

    if (mError || rError || qError || mqError) {
      setFehler(mError?.message || rError?.message || qError?.message || mqError?.message || 'Fehler')
      return
    }

    setMitarbeiter(mData || [])
    setRaenge(rData || [])
    setQualifikationen(qData || [])
    setMitarbeiterQualifikationen(mqData || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  function toggleQualifikation(id: string) {
    setGewaehlteQualifikationen((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    )
  }

  async function mitarbeiterAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!vorname || !nachname) {
      setFehler('Vorname und Nachname sind Pflichtfelder.')
      return
    }

    const { data: neuerMitarbeiter, error } = await supabase
      .from('mitarbeiter')
      .insert({
        mitarbeiternummer: mitarbeiternummer || null,
        vorname,
        nachname,
        email: email || null,
        telefon: telefon || null,
        eintrittsdatum: eintrittsdatum || null,
        status,
        rang_id: rangId || null,
      })
      .select()
      .single()

    if (error) {
      setFehler(error.message)
      return
    }

    if (gewaehlteQualifikationen.length > 0) {
      const inserts = gewaehlteQualifikationen.map((qualifikationId) => ({
        mitarbeiter_id: neuerMitarbeiter.id,
        qualifikation_id: qualifikationId,
      }))

      const { error: qualiError } = await supabase
        .from('mitarbeiter_qualifikationen')
        .insert(inserts)

      if (qualiError) {
        setFehler(qualiError.message)
        return
      }
    }

    setMitarbeiternummer('')
    setVorname('')
    setNachname('')
    setEmail('')
    setTelefon('')
    setEintrittsdatum('')
    setStatus('aktiv')
    setRangId('')
    setGewaehlteQualifikationen([])

    ladeAlles()
  }

  function rangNameFinden(rang_id: string | null) {
    if (!rang_id) return '-'
    return raenge.find((r) => r.id === rang_id)?.name || '-'
  }

  function qualifikationenVonMitarbeiter(mitarbeiterId: string) {
    const ids = mitarbeiterQualifikationen
      .filter((mq) => mq.mitarbeiter_id === mitarbeiterId)
      .map((mq) => mq.qualifikation_id)

    return qualifikationen
      .filter((q) => ids.includes(q.id))
      .map((q) => q.name)
  }

  return (
    <div className="page-card">
      <h1>Mitarbeiter</h1>

      <form onSubmit={mitarbeiterAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <input
            placeholder="Mitarbeiternummer"
            value={mitarbeiternummer}
            onChange={(e) => setMitarbeiternummer(e.target.value)}
            style={{ minWidth: 180 }}
          />
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
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <input
            placeholder="Telefon"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <input
            type="date"
            value={eintrittsdatum}
            onChange={(e) => setEintrittsdatum(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="aktiv">aktiv</option>
            <option value="inaktiv">inaktiv</option>
            <option value="beurlaubt">beurlaubt</option>
            <option value="ausgeschieden">ausgeschieden</option>
          </select>
          <select
            value={rangId}
            onChange={(e) => setRangId(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">Rang auswählen</option>
            {raenge.map((rang) => (
              <option key={rang.id} value={rang.id}>
                {rang.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <strong>Qualifikationen</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            {qualifikationen.map((quali) => (
              <label key={quali.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={gewaehlteQualifikationen.includes(quali.id)}
                  onChange={() => toggleQualifikation(quali.id)}
                />
                {quali.name}
              </label>
            ))}
          </div>
        </div>

        <button type="submit">Mitarbeiter anlegen</button>
      </form>

      <div>
        {mitarbeiter.map((person) => {
          const qualis = qualifikationenVonMitarbeiter(person.id)

          return (
            <div key={person.id} className="list-box">
              <strong>
                {person.vorname} {person.nachname}
              </strong>
              <br />
              Mitarbeitervnr.: {person.mitarbeiternummer || '-'}
              <br />
              E-Mail: {person.email || '-'}
              <br />
              Telefon: {person.telefon || '-'}
              <br />
              Eintritt: {person.eintrittsdatum || '-'}
              <br />
              Status: {person.status || '-'}
              <br />
              Rang: {rangNameFinden(person.rang_id)}
              <br />
              Qualifikationen: {qualis.length > 0 ? qualis.join(', ') : '-'}
            </div>
          )
        })}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function MitarbeiterPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt']}>
      <MitarbeiterPageContent />
    </RoleGuard>
  )
}