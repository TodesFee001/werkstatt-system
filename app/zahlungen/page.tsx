'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '@/components/RoleGuard'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Rechnung = {
  id: string
  kunde_id: string | null
  brutto_summe: number | null
  status: string | null
}

type Zahlung = {
  id: string
  rechnung_id: string | null
  zahlungsdatum: string | null
  betrag: number | null
  zahlungsart: string | null
  status: string | null
  referenz: string | null
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

async function zahlungAnlegen(e: React.FormEvent) {
  e.preventDefault()
  setFehler('')

  if (!zahlungRechnungId) return setFehler('Bitte eine Rechnung auswählen.')
  if (!zahlungBetrag) return setFehler('Bitte einen Betrag eingeben.')

  const betrag = Number(zahlungBetrag)

  // 1. Zahlung speichern
  const { error } = await supabase.from('zahlungen').insert({
    rechnung_id: zahlungRechnungId,
    zahlungsdatum: new Date().toISOString().slice(0, 10),
    betrag,
    zahlungsart: zahlungArt,
    status: zahlungStatus,
    referenz: zahlungReferenz || null,
  })

  if (error) return setFehler(error.message)

  // 2. Rechnung laden
  const { data: rechnung } = await supabase
    .from('rechnungen')
    .select('*')
    .eq('id', zahlungRechnungId)
    .single()

  if (!rechnung) return

  const neuerOffenerBetrag =
    (rechnung.offener_betrag || 0) - betrag

  let neuerStatus = 'offen'

  if (neuerOffenerBetrag <= 0) {
    neuerStatus = 'bezahlt'
  } else if (neuerOffenerBetrag < (rechnung.brutto_summe || 0)) {
    neuerStatus = 'teilbezahlt'
  }

  // 3. Rechnung aktualisieren
  await supabase
    .from('rechnungen')
    .update({
      offener_betrag: Math.max(neuerOffenerBetrag, 0),
      status: neuerStatus,
    })
    .eq('id', zahlungRechnungId)

  // Reset
  setZahlungRechnungId('')
  setZahlungBetrag('')
  setZahlungArt('bar')
  setZahlungStatus('gebucht')
  setZahlungReferenz('')

  ladeZahlungen()
}

    if (!zahlungRechnungId) return setFehler('Bitte eine Rechnung auswählen.')
    if (!zahlungBetrag) return setFehler('Bitte einen Betrag eingeben.')

    const { error } = await supabase.from('zahlungen').insert({
      rechnung_id: zahlungRechnungId,
      zahlungsdatum: new Date().toISOString().slice(0, 10),
      betrag: Number(zahlungBetrag),
      zahlungsart: zahlungArt,
      status: zahlungStatus,
      referenz: zahlungReferenz || null,
    })

    if (error) return setFehler(error.message)

    setZahlungRechnungId('')
    setZahlungBetrag('')
    setZahlungArt('bar')
    setZahlungStatus('gebucht')
    setZahlungReferenz('')
    ladeZahlungen()
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
                  {(kunde?.firmenname || `${kunde?.vorname || ''} ${kunde?.nachname || ''}`.trim() || 'Kunde')} – {rechnung.brutto_summe ?? 0} € – {rechnung.status || '-'}
                </option>
              )
            })}
          </select>

          <input
            placeholder="Betrag"
            value={zahlungBetrag}
            onChange={(e) => setZahlungBetrag(e.target.value)}
            style={{ minWidth: 120 }}
          />

          <select
            value={zahlungArt}
            onChange={(e) => setZahlungArt(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="bar">bar</option>
            <option value="ec_karte">ec_karte</option>
            <option value="kreditkarte">kreditkarte</option>
            <option value="ueberweisung">ueberweisung</option>
            <option value="paypal">paypal</option>
            <option value="sonstige">sonstige</option>
          </select>

          <select
            value={zahlungStatus}
            onChange={(e) => setZahlungStatus(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="gebucht">gebucht</option>
            <option value="vorgemerkt">vorgemerkt</option>
            <option value="fehlgeschlagen">fehlgeschlagen</option>
            <option value="storniert">storniert</option>
            <option value="rueckerstattet">rueckerstattet</option>
          </select>

          <input
            placeholder="Referenz"
            value={zahlungReferenz}
            onChange={(e) => setZahlungReferenz(e.target.value)}
            style={{ minWidth: 180 }}
          />
        </div>

        <button type="submit">Zahlung anlegen</button>
      </form>

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
              Betrag: {zahlung.betrag ?? 0} €
              <br />
              Zahlungsart: {zahlung.zahlungsart || '-'}
              <br />
              Status: {zahlung.status || '-'}
              <br />
              Zahlungsdatum: {zahlung.zahlungsdatum || '-'}
              <br />
              Referenz: {zahlung.referenz || '-'}
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