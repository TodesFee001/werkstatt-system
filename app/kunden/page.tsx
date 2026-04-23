'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  email: string | null
  telefon: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
}

type ServiceauftragRef = {
  id: string
  kunde_id: string | null
}

type FahrzeugRef = {
  id: string
  kunde_id: string | null
}

type RechnungRef = {
  id: string
  kunde_id: string | null
  rechnungsnummer: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  status: string | null
}

type ZahlungRef = {
  id: string
  rechnung_id: string | null
  zahlungsdatum: string | null
  betrag: number | null
  status: string | null
  zahlungsart: string | null
}

export default function KundenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Serviceannahme', 'Buchhaltung', 'Werkstatt']}>
      <KundenPageContent />
    </RoleGuard>
  )
}

function KundenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<ServiceauftragRef[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<FahrzeugRef[]>([])
  const [rechnungen, setRechnungen] = useState<RechnungRef[]>([])
  const [zahlungen, setZahlungen] = useState<ZahlungRef[]>([])

  const [suche, setSuche] = useState('')

  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [firmenname, setFirmenname] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [strasse, setStrasse] = useState('')
  const [plz, setPlz] = useState('')
  const [ort, setOrt] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenVorname, setBearbeitenVorname] = useState('')
  const [bearbeitenNachname, setBearbeitenNachname] = useState('')
  const [bearbeitenFirmenname, setBearbeitenFirmenname] = useState('')
  const [bearbeitenEmail, setBearbeitenEmail] = useState('')
  const [bearbeitenTelefon, setBearbeitenTelefon] = useState('')
  const [bearbeitenStrasse, setBearbeitenStrasse] = useState('')
  const [bearbeitenPlz, setBearbeitenPlz] = useState('')
  const [bearbeitenOrt, setBearbeitenOrt] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    setFehler('')

    const [kundenRes, serviceRes, fahrzeugRes, rechnungRes, zahlungRes] = await Promise.all([
      supabase.from('kunden').select('*').order('created_at', { ascending: false }),
      supabase.from('serviceauftraege').select('id, kunde_id'),
      supabase.from('fahrzeuge').select('id, kunde_id'),
      supabase.from('rechnungen').select('id, kunde_id, rechnungsnummer, brutto_summe, offener_betrag, status'),
      supabase.from('zahlungen').select('id, rechnung_id, zahlungsdatum, betrag, status, zahlungsart'),
    ])

    if (
      kundenRes.error ||
      serviceRes.error ||
      fahrzeugRes.error ||
      rechnungRes.error ||
      zahlungRes.error
    ) {
      setFehler(
        kundenRes.error?.message ||
          serviceRes.error?.message ||
          fahrzeugRes.error?.message ||
          rechnungRes.error?.message ||
          zahlungRes.error?.message ||
          ''
      )
      return
    }

    setKunden((kundenRes.data || []) as Kunde[])
    setServiceauftraege((serviceRes.data || []) as ServiceauftragRef[])
    setFahrzeuge((fahrzeugRes.data || []) as FahrzeugRef[])
    setRechnungen((rechnungRes.data || []) as RechnungRef[])
    setZahlungen((zahlungRes.data || []) as ZahlungRef[])
  }

  useEffect(() => {
    laden()
  }, [])

  async function erstellen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!firmenname.trim() && !vorname.trim() && !nachname.trim()) {
      setFehler('Bitte Firmenname oder Vor- und Nachname angeben.')
      return
    }

    const { error } = await supabase.from('kunden').insert({
      vorname: vorname || null,
      nachname: nachname || null,
      firmenname: firmenname || null,
      email: email || null,
      telefon: telefon || null,
      strasse: strasse || null,
      plz: plz || null,
      ort: ort || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setVorname('')
    setNachname('')
    setFirmenname('')
    setEmail('')
    setTelefon('')
    setStrasse('')
    setPlz('')
    setOrt('')
    setMeldung('Kunde wurde erstellt.')
    laden()
  }

  function bearbeitenStarten(k: Kunde) {
    setBearbeitenId(k.id)
    setBearbeitenVorname(k.vorname || '')
    setBearbeitenNachname(k.nachname || '')
    setBearbeitenFirmenname(k.firmenname || '')
    setBearbeitenEmail(k.email || '')
    setBearbeitenTelefon(k.telefon || '')
    setBearbeitenStrasse(k.strasse || '')
    setBearbeitenPlz(k.plz || '')
    setBearbeitenOrt(k.ort || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenVorname('')
    setBearbeitenNachname('')
    setBearbeitenFirmenname('')
    setBearbeitenEmail('')
    setBearbeitenTelefon('')
    setBearbeitenStrasse('')
    setBearbeitenPlz('')
    setBearbeitenOrt('')
  }

  async function bearbeitenSpeichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!bearbeitenId) return

    const { error } = await supabase
      .from('kunden')
      .update({
        vorname: bearbeitenVorname || null,
        nachname: bearbeitenNachname || null,
        firmenname: bearbeitenFirmenname || null,
        email: bearbeitenEmail || null,
        telefon: bearbeitenTelefon || null,
        strasse: bearbeitenStrasse || null,
        plz: bearbeitenPlz || null,
        ort: bearbeitenOrt || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    setMeldung('Kunde wurde gespeichert.')
    laden()
  }

  async function loeschen(id: string) {
    setFehler('')
    setMeldung('')

    const serviceCount = serviceauftraege.filter((s) => s.kunde_id === id).length
    const fahrzeugCount = fahrzeuge.filter((f) => f.kunde_id === id).length
    const rechnungCount = rechnungen.filter((r) => r.kunde_id === id).length

    if (serviceCount > 0 || fahrzeugCount > 0 || rechnungCount > 0) {
      setFehler(
        `Kunde kann nicht gelöscht werden. Verknüpfungen vorhanden: ${serviceCount} Serviceaufträge, ${fahrzeugCount} Fahrzeuge, ${rechnungCount} Rechnungen.`
      )
      return
    }

    const ok = window.confirm('Kunden wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('kunden').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Kunde wurde gelöscht.')
    laden()
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return kunden.filter((k) => {
      if (!q) return true
      return [
        k.firmenname,
        k.vorname,
        k.nachname,
        k.email,
        k.telefon,
        k.ort,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [kunden, suche])

  function kundenRechnungen(kundeId: string) {
    return rechnungen.filter((r) => r.kunde_id === kundeId)
  }

  function kundenZahlungen(kundeId: string) {
    const rechnungsIds = kundenRechnungen(kundeId).map((r) => r.id)
    return zahlungen.filter((z) => z.rechnung_id && rechnungsIds.includes(z.rechnung_id))
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Kunden</h1>
          <div className="topbar-subtitle">
            Kundenverwaltung mit Historie für Rechnungen und Zahlungen direkt am Kunden.
          </div>
        </div>
      </div>

      <form onSubmit={erstellen} className="page-card">
        <h2 style={{ marginTop: 0 }}>Neuen Kunden anlegen</h2>

        <div className="form-row">
          <input placeholder="Firmenname" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} />
          <input placeholder="Vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
          <input placeholder="Nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="Straße" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
          <input placeholder="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} />
          <input placeholder="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
        </div>

        <div className="action-row">
          <button type="submit">Kunde anlegen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={bearbeitenSpeichern} className="page-card">
          <h2 style={{ marginTop: 0 }}>Kunde bearbeiten</h2>

          <div className="form-row">
            <input placeholder="Firmenname" value={bearbeitenFirmenname} onChange={(e) => setBearbeitenFirmenname(e.target.value)} />
            <input placeholder="Vorname" value={bearbeitenVorname} onChange={(e) => setBearbeitenVorname(e.target.value)} />
            <input placeholder="Nachname" value={bearbeitenNachname} onChange={(e) => setBearbeitenNachname(e.target.value)} />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <input placeholder="E-Mail" value={bearbeitenEmail} onChange={(e) => setBearbeitenEmail(e.target.value)} />
            <input placeholder="Telefon" value={bearbeitenTelefon} onChange={(e) => setBearbeitenTelefon(e.target.value)} />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <input placeholder="Straße" value={bearbeitenStrasse} onChange={(e) => setBearbeitenStrasse(e.target.value)} />
            <input placeholder="PLZ" value={bearbeitenPlz} onChange={(e) => setBearbeitenPlz(e.target.value)} />
            <input placeholder="Ort" value={bearbeitenOrt} onChange={(e) => setBearbeitenOrt(e.target.value)} />
          </div>

          <div className="action-row">
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="page-card">
        <div className="form-row" style={{ marginBottom: 12 }}>
          <input
            placeholder="Kunden durchsuchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
        </div>

        {gefiltert.map((k) => {
          const rechnungenVomKunden = kundenRechnungen(k.id)
          const zahlungenVomKunden = kundenZahlungen(k.id)

          return (
            <div key={k.id} className="list-box">
              <strong>{k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim() || '-'}</strong>
              <br />
              E-Mail: {k.email || '-'}
              <br />
              Telefon: {k.telefon || '-'}
              <br />
              Adresse: {[k.strasse, k.plz, k.ort].filter(Boolean).join(', ') || '-'}
              <div className="action-row" style={{ marginTop: 10 }}>
                <button type="button" onClick={() => bearbeitenStarten(k)}>
                  Bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => loeschen(k.id)}
                  style={{ background: '#dc2626' }}
                >
                  Löschen
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>Rechnungshistorie</strong>
                {rechnungenVomKunden.length === 0 && <div>-</div>}
                {rechnungenVomKunden.map((r) => (
                  <div key={r.id}>
                    {r.rechnungsnummer || r.id} – {Number(r.brutto_summe || 0).toFixed(2)} € – offen{' '}
                    {Number(r.offener_betrag || 0).toFixed(2)} € – {r.status || '-'}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Zahlungshistorie</strong>
                {zahlungenVomKunden.length === 0 && <div>-</div>}
                {zahlungenVomKunden.map((z) => (
                  <div key={z.id}>
                    {z.zahlungsdatum || '-'} – {Number(z.betrag || 0).toFixed(2)} € – {z.zahlungsart || '-'} – {z.status || '-'}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {gefiltert.length === 0 && <div className="muted">Keine Kunden gefunden.</div>}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}