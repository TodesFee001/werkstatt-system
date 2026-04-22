'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  brutto_summe: number | null
  status: string | null
  offener_betrag: number | null
}

type Zahlung = {
  id: string
  rechnung_id: string | null
  zahlungsdatum: string | null
  betrag: number | null
  zahlungsart: string | null
  status: string | null
  referenz: string | null
  bemerkung: string | null
  storniert: boolean | null
}

function ZahlungenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])

  const [zahlungRechnungId, setZahlungRechnungId] = useState('')
  const [zahlungBetrag, setZahlungBetrag] = useState('')
  const [zahlungArt, setZahlungArt] = useState('bar')
  const [zahlungStatus, setZahlungStatus] = useState('gebucht')
  const [zahlungReferenz, setZahlungReferenz] = useState('')
  const [zahlungBemerkung, setZahlungBemerkung] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenBetrag, setBearbeitenBetrag] = useState('')
  const [bearbeitenArt, setBearbeitenArt] = useState('bar')
  const [bearbeitenStatus, setBearbeitenStatus] = useState('gebucht')
  const [bearbeitenReferenz, setBearbeitenReferenz] = useState('')
  const [bearbeitenBemerkung, setBearbeitenBemerkung] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeKunden() {
    const { data, error } = await supabase.from('kunden').select('*')
    if (error) return setFehler(error.message)
    setKunden(data || [])
  }

  async function ladeRechnungen() {
    const { data, error } = await supabase.from('rechnungen').select('*')
    if (error) return setFehler(error.message)
    setRechnungen(data || [])
  }

  async function ladeZahlungen() {
    const { data, error } = await supabase
      .from('zahlungen')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return setFehler(error.message)
    setZahlungen(data || [])
  }

  useEffect(() => {
    ladeKunden()
    ladeRechnungen()
    ladeZahlungen()
  }, [])

  function berechneRechnungsstatus(brutto: number, offen: number) {
    if (offen <= 0) return 'bezahlt'
    if (offen < brutto) return 'teilbezahlt'
    return 'offen'
  }

  async function zahlungAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!zahlungRechnungId) return setFehler('Bitte eine Rechnung auswählen.')
    if (!zahlungBetrag) return setFehler('Bitte einen Betrag eingeben.')

    const betrag = Number(zahlungBetrag)
    if (betrag <= 0) return setFehler('Betrag muss größer als 0 sein.')

    const { error } = await supabase.from('zahlungen').insert({
      rechnung_id: zahlungRechnungId,
      zahlungsdatum: new Date().toISOString().slice(0, 10),
      betrag,
      zahlungsart: zahlungArt,
      status: zahlungStatus,
      referenz: zahlungReferenz || null,
      bemerkung: zahlungBemerkung || null,
      storniert: false,
    })

    if (error) return setFehler(error.message)

    const { data: rechnung } = await supabase
      .from('rechnungen')
      .select('*')
      .eq('id', zahlungRechnungId)
      .single()

    if (rechnung) {
      const brutto = Number(rechnung.brutto_summe || 0)
      const neuerOffenerBetrag = Math.max(Number(rechnung.offener_betrag || 0) - betrag, 0)
      const neuerStatus = berechneRechnungsstatus(brutto, neuerOffenerBetrag)

      await supabase
        .from('rechnungen')
        .update({
          offener_betrag: neuerOffenerBetrag,
          status: neuerStatus,
        })
        .eq('id', zahlungRechnungId)
    }

    setZahlungRechnungId('')
    setZahlungBetrag('')
    setZahlungArt('bar')
    setZahlungStatus('gebucht')
    setZahlungReferenz('')
    setZahlungBemerkung('')

    ladeZahlungen()
    ladeRechnungen()
  }

  function bearbeitenStarten(zahlung: Zahlung) {
    setBearbeitenId(zahlung.id)
    setBearbeitenBetrag(String(zahlung.betrag ?? ''))
    setBearbeitenArt(zahlung.zahlungsart || 'bar')
    setBearbeitenStatus(zahlung.status || 'gebucht')
    setBearbeitenReferenz(zahlung.referenz || '')
    setBearbeitenBemerkung(zahlung.bemerkung || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenBetrag('')
    setBearbeitenArt('bar')
    setBearbeitenStatus('gebucht')
    setBearbeitenReferenz('')
    setBearbeitenBemerkung('')
  }

  async function zahlungSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    const { error } = await supabase
      .from('zahlungen')
      .update({
        betrag: bearbeitenBetrag ? Number(bearbeitenBetrag) : 0,
        zahlungsart: bearbeitenArt,
        status: bearbeitenStatus,
        referenz: bearbeitenReferenz || null,
        bemerkung: bearbeitenBemerkung || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeZahlungen()
    ladeRechnungen()
  }

  async function zahlungStornieren(zahlung: Zahlung) {
    const bestaetigt = window.confirm('Zahlung wirklich stornieren?')
    if (!bestaetigt) return
    if (zahlung.storniert) return

    const { error: updateError } = await supabase
      .from('zahlungen')
      .update({
        storniert: true,
        status: 'storniert',
      })
      .eq('id', zahlung.id)

    if (updateError) {
      setFehler(updateError.message)
      return
    }

    if (zahlung.rechnung_id) {
      const { data: rechnung } = await supabase
        .from('rechnungen')
        .select('*')
        .eq('id', zahlung.rechnung_id)
        .single()

      if (rechnung) {
        const brutto = Number(rechnung.brutto_summe || 0)
        const neuerOffenerBetrag = Math.min(
          Number(rechnung.offener_betrag || 0) + Number(zahlung.betrag || 0),
          brutto
        )
        const neuerStatus = berechneRechnungsstatus(brutto, neuerOffenerBetrag)

        await supabase
          .from('rechnungen')
          .update({
            offener_betrag: neuerOffenerBetrag,
            status: neuerStatus,
          })
          .eq('id', zahlung.rechnung_id)
      }
    }

    ladeZahlungen()
    ladeRechnungen()
  }

  async function zahlungLoeschen(id: string) {
    const bestaetigt = window.confirm('Zahlung wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase.from('zahlungen').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (bearbeitenId === id) {
      bearbeitenAbbrechen()
    }

    ladeZahlungen()
    ladeRechnungen()
  }

  return (
    <div className="page-card">
      <h1>Zahlungen</h1>

      <form onSubmit={zahlungAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <select
            value={zahlungRechnungId}
            onChange={(e) => setZahlungRechnungId(e.target.value)}
            style={{ minWidth: 260 }}
          >
            <option value="">Rechnung auswählen</option>
            {rechnungen.map((rechnung) => {
              const kunde = kunden.find((k) => k.id === rechnung.kunde_id)
              return (
                <option key={rechnung.id} value={rechnung.id}>
                  {(rechnung.rechnungsnummer || 'Rechnung')} – {(kunde?.firmenname || `${kunde?.vorname || ''} ${kunde?.nachname || ''}`.trim() || 'Kunde')} – offen {rechnung.offener_betrag ?? 0} €
                </option>
              )
            })}
          </select>

          <input placeholder="Betrag" value={zahlungBetrag} onChange={(e) => setZahlungBetrag(e.target.value)} />
          <select value={zahlungArt} onChange={(e) => setZahlungArt(e.target.value)}>
            <option value="bar">bar</option>
            <option value="ec_karte">ec_karte</option>
            <option value="kreditkarte">kreditkarte</option>
            <option value="ueberweisung">ueberweisung</option>
            <option value="paypal">paypal</option>
            <option value="sonstige">sonstige</option>
          </select>
          <select value={zahlungStatus} onChange={(e) => setZahlungStatus(e.target.value)}>
            <option value="gebucht">gebucht</option>
            <option value="vorgemerkt">vorgemerkt</option>
            <option value="fehlgeschlagen">fehlgeschlagen</option>
            <option value="storniert">storniert</option>
            <option value="rueckerstattet">rueckerstattet</option>
          </select>
          <input placeholder="Referenz" value={zahlungReferenz} onChange={(e) => setZahlungReferenz(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Bemerkung"
            value={zahlungBemerkung}
            onChange={(e) => setZahlungBemerkung(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Zahlung anlegen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={zahlungSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Zahlung bearbeiten</h3>

          <div className="form-row">
            <input placeholder="Betrag" value={bearbeitenBetrag} onChange={(e) => setBearbeitenBetrag(e.target.value)} />
            <select value={bearbeitenArt} onChange={(e) => setBearbeitenArt(e.target.value)}>
              <option value="bar">bar</option>
              <option value="ec_karte">ec_karte</option>
              <option value="kreditkarte">kreditkarte</option>
              <option value="ueberweisung">ueberweisung</option>
              <option value="paypal">paypal</option>
              <option value="sonstige">sonstige</option>
            </select>
            <select value={bearbeitenStatus} onChange={(e) => setBearbeitenStatus(e.target.value)}>
              <option value="gebucht">gebucht</option>
              <option value="vorgemerkt">vorgemerkt</option>
              <option value="fehlgeschlagen">fehlgeschlagen</option>
              <option value="storniert">storniert</option>
              <option value="rueckerstattet">rueckerstattet</option>
            </select>
            <input placeholder="Referenz" value={bearbeitenReferenz} onChange={(e) => setBearbeitenReferenz(e.target.value)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Bemerkung"
              value={bearbeitenBemerkung}
              onChange={(e) => setBearbeitenBemerkung(e.target.value)}
              style={{ width: '100%', minHeight: 90 }}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div>
        {zahlungen.map((zahlung) => {
          const rechnung = rechnungen.find((r) => r.id === zahlung.rechnung_id)
          const kunde = kunden.find((k) => k.id === rechnung?.kunde_id)

          return (
            <div key={zahlung.id} className="list-box">
              <strong>
                {kunde
                  ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
                  : 'Unbekannter Kunde'}
              </strong>
              <br />
              Rechnung: {rechnung?.rechnungsnummer || rechnung?.id || '-'}
              <br />
              Betrag: {zahlung.betrag ?? 0} €
              <br />
              Zahlungsart: {zahlung.zahlungsart || '-'}
              <br />
              Status: {zahlung.status || '-'}
              <br />
              Storniert: {zahlung.storniert ? 'ja' : 'nein'}
              <br />
              Zahlungsdatum: {zahlung.zahlungsdatum || '-'}
              <br />
              Referenz: {zahlung.referenz || '-'}
              <br />
              Bemerkung: {zahlung.bemerkung || '-'}

              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => bearbeitenStarten(zahlung)}>
                  Bearbeiten
                </button>
                <button type="button" onClick={() => zahlungStornieren(zahlung)}>
                  Stornieren
                </button>
                <button type="button" onClick={() => zahlungLoeschen(zahlung.id)} style={{ background: '#dc2626' }}>
                  Löschen
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function ZahlungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <ZahlungenPageContent />
    </RoleGuard>
  )
}