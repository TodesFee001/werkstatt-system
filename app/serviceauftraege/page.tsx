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
  fehlerbeschreibung: string | null
  kilometerstand_bei_annahme: number | null
}

export default function ServiceauftraegePage() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [auftragKundeId, setAuftragKundeId] = useState('')
  const [auftragFahrzeugId, setAuftragFahrzeugId] = useState('')
  const [auftragArt, setAuftragArt] = useState('reparatur')
  const [auftragStatus, setAuftragStatus] = useState('offen')
  const [fehlerbeschreibung, setFehlerbeschreibung] = useState('')
  const [kilometerstand, setKilometerstand] = useState('')
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
    const { data, error } = await supabase
      .from('serviceauftraege')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return setFehler(error.message)
    setServiceauftraege(data || [])
  }

  useEffect(() => {
    ladeKunden()
    ladeFahrzeuge()
    ladeServiceauftraege()
  }, [])

  async function serviceauftragAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!auftragKundeId) return setFehler('Bitte einen Kunden auswählen.')
    if (!auftragFahrzeugId) return setFehler('Bitte ein Fahrzeug auswählen.')

    const { error } = await supabase.from('serviceauftraege').insert({
      kunde_id: auftragKundeId,
      fahrzeug_id: auftragFahrzeugId,
      status: auftragStatus,
      art: auftragArt,
      fehlerbeschreibung: fehlerbeschreibung || null,
      kilometerstand_bei_annahme: kilometerstand ? Number(kilometerstand) : null,
      annahme_datum: new Date().toISOString().slice(0, 10),
    })

    if (error) return setFehler(error.message)

    setAuftragKundeId('')
    setAuftragFahrzeugId('')
    setAuftragArt('reparatur')
    setAuftragStatus('offen')
    setFehlerbeschreibung('')
    setKilometerstand('')
    ladeServiceauftraege()
  }

  const fahrzeugeZumGewaehltenKunden = fahrzeuge.filter(
    (f) => f.kunde_id === auftragKundeId
  )

  return (
    <div>
      <h1>Serviceaufträge</h1>

      <form onSubmit={serviceauftragAnlegen} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <select
            value={auftragKundeId}
            onChange={(e) => {
              setAuftragKundeId(e.target.value)
              setAuftragFahrzeugId('')
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
            value={auftragFahrzeugId}
            onChange={(e) => setAuftragFahrzeugId(e.target.value)}
            style={{ padding: 8, minWidth: 220 }}
          >
            <option value="">Fahrzeug auswählen</option>
            {fahrzeugeZumGewaehltenKunden.map((fahrzeug) => (
              <option key={fahrzeug.id} value={fahrzeug.id}>
                {fahrzeug.kennzeichen || '-'} – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
              </option>
            ))}
          </select>

          <select
            value={auftragArt}
            onChange={(e) => setAuftragArt(e.target.value)}
            style={{ padding: 8, minWidth: 150 }}
          >
            <option value="reparatur">Reparatur</option>
            <option value="wartung">Wartung</option>
            <option value="diagnose">Diagnose</option>
            <option value="service">Service</option>
            <option value="garantie">Garantie</option>
            <option value="reklamation">Reklamation</option>
          </select>

          <select
            value={auftragStatus}
            onChange={(e) => setAuftragStatus(e.target.value)}
            style={{ padding: 8, minWidth: 150 }}
          >
            <option value="offen">offen</option>
            <option value="eingeplant">eingeplant</option>
            <option value="in_arbeit">in_arbeit</option>
            <option value="wartet_auf_teile">wartet_auf_teile</option>
            <option value="wartet_auf_freigabe">wartet_auf_freigabe</option>
            <option value="abgeschlossen">abgeschlossen</option>
            <option value="abgerechnet">abgerechnet</option>
            <option value="storniert">storniert</option>
          </select>

          <input
            placeholder="Kilometerstand"
            value={kilometerstand}
            onChange={(e) => setKilometerstand(e.target.value)}
            style={{ padding: 8, minWidth: 140 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <textarea
            placeholder="Fehlerbeschreibung"
            value={fehlerbeschreibung}
            onChange={(e) => setFehlerbeschreibung(e.target.value)}
            style={{ padding: 8, width: '100%', minHeight: 90 }}
          />
        </div>

        <button type="submit" style={{ padding: '8px 14px' }}>
          Serviceauftrag anlegen
        </button>
      </form>

      <ul>
        {serviceauftraege.map((auftrag) => {
          const kunde = kunden.find((k) => k.id === auftrag.kunde_id)
          const fahrzeug = fahrzeuge.find((f) => f.id === auftrag.fahrzeug_id)

          return (
            <li key={auftrag.id} style={{ marginBottom: 12 }}>
              <strong>
                {kunde
                  ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
                  : 'Unbekannter Kunde'}
              </strong>{' '}
              –{' '}
              {fahrzeug
                ? `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}`
                : 'Unbekanntes Fahrzeug'}{' '}
              – {auftrag.art || '-'} – {auftrag.status || '-'}
              <br />
              Fehler: {auftrag.fehlerbeschreibung || '-'}
              <br />
              Kilometerstand: {auftrag.kilometerstand_bei_annahme ?? '-'}
            </li>
          )
        })}
      </ul>

      {fehler && <p style={{ marginTop: 20 }}>Fehler: {fehler}</p>}
    </div>
  )
}