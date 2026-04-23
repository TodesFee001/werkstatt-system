'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  offener_betrag: number | null
  mahnstufe: number | null
  status: string | null
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
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [mahnungen, setMahnungen] = useState<Mahnung[]>([])

  const [rechnungId, setRechnungId] = useState('')
  const [betreff, setBetreff] = useState('')
  const [text, setText] = useState('')
  const [notiz, setNotiz] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

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
    const kunde = kunden.find((k) => k.id === kundeId)
    return kunde
      ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
      : '-'
  }

  const mahnbareRechnungen = useMemo(() => {
    return rechnungen
      .filter((r) => Number(r.offener_betrag || 0) > 0)
      .sort((a, b) => Number(b.offener_betrag || 0) - Number(a.offener_betrag || 0))
  }, [rechnungen])

  async function erstellen(e: React.FormEvent) {
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

    const { error: mahnungError } = await supabase.from('mahnungen').insert({
      rechnung_id: rechnungId,
      mahnstufe: neueStufe,
      betreff:
        betreff.trim() ||
        `Mahnung Stufe ${neueStufe} zu Rechnung ${rechnung.rechnungsnummer || rechnung.id}`,
      text:
        text.trim() ||
        `Interne Mahnung zu offener Rechnung über ${Number(
          rechnung.offener_betrag || 0
        ).toFixed(2)} €.`,
      status: 'erstellt',
      notiz: notiz || null,
    })

    if (mahnungError) {
      setFehler(mahnungError.message)
      return
    }

    let forderungsstatus = 'zahlungserinnerung'
    if (neueStufe === 1) forderungsstatus = 'mahnung_1'
    if (neueStufe === 2) forderungsstatus = 'mahnung_2'
    if (neueStufe >= 3) forderungsstatus = 'mahnung_3'

    const { error: updateError } = await supabase
      .from('rechnungen')
      .update({
        mahnstufe: neueStufe,
        letzte_mahnung_am: new Date().toISOString(),
        status: 'ueberfaellig',
        forderungsstatus,
      })
      .eq('id', rechnungId)

    if (updateError) {
      setFehler(updateError.message)
      return
    }

    setRechnungId('')
    setBetreff('')
    setText('')
    setNotiz('')
    setMeldung(`Mahnung Stufe ${neueStufe} wurde erstellt.`)
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Mahnungen</h1>
          <div className="topbar-subtitle">
            Mahnungen werden ausschließlich für aktive offene Rechnungen erstellt.
          </div>
        </div>
      </div>

      <form onSubmit={erstellen} className="page-card">
        <h2 style={{ marginTop: 0 }}>Mahnung anlegen</h2>

        <div className="form-row">
          <select value={rechnungId} onChange={(e) => setRechnungId(e.target.value)}>
            <option value="">Rechnung auswählen</option>
            {mahnbareRechnungen.map((r) => (
              <option key={r.id} value={r.id}>
                {r.rechnungsnummer || r.id} – {kundeName(r.kunde_id)} – offen {Number(r.offener_betrag || 0).toFixed(2)} €
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            placeholder="Betreff"
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
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div className="action-row">
          <button type="submit">Mahnung erstellen</button>
        </div>
      </form>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Mahnungsverlauf</h2>

        {mahnungen.map((m) => (
          <div key={m.id} className="list-box">
            <strong>{m.betreff || '-'}</strong>
            <br />
            Mahnstufe: {m.mahnstufe || 0}
            <br />
            Erstellt: {m.erstellt_am ? new Date(m.erstellt_am).toLocaleString('de-DE') : '-'}
            <br />
            Text: {m.text || '-'}
            <br />
            Notiz: {m.notiz || '-'}
            <br />
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={m.status || 'erstellt'} />
            </div>

            <div className="action-row" style={{ marginTop: 10 }}>
              <Link
                href="/zahlungen"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Zahlung prüfen
              </Link>
              <Link
                href="/forderungen"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Forderung öffnen
              </Link>
            </div>
          </div>
        ))}

        {mahnungen.length === 0 && <div className="muted">Noch keine Mahnungen vorhanden.</div>}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}