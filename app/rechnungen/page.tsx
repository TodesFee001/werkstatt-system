'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Fahrzeug = {
  id: string
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  kunde_id: string | null
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  fahrzeug_id: string | null
  status: string | null
  art: string | null
}

type Rechnung = {
  id: string
  kunde_id: string | null
  serviceauftrag_id: string | null
  rechnungsdatum: string | null
  status: string | null
  brutto_summe: number | null
  netto_summe: number | null
  steuer_summe: number | null
  offener_betrag: number | null
}

export default function RechnungenPage() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])

  const [rechnungKundeId, setRechnungKundeId] = useState('')
  const [rechnungServiceauftragId, setRechnungServiceauftragId] = useState('')
  const [rechnungStatus, setRechnungStatus] = useState('offen')
  const [nettoSumme, setNettoSumme] = useState('')
  const [steuerSumme, setSteuerSumme] = useState('')
  const [bruttoSumme, setBruttoSumme] = useState('')
  const [offenerBetrag, setOffenerBetrag] = useState('')
  const [fehler, setFehler] = useState('')

  async function ladeKunden() {
    const { data, error } = await supabase.from('kunden').select('*')
    if (error) return setFehler(error.message)
    setKunden(data || [])
  }

  async function ladeFahrzeuge() {
    const { data, error } = await supabase.from('fahrzeuge').select('*')
    if (error) return setFehler(error.message)
    setFahrzeuge(data || [])
  }

  async function ladeServiceauftraege() {
    const { data, error } = await supabase.from('serviceauftraege').select('*')
    if (error) return setFehler(error.message)
    setServiceauftraege(data || [])
  }

  async function ladeRechnungen() {
    const { data, error } = await supabase
      .from('rechnungen')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return setFehler(error.message)
    setRechnungen(data || [])
  }

  useEffect(() => {
    ladeKunden()
    ladeFahrzeuge()
    ladeServiceauftraege()
    ladeRechnungen()
  }, [])

  async function rechnungAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!rechnungKundeId) return setFehler('Bitte einen Kunden auswählen.')

    const { error } = await supabase.from('rechnungen').insert({
      kunde_id: rechnungKundeId,
      serviceauftrag_id: rechnungServiceauftragId || null,
      rechnungsdatum: new Date().toISOString().slice(0, 10),
      status: rechnungStatus,
      netto_summe: nettoSumme ? Number(nettoSumme) : 0,
      steuer_summe: steuerSumme ? Number(steuerSumme) : 0,
      brutto_summe: bruttoSumme ? Number(bruttoSumme) : 0,
      offener_betrag: offenerBetrag ? Number(offenerBetrag) : 0,
      zahlungsziel_tage: 14,
      waehrung: 'EUR',
    })

    if (error) return setFehler(error.message)

    setRechnungKundeId('')
    setRechnungServiceauftragId('')
    setRechnungStatus('offen')
    setNettoSumme('')
    setSteuerSumme('')
    setBruttoSumme('')
    setOffenerBetrag('')
    ladeRechnungen()
  }

  const serviceauftraegeZumGewaehltenKunden = serviceauftraege.filter(
    (s) => s.kunde_id === rechnungKundeId
  )

  return (
    <div>
      <h1>Rechnungen</h1>

      <form onSubmit={rechnungAnlegen} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <select
            value={rechnungKundeId}
            onChange={(e) => {
              setRechnungKundeId(e.target.value)
              setRechnungServiceauftragId('')
            }}
            style={{ padding: 8, minWidth: 220 }}
          >
            <option value="">Kunde auswählen</option>
            {kunden.map((kunde) => (
              <option key={kunde.id} value={kunde.id}>
                {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
              </option>
            ))}
          </select>

          <select
            value={rechnungServiceauftragId}
            onChange={(e) => setRechnungServiceauftragId(e.target.value)}
            style={{ padding: 8, minWidth: 260 }}
          >
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraegeZumGewaehltenKunden.map((auftrag) => {
              const fahrzeug = fahrzeuge.find((f) => f.id === auftrag.fahrzeug_id)
              return (
                <option key={auftrag.id} value={auftrag.id}>
                  {(fahrzeug?.kennzeichen || '-')} – {auftrag.art || '-'} – {auftrag.status || '-'}
                </option>
              )
            })}
          </select>

          <select
            value={rechnungStatus}
            onChange={(e) => setRechnungStatus(e.target.value)}
            style={{ padding: 8, minWidth: 160 }}
          >
            <option value="entwurf">entwurf</option>
            <option value="offen">offen</option>
            <option value="teilbezahlt">teilbezahlt</option>
            <option value="bezahlt">bezahlt</option>
            <option value="ueberfaellig">ueberfaellig</option>
            <option value="storniert">storniert</option>
          </select>

          <input
            placeholder="Netto"
            value={nettoSumme}
            onChange={(e) => setNettoSumme(e.target.value)}
            style={{ padding: 8, minWidth: 120 }}
          />
          <input
            placeholder="Steuer"
            value={steuerSumme}
            onChange={(e) => setSteuerSumme(e.target.value)}
            style={{ padding: 8, minWidth: 120 }}
          />
          <input
            placeholder="Brutto"
            value={bruttoSumme}
            onChange={(e) => setBruttoSumme(e.target.value)}
            style={{ padding: 8, minWidth: 120 }}
          />
          <input
            placeholder="Offener Betrag"
            value={offenerBetrag}
            onChange={(e) => setOffenerBetrag(e.target.value)}
            style={{ padding: 8, minWidth: 140 }}
          />
        </div>

        <button type="submit" style={{ padding: '8px 14px' }}>
          Rechnung anlegen
        </button>
      </form>

      <ul>
        {rechnungen.map((rechnung) => {
          const kunde = kunden.find((k) => k.id === rechnung.kunde_id)
          const serviceauftrag = serviceauftraege.find((s) => s.id === rechnung.serviceauftrag_id)
          const fahrzeug = fahrzeuge.find((f) => f.id === serviceauftrag?.fahrzeug_id)

          return (
            <li key={rechnung.id} style={{ marginBottom: 12 }}>
              <strong>
                {kunde
                  ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
                  : 'Unbekannter Kunde'}
              </strong>{' '}
              – {fahrzeug ? `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}` : 'ohne Fahrzeug'}
              <br />
              Status: {rechnung.status || '-'}
              <br />
              Rechnungsdatum: {rechnung.rechnungsdatum || '-'}
              <br />
              Netto: {rechnung.netto_summe ?? 0} € | Steuer: {rechnung.steuer_summe ?? 0} € | Brutto: {rechnung.brutto_summe ?? 0} €
              <br />
              Offener Betrag: {rechnung.offener_betrag ?? 0} €
            </li>
          )
        })}
      </ul>

      {fehler && <p style={{ marginTop: 20 }}>Fehler: {fehler}</p>}
    </div>
  )
}