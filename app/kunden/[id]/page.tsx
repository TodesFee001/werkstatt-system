'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  land: string | null
  email: string | null
  telefon: string | null
}

type Fahrzeug = {
  id: string
  kunde_id: string | null
  kennzeichen: string | null
  marke: string | null
  modell: string | null
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  art: string | null
  status: string | null
}

type Rechnung = {
  id: string
  kunde_id: string | null
  rechnungsnummer: string | null
  status: string | null
  brutto_summe: number | null
  offener_betrag: number | null
}

type Angebot = {
  id: string
  kunde_id: string | null
  angebotsnummer: string | null
  status: string | null
  brutto_summe: number | null
}

type Anhang = {
  id: string
  bezug_typ: string
  bezug_id: string
  titel: string | null
  dateiname: string
  dateipfad: string
}

export default function KundenDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [angebote, setAngebote] = useState<Angebot[]>([])
  const [anhaenge, setAnhaenge] = useState<Anhang[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [kundeRes, fahrzeugeRes, serviceRes, rechnungenRes, angeboteRes] = await Promise.all([
      supabase.from('kunden').select('*').eq('id', id).single(),
      supabase.from('fahrzeuge').select('*').eq('kunde_id', id),
      supabase.from('serviceauftraege').select('*').eq('kunde_id', id),
      supabase.from('rechnungen').select('*').eq('kunde_id', id),
      supabase.from('angebote').select('*').eq('kunde_id', id),
    ])

    const error =
      kundeRes.error ||
      fahrzeugeRes.error ||
      serviceRes.error ||
      rechnungenRes.error ||
      angeboteRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunde(kundeRes.data || null)
    setFahrzeuge(fahrzeugeRes.data || [])
    setServiceauftraege(serviceRes.data || [])
    setRechnungen(rechnungenRes.data || [])
    setAngebote(angeboteRes.data || [])

    const auftragsIds = (serviceRes.data || []).map((s) => s.id)

    if (auftragsIds.length > 0) {
      const { data: anhangData, error: anhangError } = await supabase
        .from('anhaenge')
        .select('*')
        .eq('bezug_typ', 'serviceauftrag')

      if (anhangError) {
        setFehler(anhangError.message)
        return
      }

      setAnhaenge((anhangData || []).filter((a) => auftragsIds.includes(a.bezug_id)))
    } else {
      setAnhaenge([])
    }
  }

  useEffect(() => {
    ladeAlles()
  }, [id])

  function dateiUrl(dateipfad: string) {
    return supabase.storage.from('anhaenge').getPublicUrl(dateipfad).data.publicUrl
  }

  const gesamtRechnungen = useMemo(
    () => rechnungen.reduce((sum, r) => sum + Number(r.brutto_summe || 0), 0),
    [rechnungen]
  )

  const gesamtAngebote = useMemo(
    () => angebote.reduce((sum, a) => sum + Number(a.brutto_summe || 0), 0),
    [angebote]
  )

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="page-card">
        <h1>Kundendetail</h1>

        {kunde && (
          <div className="list-box">
            <strong>{kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}</strong>
            <br />
            Adresse: {[kunde.strasse, kunde.plz, kunde.ort, kunde.land].filter(Boolean).join(', ') || '-'}
            <br />
            E-Mail: {kunde.email || '-'}
            <br />
            Telefon: {kunde.telefon || '-'}
          </div>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Fahrzeuge</div>
          <div className="stat-value">{fahrzeuge.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Serviceaufträge</div>
          <div className="stat-value">{serviceauftraege.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rechnungsvolumen</div>
          <div className="stat-value">{gesamtRechnungen.toFixed(2)} €</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Angebotsvolumen</div>
          <div className="stat-value">{gesamtAngebote.toFixed(2)} €</div>
        </div>
      </div>

      <div className="two-col">
        <div className="page-card">
          <h2>Fahrzeuge</h2>
          {fahrzeuge.map((f) => (
            <div key={f.id} className="list-box">
              <strong>{f.kennzeichen || '-'}</strong> – {f.marke || '-'} {f.modell || '-'}
              <br />
              <Link href={`/fahrzeuge/${f.id}`}>Zur Fahrzeugdetailseite</Link>
            </div>
          ))}

          <h2>Serviceaufträge</h2>
          {serviceauftraege.map((s) => (
            <div key={s.id} className="list-box">
              <strong>{s.art || '-'}</strong> – {s.status || '-'}
              <br />
              <Link href={`/serviceauftraege/${s.id}`}>Zur Auftragsdetailseite</Link>
            </div>
          ))}
        </div>

        <div className="page-card">
          <h2>Dokumente</h2>

          <h3>Rechnungen</h3>
          {rechnungen.map((r) => (
            <div key={r.id} className="list-box">
              <strong>{r.rechnungsnummer || r.id}</strong>
              <br />
              Status: {r.status || '-'}
              <br />
              Brutto: {Number(r.brutto_summe || 0).toFixed(2)} €
              <br />
              Offen: {Number(r.offener_betrag || 0).toFixed(2)} €
              <br />
              <Link href={`/rechnungen/${r.id}`}>Zur Rechnung</Link>
            </div>
          ))}

          <h3>Angebote</h3>
          {angebote.map((a) => (
            <div key={a.id} className="list-box">
              <strong>{a.angebotsnummer || a.id}</strong>
              <br />
              Status: {a.status || '-'}
              <br />
              Brutto: {Number(a.brutto_summe || 0).toFixed(2)} €
              <br />
              <Link href={`/angebote/${a.id}`}>Zum Angebot</Link>
            </div>
          ))}

          <h3>Anhänge aus Serviceaufträgen</h3>
          {anhaenge.map((a) => (
            <div key={a.id} className="list-box">
              <a href={dateiUrl(a.dateipfad)} target="_blank" rel="noreferrer">
                {a.titel || a.dateiname}
              </a>
            </div>
          ))}
        </div>
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}