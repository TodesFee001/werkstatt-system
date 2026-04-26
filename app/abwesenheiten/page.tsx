'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Mitarbeiter = {
  id: string
  vorname: string
  nachname: string
}

type Abwesenheitstyp = {
  id: string
  name: string
}

type Abwesenheit = {
  id: string
  mitarbeiter_id: string | null
  abwesenheitstyp_id: string | null
  von_datum: string
  bis_datum: string
  status: string | null
  grund: string | null
}

function AbwesenheitenPageContent() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [typen, setTypen] = useState<Abwesenheitstyp[]>([])
  const [abwesenheiten, setAbwesenheiten] = useState<Abwesenheit[]>([])

  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [abwesenheitstypId, setAbwesenheitstypId] = useState('')
  const [vonDatum, setVonDatum] = useState('')
  const [bisDatum, setBisDatum] = useState('')
  const [status, setStatus] = useState('beantragt')
  const [grund, setGrund] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenMitarbeiterId, setBearbeitenMitarbeiterId] = useState('')
  const [bearbeitenTypId, setBearbeitenTypId] = useState('')
  const [bearbeitenVonDatum, setBearbeitenVonDatum] = useState('')
  const [bearbeitenBisDatum, setBearbeitenBisDatum] = useState('')
  const [bearbeitenStatus, setBearbeitenStatus] = useState('beantragt')
  const [bearbeitenGrund, setBearbeitenGrund] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: mData, error: mError } = await supabase
      .from('mitarbeiter')
      .select('id, vorname, nachname')
      .order('vorname', { ascending: true })

    const { data: tData, error: tError } = await supabase
      .from('abwesenheitstypen')
      .select('*')
      .order('name', { ascending: true })

    const { data: aData, error: aError } = await supabase
      .from('abwesenheiten')
      .select('*')
      .order('created_at', { ascending: false })

    if (mError || tError || aError) {
      setFehler(mError?.message || tError?.message || aError?.message || 'Fehler')
      return
    }

    setMitarbeiter(mData || [])
    setTypen(tData || [])
    setAbwesenheiten(aData || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function abwesenheitAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!mitarbeiterId) {
      setFehler('Bitte einen Mitarbeiter auswählen.')
      return
    }

    if (!abwesenheitstypId) {
      setFehler('Bitte einen Abwesenheitstyp auswählen.')
      return
    }

    if (!vonDatum || !bisDatum) {
      setFehler('Bitte Von- und Bis-Datum angeben.')
      return
    }

    const { error } = await supabase.from('abwesenheiten').insert({
      mitarbeiter_id: mitarbeiterId,
      abwesenheitstyp_id: abwesenheitstypId,
      von_datum: vonDatum,
      bis_datum: bisDatum,
      status,
      grund: grund || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setMitarbeiterId('')
    setAbwesenheitstypId('')
    setVonDatum('')
    setBisDatum('')
    setStatus('beantragt')
    setGrund('')
    ladeAlles()
  }

  function bearbeitenStarten(eintrag: Abwesenheit) {
    setBearbeitenId(eintrag.id)
    setBearbeitenMitarbeiterId(eintrag.mitarbeiter_id || '')
    setBearbeitenTypId(eintrag.abwesenheitstyp_id || '')
    setBearbeitenVonDatum(eintrag.von_datum || '')
    setBearbeitenBisDatum(eintrag.bis_datum || '')
    setBearbeitenStatus(eintrag.status || 'beantragt')
    setBearbeitenGrund(eintrag.grund || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenMitarbeiterId('')
    setBearbeitenTypId('')
    setBearbeitenVonDatum('')
    setBearbeitenBisDatum('')
    setBearbeitenStatus('beantragt')
    setBearbeitenGrund('')
  }

  async function abwesenheitSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    const { error } = await supabase
      .from('abwesenheiten')
      .update({
        mitarbeiter_id: bearbeitenMitarbeiterId || null,
        abwesenheitstyp_id: bearbeitenTypId || null,
        von_datum: bearbeitenVonDatum,
        bis_datum: bearbeitenBisDatum,
        status: bearbeitenStatus,
        grund: bearbeitenGrund || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeAlles()
  }

  async function abwesenheitLoeschen(id: string) {
    const bestaetigt = window.confirm('Abwesenheit wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase
      .from('abwesenheiten')
      .delete()
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (bearbeitenId === id) {
      bearbeitenAbbrechen()
    }

    ladeAlles()
  }

  function mitarbeiterName(id: string | null) {
    if (!id) return 'Unbekannt'
    const person = mitarbeiter.find((m) => m.id === id)
    return person ? `${person.vorname} ${person.nachname}` : 'Unbekannt'
  }

  function typName(id: string | null) {
    if (!id) return 'Unbekannt'
    return typen.find((t) => t.id === id)?.name || 'Unbekannt'
  }

  return (
    <div className="page-card">
      <h1>Abwesenheiten</h1>

      <form onSubmit={abwesenheitAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <select
            value={mitarbeiterId}
            onChange={(e) => setMitarbeiterId(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Mitarbeiter auswählen</option>
            {mitarbeiter.map((person) => (
              <option key={person.id} value={person.id}>
                {person.vorname} {person.nachname}
              </option>
            ))}
          </select>

          <select
            value={abwesenheitstypId}
            onChange={(e) => setAbwesenheitstypId(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Abwesenheitstyp auswählen</option>
            {typen.map((typ) => (
              <option key={typ.id} value={typ.id}>
                {typ.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={vonDatum}
            onChange={(e) => setVonDatum(e.target.value)}
            style={{ minWidth: 170 }}
          />

          <input
            type="date"
            value={bisDatum}
            onChange={(e) => setBisDatum(e.target.value)}
            style={{ minWidth: 170 }}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="beantragt">beantragt</option>
            <option value="genehmigt">genehmigt</option>
            <option value="abgelehnt">abgelehnt</option>
            <option value="storniert">storniert</option>
          </select>
        </div>

        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <textarea
            placeholder="Grund / Notiz"
            value={grund}
            onChange={(e) => setGrund(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <button type="submit">Abwesenheit anlegen</button>
      </form>

      {bearbeitenId && (
        <form onSubmit={abwesenheitSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Abwesenheit bearbeiten</h3>

          <div className="form-row">
            <select
              value={bearbeitenMitarbeiterId}
              onChange={(e) => setBearbeitenMitarbeiterId(e.target.value)}
            >
              <option value="">Mitarbeiter auswählen</option>
              {mitarbeiter.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.vorname} {person.nachname}
                </option>
              ))}
            </select>

            <select
              value={bearbeitenTypId}
              onChange={(e) => setBearbeitenTypId(e.target.value)}
            >
              <option value="">Abwesenheitstyp auswählen</option>
              {typen.map((typ) => (
                <option key={typ.id} value={typ.id}>
                  {typ.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={bearbeitenVonDatum}
              onChange={(e) => setBearbeitenVonDatum(e.target.value)}
            />

            <input
              type="date"
              value={bearbeitenBisDatum}
              onChange={(e) => setBearbeitenBisDatum(e.target.value)}
            />

            <select
              value={bearbeitenStatus}
              onChange={(e) => setBearbeitenStatus(e.target.value)}
            >
              <option value="beantragt">beantragt</option>
              <option value="genehmigt">genehmigt</option>
              <option value="abgelehnt">abgelehnt</option>
              <option value="storniert">storniert</option>
            </select>
          </div>

          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <textarea
              placeholder="Grund / Notiz"
              value={bearbeitenGrund}
              onChange={(e) => setBearbeitenGrund(e.target.value)}
              style={{ width: '100%', minHeight: 90 }}
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
        {abwesenheiten.map((eintrag) => (
          <div key={eintrag.id} className="list-box">
            <strong>{mitarbeiterName(eintrag.mitarbeiter_id)}</strong>
            <br />
            Typ: {typName(eintrag.abwesenheitstyp_id)}
            <br />
            Von: {eintrag.von_datum}
            <br />
            Bis: {eintrag.bis_datum}
            <br />
            Status: {eintrag.status || '-'}
            <br />
            Grund: {eintrag.grund || '-'}

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => bearbeitenStarten(eintrag)}>
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => abwesenheitLoeschen(eintrag.id)}
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

export default function AbwesenheitenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt']}>
      <AbwesenheitenPageContent />
    </RoleGuard>
  )
}