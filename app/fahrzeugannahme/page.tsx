'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Serviceauftrag = {
  id: string
  art: string | null
}

type Checklistenpunkt = {
  id: string
  serviceauftrag_id: string
  punkt: string
  erledigt: boolean | null
  notiz: string | null
}

function FahrzeugannahmePageContent() {
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [punkte, setPunkte] = useState<Checklistenpunkt[]>([])

  const [serviceauftragId, setServiceauftragId] = useState('')
  const [punkt, setPunkt] = useState('')
  const [notiz, setNotiz] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [serviceRes, punkteRes] = await Promise.all([
      supabase.from('serviceauftraege').select('id, art').order('created_at', { ascending: false }),
      supabase.from('fahrzeugannahme_checklisten').select('*').order('created_at', { ascending: false }),
    ])

    const error = serviceRes.error || punkteRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setServiceauftraege(serviceRes.data || [])
    setPunkte(punkteRes.data || [])
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

    if (!punkt.trim()) {
      setFehler('Bitte einen Checkpunkt eingeben.')
      return
    }

    const { error } = await supabase.from('fahrzeugannahme_checklisten').insert({
      serviceauftrag_id: serviceauftragId,
      punkt: punkt.trim(),
      erledigt: false,
      notiz: notiz || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setServiceauftragId('')
    setPunkt('')
    setNotiz('')
    ladeAlles()
  }

  async function toggleErledigt(eintrag: Checklistenpunkt) {
    const { error } = await supabase
      .from('fahrzeugannahme_checklisten')
      .update({
        erledigt: !eintrag.erledigt,
      })
      .eq('id', eintrag.id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  async function loeschen(id: string) {
    const { error } = await supabase
      .from('fahrzeugannahme_checklisten')
      .delete()
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  function punkteVonAuftrag(auftragId: string) {
    return punkte.filter((p) => p.serviceauftrag_id === auftragId)
  }

  return (
    <div className="page-card">
      <h1>Fahrzeugannahme-Checkliste</h1>

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

          <input placeholder="Checkpunkt" value={punkt} onChange={(e) => setPunkt(e.target.value)} />
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
          <button type="submit">Checkpunkt anlegen</button>
        </div>
      </form>

      <div>
        {serviceauftraege.map((auftrag) => (
          <div key={auftrag.id} className="list-box">
            <strong>Auftrag: {auftrag.art || '-'} – {auftrag.id}</strong>

            <div style={{ marginTop: 12 }}>
              {punkteVonAuftrag(auftrag.id).length === 0 ? (
                <div>Keine Checkpunkte</div>
              ) : (
                punkteVonAuftrag(auftrag.id).map((p) => (
                  <div key={p.id} style={{ marginBottom: 10 }}>
                    <strong>{p.punkt}</strong>
                    <br />
                    Erledigt: {p.erledigt ? 'ja' : 'nein'}
                    <br />
                    Notiz: {p.notiz || '-'}
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => toggleErledigt(p)}>
                        Status umschalten
                      </button>
                      <button type="button" onClick={() => loeschen(p.id)} style={{ background: '#dc2626' }}>
                        Löschen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function FahrzeugannahmePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme']}>
      <FahrzeugannahmePageContent />
    </RoleGuard>
  )
}