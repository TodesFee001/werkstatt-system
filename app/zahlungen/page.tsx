'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  status: string | null
  faellig_am: string | null
  mahnstufe: number | null
  letzte_mahnung_am: string | null
  forderungsstatus: string | null
}

type Zahlung = {
  id: string
  rechnung_id: string | null
  zahlungsdatum: string | null
  betrag: number | null
  status: string | null
  zahlungsart: string | null
  notiz: string | null
}

const ZAHLUNGSSTATUS = ['offen', 'teilbezahlt', 'bezahlt', 'storniert'] as const

export default function ZahlungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Serviceannahme', 'Behördenvertreter']}>
      <ZahlungenPageContent />
    </RoleGuard>
  )
}

function ZahlungenPageContent() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])

  const [rechnungId, setRechnungId] = useState('')
  const [zahlungsdatum, setZahlungsdatum] = useState(new Date().toISOString().slice(0, 10))
  const [betrag, setBetrag] = useState('')
  const [status, setStatus] = useState<(typeof ZAHLUNGSSTATUS)[number]>('bezahlt')
  const [zahlungsart, setZahlungsart] = useState('bar')
  const [notiz, setNotiz] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const [rRes, zRes] = await Promise.all([
      supabase.from('rechnungen').select('*').order('created_at', { ascending: false }),
      supabase.from('zahlungen').select('*').order('zahlungsdatum', { ascending: false }),
    ])

    if (rRes.error || zRes.error) {
      setFehler(rRes.error?.message || zRes.error?.message || '')
      return
    }

    setRechnungen((rRes.data || []) as Rechnung[])
    setZahlungen((zRes.data || []) as Zahlung[])
  }

  useEffect(() => {
    laden()
  }, [])

  async function zahlungSpeichern(e: React.FormEvent) {
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

    const zahlungsbetrag = Number(betrag || 0)

    const insertRes = await supabase.from('zahlungen').insert({
      rechnung_id: rechnungId,
      zahlungsdatum,
      betrag: zahlungsbetrag,
      status,
      zahlungsart,
      notiz: notiz || null,
    })

    if (insertRes.error) {
      setFehler(insertRes.error.message)
      return
    }

    let neuerOffenerBetrag = Number(rechnung.offener_betrag || 0)

    if (status === 'bezahlt' || status === 'teilbezahlt') {
      neuerOffenerBetrag = Math.max(0, neuerOffenerBetrag - zahlungsbetrag)
    }

    let neuerStatus = rechnung.status || 'offen'
    let neuerForderungsstatus = rechnung.forderungsstatus || 'offen'

    if (status === 'storniert') {
      neuerStatus = 'offen'
      neuerForderungsstatus = 'offen'
    } else if (neuerOffenerBetrag <= 0) {
      neuerStatus = 'bezahlt'
      neuerForderungsstatus = 'bezahlt'
    } else if (zahlungsbetrag > 0) {
      neuerStatus = 'teilbezahlt'
      neuerForderungsstatus = 'offen'
    } else if (status === 'offen') {
      neuerStatus = 'offen'
      neuerForderungsstatus = 'offen'
    }

    const updateRes = await supabase
      .from('rechnungen')
      .update({
        offener_betrag: neuerOffenerBetrag,
        status: neuerStatus,
        forderungsstatus: neuerForderungsstatus,
      })
      .eq('id', rechnungId)

    if (updateRes.error) {
      setFehler(updateRes.error.message)
      return
    }

    setRechnungId('')
    setZahlungsdatum(new Date().toISOString().slice(0, 10))
    setBetrag('')
    setStatus('bezahlt')
    setZahlungsart('bar')
    setNotiz('')
    setMeldung('Zahlung wurde gespeichert.')
    laden()
  }

  async function mahnlogikJetztPruefen() {
    setFehler('')
    setMeldung('')

    const heute = new Date()

    for (const rechnung of rechnungen) {
      const offen = Number(rechnung.offener_betrag || 0) > 0
      if (!offen) continue
      if (!rechnung.faellig_am) continue

      const faellig = new Date(rechnung.faellig_am)
      if (faellig.getTime() > heute.getTime()) continue

      const letzteMahnung = rechnung.letzte_mahnung_am
        ? new Date(rechnung.letzte_mahnung_am)
        : null

      let neueStufe = Number(rechnung.mahnstufe || 0)
      const tageSeitLetzterMahnung = letzteMahnung
        ? Math.floor((heute.getTime() - letzteMahnung.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      if (!letzteMahnung || tageSeitLetzterMahnung >= 7) {
        neueStufe += 1

        let neuerForderungsstatus = 'zahlungserinnerung'
        if (neueStufe === 1) neuerForderungsstatus = 'mahnung_1'
        if (neueStufe === 2) neuerForderungsstatus = 'mahnung_2'
        if (neueStufe >= 3) neuerForderungsstatus = 'mahnung_3'

        await supabase.from('mahnungen').insert({
          rechnung_id: rechnung.id,
          mahnstufe: neueStufe,
          betreff: `Automatische Mahnung Stufe ${neueStufe}`,
          text: `Automatisch erzeugte Mahnung für Rechnung ${rechnung.rechnungsnummer || rechnung.id}.`,
          status: 'erstellt',
          notiz: 'Automatisch durch Zahlungsprüfung gesetzt',
        })

        await supabase
          .from('rechnungen')
          .update({
            mahnstufe: neueStufe,
            letzte_mahnung_am: heute.toISOString(),
            status: 'ueberfaellig',
            forderungsstatus: neuerForderungsstatus,
          })
          .eq('id', rechnung.id)
      }
    }

    setMeldung('Automatische Mahnlogik wurde ausgeführt.')
    laden()
  }

  const aktiveRechnungen = useMemo(() => {
    return rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0)
  }, [rechnungen])

  const sichtbareZahlungen = useMemo(() => {
    return zahlungen.filter((z) => {
      const rechnung = rechnungen.find((r) => r.id === z.rechnung_id)
      if (!rechnung) return true
      return Number(rechnung.offener_betrag || 0) > 0
    })
  }, [zahlungen, rechnungen])

  const statistik = useMemo(() => {
    const gesamtZahlungen = zahlungen.reduce((sum, z) => sum + Number(z.betrag || 0), 0)
    const gesamtOffen = rechnungen.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0)
    const bezahlteRechnungen = rechnungen.filter(
      (r) => String(r.status || '').toLowerCase() === 'bezahlt'
    ).length

    return {
      gesamtZahlungen,
      gesamtOffen,
      bezahlteRechnungen,
    }
  }, [zahlungen, rechnungen])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Zahlungen</h1>
          <div className="topbar-subtitle">
            Vollständig bezahlte Vorgänge verschwinden aus der Standardliste, bleiben aber für Historie und Statistik erhalten.
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">
          Gesamtzahlungen
          <strong>{statistik.gesamtZahlungen.toFixed(2)} €</strong>
        </div>
        <div className="kpi-pill">
          Offen gesamt
          <strong>{statistik.gesamtOffen.toFixed(2)} €</strong>
        </div>
        <div className="kpi-pill">
          Bezahlte Rechnungen
          <strong>{statistik.bezahlteRechnungen}</strong>
        </div>
      </div>

      <form onSubmit={zahlungSpeichern} className="page-card">
        <h2 style={{ marginTop: 0 }}>Zahlung erfassen</h2>

        <div className="form-row">
          <select value={rechnungId} onChange={(e) => setRechnungId(e.target.value)}>
            <option value="">Rechnung auswählen</option>
            {aktiveRechnungen.map((r) => (
              <option key={r.id} value={r.id}>
                {r.rechnungsnummer || r.id} – offen {Number(r.offener_betrag || 0).toFixed(2)} €
              </option>
            ))}
          </select>

          <input
            type="date"
            value={zahlungsdatum}
            onChange={(e) => setZahlungsdatum(e.target.value)}
          />

          <input
            placeholder="Betrag"
            value={betrag}
            onChange={(e) => setBetrag(e.target.value)}
          />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof ZAHLUNGSSTATUS)[number])}
          >
            <option value="offen">offen</option>
            <option value="teilbezahlt">teilbezahlt</option>
            <option value="bezahlt">bezahlt</option>
            <option value="storniert">storniert</option>
          </select>

          <select value={zahlungsart} onChange={(e) => setZahlungsart(e.target.value)}>
            <option value="bar">bar</option>
            <option value="ueberweisung">überweisung</option>
            <option value="karte">karte</option>
            <option value="sonstiges">sonstiges</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Notiz"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        </div>

        <div className="action-row">
          <button type="submit">Zahlung speichern</button>
          <button type="button" onClick={mahnlogikJetztPruefen}>
            Mahnlogik ausführen
          </button>
        </div>
      </form>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Aktive offene Rechnungen</h2>

        {aktiveRechnungen.map((r) => (
          <div key={r.id} className="list-box">
            <strong>{r.rechnungsnummer || r.id}</strong>
            <br />
            Offen: {Number(r.offener_betrag || 0).toFixed(2)} €
            <br />
            Fällig am: {r.faellig_am || '-'}
            <br />
            Mahnstufe: {r.mahnstufe || 0}
            <br />
            <StatusBadge status={r.status || 'offen'} />
          </div>
        ))}

        {aktiveRechnungen.length === 0 && (
          <div className="muted">Keine aktiven offenen Rechnungen vorhanden.</div>
        )}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Aktive Zahlungen</h2>

        {sichtbareZahlungen.map((z) => (
          <div key={z.id} className="list-box">
            <strong>{z.rechnung_id || '-'}</strong>
            <br />
            Datum: {z.zahlungsdatum || '-'}
            <br />
            Betrag: {Number(z.betrag || 0).toFixed(2)} €
            <br />
            Art: {z.zahlungsart || '-'}
            <br />
            Notiz: {z.notiz || '-'}
            <br />
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={z.status || 'offen'} />
            </div>
          </div>
        ))}

        {sichtbareZahlungen.length === 0 && (
          <div className="muted">Keine aktiven Zahlungen vorhanden.</div>
        )}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}