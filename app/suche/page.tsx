'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  email: string | null
  telefon: string | null
  ort: string | null
}

type Fahrzeug = {
  id: string
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  fahrgestellnummer: string | null
  kunde_id: string | null
}

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
  fehlerbeschreibung: string | null
  kunde_id: string | null
  fahrzeug_id: string | null
}

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  status: string | null
  kunde_id: string | null
}

type Angebot = {
  id: string
  angebotsnummer: string | null
  status: string | null
  kunde_id: string | null
}

function textMatch(q: string, values: Array<string | null | undefined>) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  return values.some((v) => (v || '').toLowerCase().includes(query))
}

function SuchePageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [angebote, setAngebote] = useState<Angebot[]>([])

  const [query, setQuery] = useState('')
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [kundenRes, fahrzeugeRes, serviceRes, rechnungenRes, angeboteRes] =
      await Promise.all([
        supabase.from('kunden').select('*'),
        supabase.from('fahrzeuge').select('*'),
        supabase.from('serviceauftraege').select('*'),
        supabase.from('rechnungen').select('*'),
        supabase.from('angebote').select('*'),
      ])

    const error =
      kundenRes.error ||
      fahrzeugeRes.error ||
      serviceRes.error ||
      rechnungenRes.error ||
      angeboteRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden(kundenRes.data || [])
    setFahrzeuge(fahrzeugeRes.data || [])
    setServiceauftraege(serviceRes.data || [])
    setRechnungen(rechnungenRes.data || [])
    setAngebote(angeboteRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  const kundenGefiltert = useMemo(
    () =>
      kunden.filter((k) =>
        textMatch(query, [
          k.vorname,
          k.nachname,
          k.firmenname,
          k.email,
          k.telefon,
          k.ort,
        ])
      ),
    [kunden, query]
  )

  const fahrzeugeGefiltert = useMemo(
    () =>
      fahrzeuge.filter((f) =>
        textMatch(query, [
          f.kennzeichen,
          f.marke,
          f.modell,
          f.fahrgestellnummer,
        ])
      ),
    [fahrzeuge, query]
  )

  const serviceGefiltert = useMemo(
    () =>
      serviceauftraege.filter((s) =>
        textMatch(query, [s.art, s.status, s.fehlerbeschreibung, s.id])
      ),
    [serviceauftraege, query]
  )

  const rechnungenGefiltert = useMemo(
    () =>
      rechnungen.filter((r) =>
        textMatch(query, [r.rechnungsnummer, r.status, r.id])
      ),
    [rechnungen, query]
  )

  const angeboteGefiltert = useMemo(
    () =>
      angebote.filter((a) =>
        textMatch(query, [a.angebotsnummer, a.status, a.id])
      ),
    [angebote, query]
  )

  function kundeName(id: string | null) {
    if (!id) return '-'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return '-'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  return (
    <div className="page-card">
      <h1>Suche</h1>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <input
          placeholder="Suche nach Kunde, Kennzeichen, Rechnung, Angebot, Serviceauftrag ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <h2>Kunden</h2>
      <div>
        {kundenGefiltert.map((k) => (
          <div key={k.id} className="list-box">
            <strong>{k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim()}</strong>
            <br />
            {k.email || '-'} | {k.telefon || '-'} | {k.ort || '-'}
            <br />
            <Link href={`/kunden/${k.id}`}>Zur Kundendetailseite</Link>
          </div>
        ))}
      </div>

      <h2>Fahrzeuge</h2>
      <div>
        {fahrzeugeGefiltert.map((f) => (
          <div key={f.id} className="list-box">
            <strong>{f.kennzeichen || '-'}</strong> – {f.marke || '-'} {f.modell || '-'}
            <br />
            FIN: {f.fahrgestellnummer || '-'}
            <br />
            <Link href={`/fahrzeuge/${f.id}`}>Zur Fahrzeugdetailseite</Link>
          </div>
        ))}
      </div>

      <h2>Serviceaufträge</h2>
      <div>
        {serviceGefiltert.map((s) => (
          <div key={s.id} className="list-box">
            <strong>{s.art || '-'}</strong> – {s.status || '-'}
            <br />
            Kunde: {kundeName(s.kunde_id)}
            <br />
            <Link href={`/serviceauftraege/${s.id}`}>Zur Auftragsdetailseite</Link>
          </div>
        ))}
      </div>

      <h2>Rechnungen</h2>
      <div>
        {rechnungenGefiltert.map((r) => (
          <div key={r.id} className="list-box">
            <strong>{r.rechnungsnummer || r.id}</strong> – {r.status || '-'}
            <br />
            Kunde: {kundeName(r.kunde_id)}
            <br />
            <Link href={`/rechnungen/${r.id}`}>Zur Rechnung</Link>
          </div>
        ))}
      </div>

      <h2>Angebote</h2>
      <div>
        {angeboteGefiltert.map((a) => (
          <div key={a.id} className="list-box">
            <strong>{a.angebotsnummer || a.id}</strong> – {a.status || '-'}
            <br />
            Kunde: {kundeName(a.kunde_id)}
            <br />
            <Link href={`/angebote/${a.id}`}>Zum Angebot</Link>
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function SuchePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Lager']}>
      <SuchePageContent />
    </RoleGuard>
  )
}