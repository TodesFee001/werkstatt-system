'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import { logAktion } from '@/lib/activity-log'

type Kunde = {
  id: string
  firmenname: string | null
  vorname: string | null
  nachname: string | null
  telefon: string | null
  email: string | null
  adresse: string | null
  interne_notiz: string | null
}

export default function KundenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Serviceannahme']}>
      <KundenPageContent />
    </RoleGuard>
  )
}

function KundenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [suche, setSuche] = useState('')

  const [firmenname, setFirmenname] = useState('')
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [adresse, setAdresse] = useState('')
  const [notiz, setNotiz] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)

  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('kunden')
      .select('*')
      .order('firmenname')

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden(data || [])
  }

  useEffect(() => {
    laden()
  }, [])

  function kundenName(k: Kunde) {
    return k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim()
  }

  const gefiltert = useMemo(() => {
    const q = suche.toLowerCase()
    return kunden.filter((k) =>
      kundenName(k).toLowerCase().includes(q)
    )
  }, [kunden, suche])

  function resetForm() {
    setBearbeitenId(null)
    setFirmenname('')
    setVorname('')
    setNachname('')
    setTelefon('')
    setEmail('')
    setAdresse('')
    setNotiz('')
  }

  function bearbeitenStarten(k: Kunde) {
    setBearbeitenId(k.id)
    setFirmenname(k.firmenname || '')
    setVorname(k.vorname || '')
    setNachname(k.nachname || '')
    setTelefon(k.telefon || '')
    setEmail(k.email || '')
    setAdresse(k.adresse || '')
    setNotiz(k.interne_notiz || '')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    const payload = {
      firmenname: firmenname || null,
      vorname: vorname || null,
      nachname: nachname || null,
      telefon: telefon || null,
      email: email || null,
      adresse: adresse || null,
      interne_notiz: notiz || null,
    }

    let id = bearbeitenId

    if (bearbeitenId) {
      const { error } = await supabase
        .from('kunden')
        .update(payload)
        .eq('id', bearbeitenId)

      if (error) {
        setFehler(error.message)
        return
      }

      await logAktion(
        'kunden',
        'bearbeitet',
        bearbeitenId,
        kundenName(payload as any),
        { neueDaten: payload }
      )

      setMeldung('Kunde wurde aktualisiert.')
    } else {
      const { data, error } = await supabase
        .from('kunden')
        .insert(payload)
        .select()
        .single()

      if (error) {
        setFehler(error.message)
        return
      }

      id = data.id

      await logAktion(
        'kunden',
        'erstellt',
        id,
        kundenName(payload as any),
        payload
      )

      setMeldung('Kunde wurde erstellt.')
    }

    resetForm()
    laden()
  }

  async function loeschen(k: Kunde) {
    const ok = window.confirm('Kunde wirklich löschen?')
    if (!ok) return

    const { error } = await supabase
      .from('kunden')
      .delete()
      .eq('id', k.id)

    if (error) {
      setFehler(error.message)
      return
    }

    await logAktion(
      'kunden',
      'geloescht',
      k.id,
      kundenName(k),
      {}
    )

    setMeldung('Kunde wurde gelöscht.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <h1 className="topbar-title">Kunden</h1>
      </div>

      <form onSubmit={speichern} className="page-card">
        <h2>{bearbeitenId ? 'Kunde bearbeiten' : 'Kunde anlegen'}</h2>

        <div className="form-row">
          <input placeholder="Firmenname" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} />
          <input placeholder="Vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
          <input placeholder="Nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} />
        </div>

        <div className="form-row">
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          <input placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-row">
          <input placeholder="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
        </div>

        <textarea
          placeholder="Interne Notiz"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          style={{ marginTop: 10 }}
        />

        <div className="action-row">
          <button type="submit">
            {bearbeitenId ? 'Speichern' : 'Erstellen'}
          </button>

          {bearbeitenId && (
            <button type="button" onClick={resetForm}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="page-card">
        <input
          placeholder="Kunden suchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />

        {gefiltert.map((k) => (
          <div key={k.id} className="list-box">
            <strong>{kundenName(k)}</strong>
            <br />
            {k.telefon || '-'} | {k.email || '-'}
            <div className="action-row">
              <button onClick={() => bearbeitenStarten(k)}>Bearbeiten</button>
              <button onClick={() => loeschen(k)} style={{ background: '#dc2626' }}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}