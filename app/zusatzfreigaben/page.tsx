'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
}

type Zusatzfreigabe = {
  id: string
  serviceauftrag_id: string
  titel: string
  beschreibung: string | null
  betrag: number | null
  status: string | null
  kundenname: string | null
  kundenunterschrift: string | null
  freigegeben_am: string | null
}

export default function ZusatzfreigabenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Serviceannahme', 'Werkstatt']}>
      <ZusatzfreigabenPageContent />
    </RoleGuard>
  )
}

function ZusatzfreigabenPageContent() {
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [freigaben, setFreigaben] = useState<Zusatzfreigabe[]>([])

  const [serviceauftragId, setServiceauftragId] = useState('')
  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [betrag, setBetrag] = useState('')
  const [kundenname, setKundenname] = useState('')
  const [kundenunterschrift, setKundenunterschrift] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const [sRes, fRes] = await Promise.all([
      supabase.from('serviceauftraege').select('id, art, status').order('created_at', { ascending: false }),
      supabase.from('zusatzfreigaben').select('*').order('erstellt_am', { ascending: false }),
    ])

    if (sRes.error || fRes.error) {
      setFehler(sRes.error?.message || fRes.error?.message || '')
      return
    }

    setServiceauftraege(sRes.data || [])
    setFreigaben(fRes.data || [])
  }

  useEffect(() => {
    laden()
  }, [])

  async function anlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!serviceauftragId) {
      setFehler('Bitte einen Serviceauftrag auswählen.')
      return
    }

    if (!titel.trim()) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    const { error } = await supabase.from('zusatzfreigaben').insert({
      serviceauftrag_id: serviceauftragId,
      titel: titel.trim(),
      beschreibung: beschreibung || null,
      betrag: betrag ? Number(betrag) : 0,
      status: 'angefragt',
      kundenname: kundenname || null,
      kundenunterschrift: kundenunterschrift || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setServiceauftragId('')
    setTitel('')
    setBeschreibung('')
    setBetrag('')
    setKundenname('')
    setKundenunterschrift('')
    setMeldung('Zusatzfreigabe angelegt.')
    laden()
  }

  async function freigeben(f: Zusatzfreigabe) {
    const { error } = await supabase
      .from('zusatzfreigaben')
      .update({
        status: 'freigegeben',
        freigegeben_am: new Date().toISOString(),
      })
      .eq('id', f.id)

    if (error) {
      setFehler(error.message)
      return
    }

    laden()
  }

  async function ablehnen(f: Zusatzfreigabe) {
    const { error } = await supabase
      .from('zusatzfreigaben')
      .update({
        status: 'abgelehnt',
      })
      .eq('id', f.id)

    if (error) {
      setFehler(error.message)
      return
    }

    laden()
  }

  function auftragName(id: string) {
    const auftrag = serviceauftraege.find((s) => s.id === id)
    return auftrag ? `${auftrag.art || '-'} – ${auftrag.id}` : id
  }

  return (
    <div className="page-card">
      <h1>Zusatzfreigaben</h1>

      <form onSubmit={anlegen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <select value={serviceauftragId} onChange={(e) => setServiceauftragId(e.target.value)}>
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraege.map((s) => (
              <option key={s.id} value={s.id}>
                {s.art || '-'} – {s.id} – {s.status || '-'}
              </option>
            ))}
          </select>

          <input
            placeholder="Titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
          />

          <input
            placeholder="Betrag"
            value={betrag}
            onChange={(e) => setBetrag(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Beschreibung"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            placeholder="Kundenname"
            value={kundenname}
            onChange={(e) => setKundenname(e.target.value)}
          />

          <input
            placeholder="Kundenunterschrift (Light-Version)"
            value={kundenunterschrift}
            onChange={(e) => setKundenunterschrift(e.target.value)}
          />
        </div>

        <div className="action-row">
          <button type="submit">Zusatzfreigabe anlegen</button>
        </div>
      </form>

      <h2>Freigaben</h2>

      {freigaben.map((f) => (
        <div key={f.id} className="list-box">
          <strong>{f.titel}</strong>
          <br />
          Auftrag: {auftragName(f.serviceauftrag_id)}
          <br />
          Beschreibung: {f.beschreibung || '-'}
          <br />
          Betrag: {Number(f.betrag || 0).toFixed(2)} €
          <br />
          Kunde: {f.kundenname || '-'}
          <br />
          Kundenunterschrift: {f.kundenunterschrift || '-'}
          <br />
          Freigegeben am: {f.freigegeben_am ? new Date(f.freigegeben_am).toLocaleString('de-DE') : '-'}
          <br />
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={f.status} />
          </div>

          <div className="action-row">
            <button type="button" onClick={() => freigeben(f)}>
              Freigeben
            </button>
            <button type="button" onClick={() => ablehnen(f)} style={{ background: '#dc2626' }}>
              Ablehnen
            </button>
          </div>
        </div>
      ))}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}