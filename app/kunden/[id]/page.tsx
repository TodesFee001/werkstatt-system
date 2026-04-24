'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import RoleGuard from '../../components/RoleGuard'
import AttachmentManager from '../../components/AttachmentManager'
import NoteManager from '../../components/NoteManager'
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

type Fahrzeug = {
  id: string
  kunde_id: string | null
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  fahrgestellnummer: string | null
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  art: string | null
  status: string | null
  freigabe_status: string | null
}

type Rechnung = {
  id: string
  kunde_id: string | null
  rechnungsnummer: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  status: string | null
}

type Zahlung = {
  id: string
  rechnung_id: string | null
  zahlungsdatum: string | null
  betrag: number | null
  status: string | null
  zahlungsart: string | null
}

export default function KundenaktePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Lager', 'Behördenvertreter']}>
      <KundenaktePageContent />
    </RoleGuard>
  )
}

function KundenaktePageContent() {
  const params = useParams()
  const id = String(params.id)

  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])
  const [fehler, setFehler] = useState('')

  async function laden() {
    const [kundeRes, fahrzeugRes, serviceRes, rechnungRes] = await Promise.all([
      supabase.from('kunden').select('*').eq('id', id).maybeSingle(),
      supabase.from('fahrzeuge').select('*').eq('kunde_id', id).order('kennzeichen'),
      supabase.from('serviceauftraege').select('*').eq('kunde_id', id).order('created_at', { ascending: false }),
      supabase.from('rechnungen').select('*').eq('kunde_id', id).order('created_at', { ascending: false }),
    ])

    if (kundeRes.error || fahrzeugRes.error || serviceRes.error || rechnungRes.error) {
      setFehler(
        kundeRes.error?.message ||
          fahrzeugRes.error?.message ||
          serviceRes.error?.message ||
          rechnungRes.error?.message ||
          ''
      )
      return
    }

    const rechnungsListe = (rechnungRes.data || []) as Rechnung[]
    const rechnungsIds = rechnungsListe.map((r) => r.id)

    let zahlungsListe: Zahlung[] = []
    if (rechnungsIds.length > 0) {
      const zahlungRes = await supabase
        .from('zahlungen')
        .select('*')
        .in('rechnung_id', rechnungsIds)
        .order('zahlungsdatum', { ascending: false })

      if (zahlungRes.error) {
        setFehler(zahlungRes.error.message)
        return
      }

      zahlungsListe = (zahlungRes.data || []) as Zahlung[]
    }

    setKunde((kundeRes.data as Kunde | null) || null)
    setFahrzeuge((fahrzeugRes.data || []) as Fahrzeug[])
    setServiceauftraege((serviceRes.data || []) as Serviceauftrag[])
    setRechnungen(rechnungsListe)
    setZahlungen(zahlungsListe)
  }

  useEffect(() => {
    laden()
  }, [id])

  const kundenTitel = kunde
    ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
    : 'Kundenakte'

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Kundenakte</h1>
          <div className="topbar-subtitle">
            Gesamtübersicht über Kundendaten, Fahrzeuge, Aufträge, Rechnungen, Zahlungen und Anhänge.
          </div>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Stammdaten</h2>
        {kunde ? (
          <div className="list-box">
            <strong>{kundenTitel || '-'}</strong>
            <br />
            E-Mail: {kunde.email || '-'}
            <br />
            Telefon: {kunde.telefon || '-'}
            <br />
            Adresse: {[kunde.strasse, kunde.plz, kunde.ort].filter(Boolean).join(', ') || '-'}
          </div>
        ) : (
          <div className="muted">Kunde nicht gefunden.</div>
        )}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Fahrzeuge</h2>
        {fahrzeuge.map((f) => (
          <div key={f.id} className="list-box">
            <strong>{f.kennzeichen || '-'}</strong>
            <br />
            Fahrzeug: {f.marke || '-'} {f.modell || '-'}
            <br />
            FIN: {f.fahrgestellnummer || '-'}
          </div>
        ))}
        {fahrzeuge.length === 0 && <div className="muted">Keine Fahrzeuge vorhanden.</div>}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Serviceaufträge</h2>
        {serviceauftraege.map((s) => (
          <div key={s.id} className="list-box">
            <strong>{s.art || '-'}</strong>
            <br />
            Status: {s.status || '-'}
            <br />
            Freigabe: {s.freigabe_status || '-'}
          </div>
        ))}
        {serviceauftraege.length === 0 && <div className="muted">Keine Serviceaufträge vorhanden.</div>}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Rechnungen</h2>
        {rechnungen.map((r) => (
          <div key={r.id} className="list-box">
            <strong>{r.rechnungsnummer || r.id}</strong>
            <br />
            Brutto: {Number(r.brutto_summe || 0).toFixed(2)} €
            <br />
            Offen: {Number(r.offener_betrag || 0).toFixed(2)} €
            <br />
            Status: {r.status || '-'}
          </div>
        ))}
        {rechnungen.length === 0 && <div className="muted">Keine Rechnungen vorhanden.</div>}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Zahlungen</h2>
        {zahlungen.map((z) => (
          <div key={z.id} className="list-box">
            <strong>{z.zahlungsdatum || '-'}</strong>
            <br />
            Betrag: {Number(z.betrag || 0).toFixed(2)} €
            <br />
            Art: {z.zahlungsart || '-'}
            <br />
            Status: {z.status || '-'}
          </div>
        ))}
        {zahlungen.length === 0 && <div className="muted">Keine Zahlungen vorhanden.</div>}
      </div>

      <NoteManager kundeId={id} titel={kundenTitel || 'Kundenakte'} />

      <AttachmentManager
        bereich="kunde"
        datensatzId={id}
        titel={kundenTitel || 'Kundenakte'}
      />

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}