'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
}

type Uebergabe = {
  id: string
  serviceauftrag_id: string
  uebergabe_datum: string | null
  status: string | null
  zahlung_geprueft: boolean | null
  fahrzeug_erklaert: boolean | null
  schluessel_uebergeben: boolean | null
  notiz: string | null
}

function FahrzeugabholungPageContent() {
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [uebergaben, setUebergaben] = useState<Uebergabe[]>([])

  const [serviceauftragId, setServiceauftragId] = useState('')
  const [status, setStatus] = useState('offen')
  const [zahlungGeprueft, setZahlungGeprueft] = useState(false)
  const [fahrzeugErklaert, setFahrzeugErklaert] = useState(false)
  const [schluesselUebergeben, setSchluesselUebergeben] = useState(false)
  const [notiz, setNotiz] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [serviceRes, uebergabenRes] = await Promise.all([
      supabase.from('serviceauftraege').select('id, art, status').order('created_at', { ascending: false }),
      supabase.from('fahrzeuguebergaben').select('*').order('created_at', { ascending: false }),
    ])

    const error = serviceRes.error || uebergabenRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setServiceauftraege(serviceRes.data || [])
    setUebergaben(uebergabenRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function anlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!serviceauftragId) {
      setFehler('Bitte einen Serviceauftrag auswählen.')
      return
    }

    const { error } = await supabase.from('fahrzeuguebergaben').insert({
      serviceauftrag_id: serviceauftragId,
      uebergabe_datum: new Date().toISOString(),
      status,
      zahlung_geprueft: zahlungGeprueft,
      fahrzeug_erklaert: fahrzeugErklaert,
      schluessel_uebergeben: schluesselUebergeben,
      notiz: notiz || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setServiceauftragId('')
    setStatus('offen')
    setZahlungGeprueft(false)
    setFahrzeugErklaert(false)
    setSchluesselUebergeben(false)
    setNotiz('')
    ladeAlles()
  }

  async function abschliessen(uebergabe: Uebergabe) {
    const { error } = await supabase
      .from('fahrzeuguebergaben')
      .update({
        status: 'abgeschlossen',
      })
      .eq('id', uebergabe.id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  async function loeschen(id: string) {
    const { error } = await supabase
      .from('fahrzeuguebergaben')
      .delete()
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  function auftragInfo(id: string) {
    const auftrag = serviceauftraege.find((s) => s.id === id)
    if (!auftrag) return 'Unbekannter Auftrag'
    return `${auftrag.art || '-'} – ${auftrag.id} – ${auftrag.status || '-'}`
  }

  return (
    <div className="page-card">
      <h1>Fahrzeugabholung / Übergabe</h1>

      <form onSubmit={anlegen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <select value={serviceauftragId} onChange={(e) => setServiceauftragId(e.target.value)}>
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraege.map((s) => (
              <option key={s.id} value={s.id}>
                {s.art || '-'} – {s.id}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="offen">offen</option>
            <option value="bereit">bereit</option>
            <option value="abgeschlossen">abgeschlossen</option>
          </select>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label>
            <input type="checkbox" checked={zahlungGeprueft} onChange={(e) => setZahlungGeprueft(e.target.checked)} /> Zahlung geprüft
          </label>

          <label>
            <input type="checkbox" checked={fahrzeugErklaert} onChange={(e) => setFahrzeugErklaert(e.target.checked)} /> Fahrzeug erklärt
          </label>

          <label>
            <input type="checkbox" checked={schluesselUebergeben} onChange={(e) => setSchluesselUebergeben(e.target.checked)} /> Schlüssel übergeben
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Notiz"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Übergabe anlegen</button>
        </div>
      </form>

      <div>
        {uebergaben.map((u) => (
          <div key={u.id} className="list-box">
            <strong>{auftragInfo(u.serviceauftrag_id)}</strong>
            <br />
            Übergabe: {u.uebergabe_datum ? new Date(u.uebergabe_datum).toLocaleString() : '-'}
            <br />
            Status: {u.status || '-'}
            <br />
            Zahlung geprüft: {u.zahlung_geprueft ? 'ja' : 'nein'}
            <br />
            Fahrzeug erklärt: {u.fahrzeug_erklaert ? 'ja' : 'nein'}
            <br />
            Schlüssel übergeben: {u.schluessel_uebergeben ? 'ja' : 'nein'}
            <br />
            Notiz: {u.notiz || '-'}

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => abschliessen(u)}>
                Abschließen
              </button>
              <button type="button" onClick={() => loeschen(u.id)} style={{ background: '#dc2626' }}>
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

export default function FahrzeugabholungPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Buchhaltung']}>
      <FahrzeugabholungPageContent />
    </RoleGuard>
  )
}