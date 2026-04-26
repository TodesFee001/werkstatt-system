'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  art: string | null
  status: string | null
}

type Arbeitszeit = {
  serviceauftrag_id: string
  stunden: number | null
  stundensatz: number | null
}

type Material = {
  serviceauftrag_id: string
  menge: number | null
  einzelpreis: number | null
}

type Rechnung = {
  id: string
  serviceauftrag_id: string | null
  kunde_id: string | null
  rechnungsnummer: string | null
  rechnungsdatum: string | null
  faellig_am: string | null
  netto_summe: number | null
  brutto_summe: number | null
  offener_betrag: number | null
  status: string | null
  interne_notiz: string | null
}

export default function RechnungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Buchhaltung', 'Serviceannahme', 'Behördenvertreter']}>
      <RechnungenPageContent />
    </RoleGuard>
  )
}

function RechnungenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([])
  const [materialien, setMaterialien] = useState<Material[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])

  const [auftragSuche, setAuftragSuche] = useState('')
  const [serviceauftragId, setServiceauftragId] = useState('')
  const [kundeId, setKundeId] = useState('')
  const [rechnungsnummer, setRechnungsnummer] = useState('')
  const [rechnungsdatum, setRechnungsdatum] = useState(new Date().toISOString().slice(0, 10))
  const [faelligAm, setFaelligAm] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
  const [netto, setNetto] = useState('')
  const [brutto, setBrutto] = useState('')
  const [offen, setOffen] = useState('')
  const [status, setStatus] = useState('offen')
  const [interneNotiz, setInterneNotiz] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)

  const [suche, setSuche] = useState('')
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const [kRes, sRes, azRes, matRes, rRes] = await Promise.all([
      supabase.from('kunden').select('*').order('firmenname'),
      supabase.from('serviceauftraege').select('id, kunde_id, art, status').order('created_at', { ascending: false }),
      supabase.from('serviceauftrag_arbeitszeiten').select('*'),
      supabase.from('serviceauftrag_material').select('*'),
      supabase.from('rechnungen').select('*').order('rechnungsdatum', { ascending: false }),
    ])

    if (kRes.error || sRes.error || azRes.error || matRes.error || rRes.error) {
      setFehler(kRes.error?.message || sRes.error?.message || azRes.error?.message || matRes.error?.message || rRes.error?.message || '')
      return
    }

    setKunden((kRes.data || []) as Kunde[])
    setServiceauftraege((sRes.data || []) as Serviceauftrag[])
    setArbeitszeiten((azRes.data || []) as Arbeitszeit[])
    setMaterialien((matRes.data || []) as Material[])
    setRechnungen((rRes.data || []) as Rechnung[])
  }

  useEffect(() => {
    laden()
  }, [])

  function kundeName(id: string | null) {
    const k = kunden.find((x) => x.id === id)
    return k ? k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim() : '-'
  }

  function auftragName(a: Serviceauftrag) {
    return `${a.art || 'Serviceauftrag'} – ${kundeName(a.kunde_id)} – ${a.status || '-'}`
  }

  function kostenAusAuftrag(auftragId: string) {
    const az = arbeitszeiten
      .filter((a) => a.serviceauftrag_id === auftragId)
      .reduce((s, a) => s + Number(a.stunden || 0) * Number(a.stundensatz || 0), 0)

    const mat = materialien
      .filter((m) => m.serviceauftrag_id === auftragId)
      .reduce((s, m) => s + Number(m.menge || 0) * Number(m.einzelpreis || 0), 0)

    const nettoSumme = az + mat
    const bruttoSumme = Number((nettoSumme * 1.19).toFixed(2))

    return { nettoSumme, bruttoSumme }
  }

  function neueRechnungsnummer() {
    return `RE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
  }

  const auftraegeGefiltert = useMemo(() => {
    const q = auftragSuche.trim().toLowerCase()
    return serviceauftraege.filter((a) => {
      if (!q) return true
      return auftragName(a).toLowerCase().includes(q)
    })
  }, [serviceauftraege, auftragSuche, kunden])

  function auftragAuswaehlen(id: string) {
    const a = serviceauftraege.find((x) => x.id === id)
    if (!a) return

    const kosten = kostenAusAuftrag(id)

    setServiceauftragId(id)
    setKundeId(a.kunde_id || '')
    setAuftragSuche(auftragName(a))
    setNetto(kosten.nettoSumme.toFixed(2))
    setBrutto(kosten.bruttoSumme.toFixed(2))
    setOffen(kosten.bruttoSumme.toFixed(2))
    if (!rechnungsnummer) setRechnungsnummer(neueRechnungsnummer())
  }

  function resetForm() {
    setBearbeitenId(null)
    setServiceauftragId('')
    setKundeId('')
    setAuftragSuche('')
    setRechnungsnummer('')
    setRechnungsdatum(new Date().toISOString().slice(0, 10))
    setFaelligAm(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
    setNetto('')
    setBrutto('')
    setOffen('')
    setStatus('offen')
    setInterneNotiz('')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!kundeId) {
      setFehler('Bitte Serviceauftrag auswählen. Kunde wird daraus übernommen.')
      return
    }

    const payload = {
      serviceauftrag_id: serviceauftragId || null,
      kunde_id: kundeId,
      rechnungsnummer: rechnungsnummer || neueRechnungsnummer(),
      rechnungsdatum,
      faellig_am: faelligAm,
      netto_summe: Number(netto || 0),
      brutto_summe: Number(brutto || 0),
      offener_betrag: Number(offen || brutto || 0),
      status,
      interne_notiz: interneNotiz || null,
    }

    const res = bearbeitenId
      ? await supabase.from('rechnungen').update(payload).eq('id', bearbeitenId)
      : await supabase.from('rechnungen').insert(payload)

    if (res.error) {
      setFehler(res.error.message)
      return
    }

    setMeldung(bearbeitenId ? 'Rechnung wurde gespeichert.' : 'Rechnung wurde erstellt.')
    resetForm()
    laden()
  }

  function bearbeitenStarten(r: Rechnung) {
    setBearbeitenId(r.id)
    setServiceauftragId(r.serviceauftrag_id || '')
    setKundeId(r.kunde_id || '')
    setAuftragSuche(r.serviceauftrag_id ? auftragName(serviceauftraege.find((a) => a.id === r.serviceauftrag_id) || serviceauftraege[0]) : kundeName(r.kunde_id))
    setRechnungsnummer(r.rechnungsnummer || '')
    setRechnungsdatum(r.rechnungsdatum || new Date().toISOString().slice(0, 10))
    setFaelligAm(r.faellig_am || '')
    setNetto(String(r.netto_summe || 0))
    setBrutto(String(r.brutto_summe || 0))
    setOffen(String(r.offener_betrag || 0))
    setStatus(r.status || 'offen')
    setInterneNotiz(r.interne_notiz || '')
  }

  async function loeschen(id: string) {
    const ok = window.confirm('Rechnung wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('rechnungen').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Rechnung wurde gelöscht.')
    laden()
  }

  const rechnungenGefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    return rechnungen.filter((r) => {
      if (!q) return true
      return [r.rechnungsnummer, kundeName(r.kunde_id), r.status, r.rechnungsdatum]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [rechnungen, suche, kunden])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Rechnungen</h1>
          <div className="topbar-subtitle">
            Rechnungen aus Serviceauftrag erstellen, Kosten automatisch übernehmen und manuell anpassen.
          </div>
        </div>
      </div>

      <form onSubmit={speichern} className="page-card">
        <h2 style={{ marginTop: 0 }}>{bearbeitenId ? 'Rechnung bearbeiten' : 'Rechnung erstellen'}</h2>

        <div className="form-row">
          <input
            placeholder="Serviceauftrag suchen und auswählen"
            value={auftragSuche}
            onChange={(e) => {
              setAuftragSuche(e.target.value)
              setServiceauftragId('')
              setKundeId('')
            }}
          />
          <input placeholder="Rechnungsnummer" value={rechnungsnummer} onChange={(e) => setRechnungsnummer(e.target.value)} />
        </div>

        {auftragSuche && !serviceauftragId && (
          <div className="list-box" style={{ marginTop: 12 }}>
            {auftraegeGefiltert.slice(0, 10).map((a) => (
              <button key={a.id} type="button" onClick={() => auftragAuswaehlen(a.id)} style={{ margin: 4, background: '#374151' }}>
                {auftragName(a)}
              </button>
            ))}
          </div>
        )}

        <div className="form-row" style={{ marginTop: 12 }}>
          <input type="date" value={rechnungsdatum} onChange={(e) => setRechnungsdatum(e.target.value)} />
          <input type="date" value={faelligAm} onChange={(e) => setFaelligAm(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="offen">offen</option>
            <option value="teilbezahlt">teilbezahlt</option>
            <option value="bezahlt">bezahlt</option>
            <option value="ueberfaellig">überfällig</option>
            <option value="storniert">storniert</option>
          </select>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="Netto" value={netto} onChange={(e) => setNetto(e.target.value)} />
          <input placeholder="Brutto" value={brutto} onChange={(e) => setBrutto(e.target.value)} />
          <input placeholder="Offener Betrag" value={offen} onChange={(e) => setOffen(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Interne Notiz" value={interneNotiz} onChange={(e) => setInterneNotiz(e.target.value)} />
        </div>

        <div className="action-row">
          <button type="submit">{bearbeitenId ? 'Speichern' : 'Rechnung erstellen'}</button>
          {bearbeitenId && <button type="button" onClick={resetForm} style={{ background: '#6b7280' }}>Abbrechen</button>}
        </div>
      </form>

      <div className="page-card">
        <input placeholder="Rechnungen suchen" value={suche} onChange={(e) => setSuche(e.target.value)} />

        <div style={{ marginTop: 16 }}>
          {rechnungenGefiltert.map((r) => (
            <div key={r.id} className="list-box">
              <strong>{r.rechnungsnummer || r.id}</strong>
              <br />
              Kunde: {kundeName(r.kunde_id)}
              <br />
              Netto: {Number(r.netto_summe || 0).toFixed(2)} €
              <br />
              Brutto: {Number(r.brutto_summe || 0).toFixed(2)} €
              <br />
              Offen: {Number(r.offener_betrag || 0).toFixed(2)} €
              <br />
              Status: {r.status || '-'}
              <div className="action-row">
                <Link href={`/rechnungen/${r.id}`} style={{ padding: '10px 16px', background: '#2563eb', color: 'white', borderRadius: 12, textDecoration: 'none' }}>
                  Rechnungsakte
                </Link>
                <button type="button" onClick={() => bearbeitenStarten(r)}>Bearbeiten</button>
                <button type="button" onClick={() => loeschen(r.id)} style={{ background: '#dc2626' }}>Löschen</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}