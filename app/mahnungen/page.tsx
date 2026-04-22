'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  offener_betrag: number | null
  mahnstufe: number | null
  forderungsstatus: string | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Mahnung = {
  id: string
  rechnung_id: string
  mahnstufe: number | null
  erstellt_am: string | null
  betreff: string | null
  text: string | null
  status: string | null
  notiz: string | null
}

export default function MahnungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <MahnungenPageContent />
    </RoleGuard>
  )
}

function MahnungenPageContent() {
  const [rechnungFilter, setRechnungFilter] = useState('')

  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [mahnungen, setMahnungen] = useState<Mahnung[]>([])

  const [rechnungId, setRechnungId] = useState('')
  const [betreff, setBetreff] = useState('')
  const [text, setText] = useState('')
  const [notiz, setNotiz] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const rechnung = params.get('rechnung') || ''
    setRechnungFilter(rechnung)
    setRechnungId(rechnung)
  }, [])

  async function laden() {
    const [rRes, kRes, mRes] = await Promise.all([
      supabase.from('rechnungen').select('*').order('created_at', { ascending: false }),
      supabase.from('kunden').select('*'),
      supabase.from('mahnungen').select('*').order('erstellt_am', { ascending: false }),
    ])

    if (rRes.error || kRes.error || mRes.error) {
      setFehler(rRes.error?.message || kRes.error?.message || mRes.error?.message || '')
      return
    }

    setRechnungen((rRes.data || []) as Rechnung[])
    setKunden((kRes.data || []) as Kunde[])
    setMahnungen((mRes.data || []) as Mahnung[])
  }

  useEffect(() => {
    laden()
  }, [])

  function kundeName(kundeId: string | null) {
    if (!kundeId) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === kundeId)
    if (!kunde) return 'Unbekannter Kunde'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  function rechnungName(id: string) {
    const r = rechnungen.find((x) => x.id === id)
    return r ? `${r.rechnungsnummer || r.id} – ${kundeName(r.kunde_id)}` : id
  }

  async function mahnungErstellen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!rechnungId) {
      setFehler('Bitte eine Rechnung auswählen.')
      return
    }

    const rechnung = rechnungen.find((r) => r.id === rechnungId)

    if (!rechnung) {
      setFehler('Rechnung nicht gefunden.')
      return
    }

    const neueStufe = Number(rechnung.mahnstufe || 0) + 1

    const defaultBetreff =
      betreff.trim() ||
      `Mahnung Stufe ${neueStufe} zu Rechnung ${rechnung.rechnungsnummer || rechnung.id}`

    const defaultText =
      text.trim() ||
      `Offener Betrag: ${Number(rechnung.offener_betrag || 0).toFixed(
        2
      )} €. Bitte Zahlung intern nachverfolgen.`

    const { error: mahnungError } = await supabase.from('mahnungen').insert({
      rechnung_id: rechnungId,
      mahnstufe: neueStufe,
      betreff: defaultBetreff,
      text: defaultText,
      status: 'erstellt',
      notiz: notiz || null,
    })

    if (mahnungError) {
      setFehler(mahnungError.message)
      return
    }

    let neuerForderungsstatus = 'zahlungserinnerung'
    if (neueStufe === 1) neuerForderungsstatus = 'mahnung_1'
    if (neueStufe === 2) neuerForderungsstatus = 'mahnung_2'
    if (neueStufe >= 3) neuerForderungsstatus = 'mahnung_3'

    const { error: rechnungError } = await supabase
      .from('rechnungen')
      .update({
        mahnstufe: neueStufe,
        letzte_mahnung_am: new Date().toISOString(),
        status: 'ueberfaellig',
        forderungsstatus: neuerForderungsstatus,
      })
      .eq('id', rechnungId)

    if (rechnungError) {
      setFehler(rechnungError.message)
      return
    }

    setBetreff('')
    setText('')
    setNotiz('')
    setMeldung(`Mahnung Stufe ${neueStufe} wurde erstellt.`)
    laden()
  }

  async function statusAendern(mahnungId: string, status: string) {
    const { error } = await supabase
      .from('mahnungen')
      .update({ status })
      .eq('id', mahnungId)

    if (error) {
      setFehler(error.message)
      return
    }

    laden()
  }

  const sichtbareMahnungen = useMemo(() => {
    if (!rechnungFilter) return mahnungen
    return mahnungen.filter((m) => m.rechnung_id === rechnungFilter)
  }, [mahnungen, rechnungFilter])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Mahnungen</h1>
          <div className="topbar-subtitle">
            Interne Mahnungsverwaltung ohne Mailversand.
          </div>
        </div>
      </div>

      <form onSubmit={mahnungErstellen} className="page-card">
        <h2 style={{ marginTop: 0 }}>Mahnung erstellen</h2>

        <div className="form-row">
          <select value={rechnungId} onChange={(e) => setRechnungId(e.target.value)}>
            <option value="">Rechnung auswählen</option>
            {rechnungen
              .filter((r) => Number(r.offener_betrag || 0) > 0)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rechnungsnummer || r.id} – {kundeName(r.kunde_id)} – offen{' '}
                  {Number(r.offener_betrag || 0).toFixed(2)} €
                </option>
              ))}
          </select>

          <input
            placeholder="Betreff (optional)"
            value={betreff}
            onChange={(e) => setBetreff(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Interner Mahnungstext"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', minHeight: 120 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Interne Notiz"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div className="action-row">
          <button type="submit">Mahnung erstellen</button>
        </div>
      </form>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Mahnungsverlauf</h2>

        {sichtbareMahnungen.map((m) => (
          <div key={m.id} className="list-box">
            <strong>{m.betreff || '-'}</strong>
            <br />
            Rechnung: {rechnungName(m.rechnung_id)}
            <br />
            Mahnstufe: {m.mahnstufe || 0}
            <br />
            Erstellt:{' '}
            {m.erstellt_am ? new Date(m.erstellt_am).toLocaleString('de-DE') : '-'}
            <br />
            Text: {m.text || '-'}
            <br />
            Notiz: {m.notiz || '-'}
            <br />
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={m.status || 'erstellt'} />
            </div>

            <div className="action-row">
              <button type="button" onClick={() => statusAendern(m.id, 'bearbeitet')}>
                Als bearbeitet markieren
              </button>
              <button type="button" onClick={() => statusAendern(m.id, 'abgeschlossen')}>
                Abschließen
              </button>
            </div>
          </div>
        ))}

        {sichtbareMahnungen.length === 0 && (
          <div className="muted">Keine Mahnungen vorhanden.</div>
        )}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}