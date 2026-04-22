'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
}

type Fahrzeugcheck = {
  id: string
  serviceauftrag_id: string
  kilometerstand: number | null
  tankstand: string | null
  aussencheck: string | null
  innencheck: string | null
  schaeden: string | null
  zubehoer: string | null
  notiz: string | null
  kundenunterschrift: string | null
  mitarbeiterunterschrift: string | null
  erstellt_am: string | null
}

export default function AuftragsannahmePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Serviceannahme', 'Werkstatt']}>
      <AuftragsannahmePageContent />
    </RoleGuard>
  )
}

function AuftragsannahmePageContent() {
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [checks, setChecks] = useState<Fahrzeugcheck[]>([])

  const [serviceauftragId, setServiceauftragId] = useState('')
  const [kilometerstand, setKilometerstand] = useState('')
  const [tankstand, setTankstand] = useState('voll')
  const [aussencheck, setAussencheck] = useState('')
  const [innencheck, setInnencheck] = useState('')
  const [schaeden, setSchaeden] = useState('')
  const [zubehoer, setZubehoer] = useState('')
  const [notiz, setNotiz] = useState('')
  const [kundenunterschrift, setKundenunterschrift] = useState('')
  const [mitarbeiterunterschrift, setMitarbeiterunterschrift] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const [serviceRes, checkRes] = await Promise.all([
      supabase.from('serviceauftraege').select('id, art, status').order('created_at', { ascending: false }),
      supabase.from('fahrzeugchecks').select('*').order('erstellt_am', { ascending: false }),
    ])

    if (serviceRes.error || checkRes.error) {
      setFehler(serviceRes.error?.message || checkRes.error?.message || '')
      return
    }

    setServiceauftraege(serviceRes.data || [])
    setChecks(checkRes.data || [])
  }

  useEffect(() => {
    laden()
  }, [])

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!serviceauftragId) {
      setFehler('Bitte einen Serviceauftrag auswählen.')
      return
    }

    const { error } = await supabase.from('fahrzeugchecks').insert({
      serviceauftrag_id: serviceauftragId,
      kilometerstand: kilometerstand ? Number(kilometerstand) : null,
      tankstand: tankstand || null,
      aussencheck: aussencheck || null,
      innencheck: innencheck || null,
      schaeden: schaeden || null,
      zubehoer: zubehoer || null,
      notiz: notiz || null,
      kundenunterschrift: kundenunterschrift || null,
      mitarbeiterunterschrift: mitarbeiterunterschrift || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setServiceauftragId('')
    setKilometerstand('')
    setTankstand('voll')
    setAussencheck('')
    setInnencheck('')
    setSchaeden('')
    setZubehoer('')
    setNotiz('')
    setKundenunterschrift('')
    setMitarbeiterunterschrift('')
    setMeldung('Fahrzeugcheck gespeichert.')
    laden()
  }

  function auftragName(id: string) {
    const auftrag = serviceauftraege.find((s) => s.id === id)
    return auftrag ? `${auftrag.art || '-'} – ${auftrag.id}` : id
  }

  return (
    <div className="page-card">
      <h1>Auftragsannahme / Fahrzeugcheck</h1>

      <form onSubmit={speichern} className="list-box" style={{ marginBottom: 20 }}>
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
            placeholder="Kilometerstand"
            value={kilometerstand}
            onChange={(e) => setKilometerstand(e.target.value)}
          />

          <select value={tankstand} onChange={(e) => setTankstand(e.target.value)}>
            <option value="leer">leer</option>
            <option value="1/4">1/4</option>
            <option value="1/2">1/2</option>
            <option value="3/4">3/4</option>
            <option value="voll">voll</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Außencheck"
            value={aussencheck}
            onChange={(e) => setAussencheck(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
  placeholder="Innencheck"
  value={innencheck}
  onChange={(e) => setInnencheck(e.target.value)}
  style={{ width: '100%', minHeight: 80 }}
/>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Bekannte Schäden"
            value={schaeden}
            onChange={(e) => setSchaeden(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Zubehör im Fahrzeug"
            value={zubehoer}
            onChange={(e) => setZubehoer(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Notiz"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            placeholder="Kundenunterschrift (Name als Light-Version)"
            value={kundenunterschrift}
            onChange={(e) => setKundenunterschrift(e.target.value)}
          />
          <input
            placeholder="Mitarbeiterunterschrift (Name als Light-Version)"
            value={mitarbeiterunterschrift}
            onChange={(e) => setMitarbeiterunterschrift(e.target.value)}
          />
        </div>

        <div className="action-row">
          <button type="submit">Fahrzeugcheck speichern</button>
        </div>
      </form>

      <h2>Gespeicherte Fahrzeugchecks</h2>

      {checks.map((c) => (
        <div key={c.id} className="list-box">
          <strong>{auftragName(c.serviceauftrag_id)}</strong>
          <br />
          Kilometerstand: {c.kilometerstand ?? '-'}
          <br />
          Tankstand: {c.tankstand || '-'}
          <br />
          Außencheck: {c.aussencheck || '-'}
          <br />
          Innencheck: {c.innencheck || '-'}
          <br />
          Schäden: {c.schaeden || '-'}
          <br />
          Zubehör: {c.zubehoer || '-'}
          <br />
          Notiz: {c.notiz || '-'}
          <br />
          Kundenunterschrift: {c.kundenunterschrift || '-'}
          <br />
          Mitarbeiterunterschrift: {c.mitarbeiterunterschrift || '-'}
          <br />
          Erstellt: {c.erstellt_am ? new Date(c.erstellt_am).toLocaleString('de-DE') : '-'}
        </div>
      ))}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}