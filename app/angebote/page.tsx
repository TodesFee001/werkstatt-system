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
  art: string | null
}

type Angebot = {
  id: string
  angebotsnummer: string | null
  kunde_id: string | null
  serviceauftrag_id: string | null
  angebotsdatum: string | null
  status: string | null
  netto_summe: number | null
  steuer_summe: number | null
  brutto_summe: number | null
  gueltig_bis: string | null
  bemerkung: string | null
  interne_notiz: string | null
  umgewandelt_in_rechnung_id: string | null
  umgewandelt_am: string | null
  versendet_am: string | null
}

type Anhang = {
  id: string
  bezug_typ: string
  bezug_id: string
  titel: string | null
  dateiname: string
  dateipfad: string
  dateityp: string | null
}

function AngebotePageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [angebote, setAngebote] = useState<Angebot[]>([])
  const [anhaenge, setAnhaenge] = useState<Anhang[]>([])

  const [kundeId, setKundeId] = useState('')
  const [serviceauftragId, setServiceauftragId] = useState('')
  const [status, setStatus] = useState('entwurf')
  const [netto, setNetto] = useState('')
  const [steuer, setSteuer] = useState('')
  const [brutto, setBrutto] = useState('')
  const [gueltigBis, setGueltigBis] = useState('')
  const [bemerkung, setBemerkung] = useState('')
  const [interneNotiz, setInterneNotiz] = useState('')

  const [anhangAngebotId, setAnhangAngebotId] = useState('')
  const [anhangTitel, setAnhangTitel] = useState('')
  const [anhangDatei, setAnhangDatei] = useState<File | null>(null)

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [kundenRes, fahrzeugeRes, serviceRes, angeboteRes, anhaengeRes] = await Promise.all([
      supabase.from('kunden').select('*'),
      supabase.from('fahrzeuge').select('*'),
      supabase.from('serviceauftraege').select('*'),
      supabase.from('angebote').select('*').order('created_at', { ascending: false }),
      supabase.from('anhaenge').select('*').eq('bezug_typ', 'angebot').order('created_at', { ascending: false }),
    ])

    const error =
      kundenRes.error ||
      fahrzeugeRes.error ||
      serviceRes.error ||
      angeboteRes.error ||
      anhaengeRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden(kundenRes.data || [])
    setFahrzeuge(fahrzeugeRes.data || [])
    setServiceauftraege(serviceRes.data || [])
    setAngebote(angeboteRes.data || [])
    setAnhaenge(anhaengeRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function angebotAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!kundeId) {
      setFehler('Bitte einen Kunden auswählen.')
      return
    }

    const jahr = new Date().getFullYear()
    const nummer = `ANG-${jahr}-${Date.now()}`

    const { error } = await supabase.from('angebote').insert({
      angebotsnummer: nummer,
      kunde_id: kundeId,
      serviceauftrag_id: serviceauftragId || null,
      angebotsdatum: new Date().toISOString().slice(0, 10),
      status,
      netto_summe: netto ? Number(netto) : 0,
      steuer_summe: steuer ? Number(steuer) : 0,
      brutto_summe: brutto ? Number(brutto) : 0,
      gueltig_bis: gueltigBis || null,
      bemerkung: bemerkung || null,
      interne_notiz: interneNotiz || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setKundeId('')
    setServiceauftragId('')
    setStatus('entwurf')
    setNetto('')
    setSteuer('')
    setBrutto('')
    setGueltigBis('')
    setBemerkung('')
    setInterneNotiz('')
    ladeAlles()
  }

  async function angebotInRechnungUmwandeln(angebot: Angebot) {
    const bestaetigt = window.confirm('Angebot in Rechnung umwandeln?')
    if (!bestaetigt) return

    const jahr = new Date().getFullYear()
    const nummer = `RE-${jahr}-${Date.now()}`

    const { data: rechnung, error: rechnungError } = await supabase
      .from('rechnungen')
      .insert({
        rechnungsnummer: nummer,
        kunde_id: angebot.kunde_id,
        serviceauftrag_id: angebot.serviceauftrag_id,
        rechnungsdatum: new Date().toISOString().slice(0, 10),
        status: 'offen',
        netto_summe: Number(angebot.netto_summe || 0),
        steuer_summe: Number(angebot.steuer_summe || 0),
        brutto_summe: Number(angebot.brutto_summe || 0),
        offener_betrag: Number(angebot.brutto_summe || 0),
        zahlungsziel_tage: 14,
        waehrung: 'EUR',
      })
      .select()
      .single()

    if (rechnungError || !rechnung) {
      setFehler(rechnungError?.message || 'Rechnung konnte nicht erstellt werden.')
      return
    }

    const { error: updateError } = await supabase
      .from('angebote')
      .update({
        status: 'angenommen',
        umgewandelt_in_rechnung_id: rechnung.id,
        umgewandelt_am: new Date().toISOString(),
      })
      .eq('id', angebot.id)

    if (updateError) {
      setFehler(updateError.message)
      return
    }

    ladeAlles()
  }

  async function angebotStatusSetzen(id: string, neuerStatus: string) {
    const updateObj: any = { status: neuerStatus }

    if (neuerStatus === 'gesendet') {
      updateObj.versendet_am = new Date().toISOString()
    }

    const { error } = await supabase
      .from('angebote')
      .update(updateObj)
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  async function anhangHochladen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!anhangAngebotId) {
      setFehler('Bitte ein Angebot auswählen.')
      return
    }

    if (!anhangDatei) {
      setFehler('Bitte eine Datei auswählen.')
      return
    }

    const dateiname = `${Date.now()}-${anhangDatei.name}`

    const { error: uploadError } = await supabase.storage
      .from('anhaenge')
      .upload(dateiname, anhangDatei)

    if (uploadError) {
      setFehler(uploadError.message)
      return
    }

    const { error } = await supabase.from('anhaenge').insert({
      bezug_typ: 'angebot',
      bezug_id: anhangAngebotId,
      titel: anhangTitel || null,
      dateiname: anhangDatei.name,
      dateipfad: dateiname,
      dateityp: anhangDatei.type || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setAnhangAngebotId('')
    setAnhangTitel('')
    setAnhangDatei(null)
    ladeAlles()
  }

  function kundeName(id: string | null) {
    if (!id) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return 'Unbekannter Kunde'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  function fahrzeugName(serviceauftragId: string | null) {
    if (!serviceauftragId) return '-'
    const auftrag = serviceauftraege.find((s) => s.id === serviceauftragId)
    const fahrzeug = fahrzeuge.find((f) => f.id === auftrag?.fahrzeug_id)
    if (!fahrzeug) return '-'
    return `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}`
  }

  function anhaengeVonAngebot(angebotId: string) {
    return anhaenge.filter((a) => a.bezug_id === angebotId)
  }

  function dateiUrl(dateipfad: string) {
    return supabase.storage.from('anhaenge').getPublicUrl(dateipfad).data.publicUrl
  }

  return (
    <div className="page-card">
      <h1>Angebote</h1>

      <form onSubmit={angebotAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <select value={kundeId} onChange={(e) => setKundeId(e.target.value)}>
            <option value="">Kunde auswählen</option>
            {kunden.map((kunde) => (
              <option key={kunde.id} value={kunde.id}>
                {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
              </option>
            ))}
          </select>

          <select value={serviceauftragId} onChange={(e) => setServiceauftragId(e.target.value)}>
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraege.map((auftrag) => (
              <option key={auftrag.id} value={auftrag.id}>
                {auftrag.art || '-'}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="entwurf">entwurf</option>
            <option value="gesendet">gesendet</option>
            <option value="angenommen">angenommen</option>
            <option value="abgelehnt">abgelehnt</option>
            <option value="abgelaufen">abgelaufen</option>
          </select>

          <input placeholder="Netto" value={netto} onChange={(e) => setNetto(e.target.value)} />
          <input placeholder="Steuer" value={steuer} onChange={(e) => setSteuer(e.target.value)} />
          <input placeholder="Brutto" value={brutto} onChange={(e) => setBrutto(e.target.value)} />
          <input type="date" value={gueltigBis} onChange={(e) => setGueltigBis(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Bemerkung"
            value={bemerkung}
            onChange={(e) => setBemerkung(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Interne Notiz"
            value={interneNotiz}
            onChange={(e) => setInterneNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Angebot anlegen</button>
        </div>
      </form>

      <form onSubmit={anhangHochladen} className="list-box" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Anhang zu Angebot hochladen</h3>

        <div className="form-row">
          <select value={anhangAngebotId} onChange={(e) => setAnhangAngebotId(e.target.value)}>
            <option value="">Angebot auswählen</option>
            {angebote.map((angebot) => (
              <option key={angebot.id} value={angebot.id}>
                {angebot.angebotsnummer || angebot.id}
              </option>
            ))}
          </select>

          <input placeholder="Titel" value={anhangTitel} onChange={(e) => setAnhangTitel(e.target.value)} />
          <input type="file" onChange={(e) => setAnhangDatei(e.target.files?.[0] || null)} />
          <button type="submit">Anhang hochladen</button>
        </div>
      </form>

      <div>
        {angebote.map((angebot) => (
          <div key={angebot.id} className="list-box">
            <strong>{angebot.angebotsnummer || '-'}</strong>
            <br />
            Kunde: {kundeName(angebot.kunde_id)}
            <br />
            Fahrzeug: {fahrzeugName(angebot.serviceauftrag_id)}
            <br />
            Status: {angebot.status || '-'}
            <br />
            Angebotsdatum: {angebot.angebotsdatum || '-'}
            <br />
            Gültig bis: {angebot.gueltig_bis || '-'}
            <br />
            Netto: {angebot.netto_summe ?? 0} € | Steuer: {angebot.steuer_summe ?? 0} € | Brutto: {angebot.brutto_summe ?? 0} €
            <br />
            Bemerkung: {angebot.bemerkung || '-'}
            <br />
            Interne Notiz: {angebot.interne_notiz || '-'}
            <br />
            Versendet am: {angebot.versendet_am ? new Date(angebot.versendet_am).toLocaleString() : '-'}
            <br />
            Umgewandelt in Rechnung: {angebot.umgewandelt_in_rechnung_id || '-'}

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => angebotStatusSetzen(angebot.id, 'gesendet')}>
                Als gesendet markieren
              </button>

              <button type="button" onClick={() => angebotInRechnungUmwandeln(angebot)}>
                In Rechnung umwandeln
              </button>

              <a
                href={`/angebote/${angebot.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                PDF / Druckansicht
              </a>

              <a
                href={`/email-vorschau/angebot/${angebot.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#0f766e',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                E-Mail-Vorschau
              </a>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Anhänge</strong>
              {anhaengeVonAngebot(angebot.id).length === 0 ? (
                <div style={{ marginTop: 8 }}>Keine Anhänge</div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {anhaengeVonAngebot(angebot.id).map((anhang) => (
                    <div key={anhang.id}>
                      <a href={dateiUrl(anhang.dateipfad)} target="_blank" rel="noreferrer">
                        {anhang.titel || anhang.dateiname}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function AngebotePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Serviceannahme', 'Behördenvertreter']}>
      <AngebotePageContent />
    </RoleGuard>
  )
}