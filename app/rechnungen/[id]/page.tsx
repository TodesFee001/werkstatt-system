'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import RoleGuard from '../../components/RoleGuard'
import AttachmentManager from '../../components/AttachmentManager'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  rechnungsdatum: string | null
  faellig_am: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  status: string | null
  mahnstufe: number | null
  forderungsstatus: string | null
  interne_notiz: string | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  email: string | null
}

type Zahlung = {
  id: string
  rechnung_id: string | null
  zahlungsdatum: string | null
  betrag: number | null
  status: string | null
  zahlungsart: string | null
  notiz: string | null
}

export default function RechnungDetailPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Buchhaltung', 'Serviceannahme', 'Behördenvertreter']}>
      <RechnungDetailPageContent />
    </RoleGuard>
  )
}

function RechnungDetailPageContent() {
  const params = useParams()
  const id = String(params.id)

  const [rechnung, setRechnung] = useState<Rechnung | null>(null)
  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])
  const [fehler, setFehler] = useState('')

  async function laden() {
    const rRes = await supabase.from('rechnungen').select('*').eq('id', id).maybeSingle()

    if (rRes.error) {
      setFehler(rRes.error.message)
      return
    }

    const rechnungDaten = (rRes.data as Rechnung | null) || null
    setRechnung(rechnungDaten)

    if (rechnungDaten?.kunde_id) {
      const kRes = await supabase.from('kunden').select('*').eq('id', rechnungDaten.kunde_id).maybeSingle()
      if (!kRes.error) {
        setKunde((kRes.data as Kunde | null) || null)
      }
    }

    const zRes = await supabase
      .from('zahlungen')
      .select('*')
      .eq('rechnung_id', id)
      .order('zahlungsdatum', { ascending: false })

    if (zRes.error) {
      setFehler(zRes.error.message)
      return
    }

    setZahlungen((zRes.data || []) as Zahlung[])
  }

  useEffect(() => {
    laden()
  }, [id])

  const summeZahlungen = useMemo(() => {
    return zahlungen.reduce((sum, z) => sum + Number(z.betrag || 0), 0)
  }, [zahlungen])

  function drucken() {
    window.print()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Rechnungsakte</h1>
          <div className="topbar-subtitle">
            Detailansicht für Rechnung, Zahlungshistorie und rechnungsbezogene Dokumente.
          </div>
        </div>
        <div className="action-row">
          <button type="button" onClick={drucken}>
            Drucken / PDF
          </button>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Rechnungsdaten</h2>
        {rechnung ? (
          <div className="list-box">
            <strong>{rechnung.rechnungsnummer || rechnung.id}</strong>
            <br />
            Kunde: {kunde ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim() : '-'}
            <br />
            E-Mail: {kunde?.email || '-'}
            <br />
            Rechnungsdatum: {rechnung.rechnungsdatum || '-'}
            <br />
            Fällig am: {rechnung.faellig_am || '-'}
            <br />
            Brutto: {Number(rechnung.brutto_summe || 0).toFixed(2)} €
            <br />
            Offen: {Number(rechnung.offener_betrag || 0).toFixed(2)} €
            <br />
            Status: {rechnung.status || '-'}
            <br />
            Mahnstufe: {rechnung.mahnstufe || 0}
            <br />
            Forderungsstatus: {rechnung.forderungsstatus || '-'}
            <br />
            Interne Notiz: {rechnung.interne_notiz || '-'}
          </div>
        ) : (
          <div className="muted">Rechnung nicht gefunden.</div>
        )}
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">
          Summe Zahlungen
          <strong>{summeZahlungen.toFixed(2)} €</strong>
        </div>
        <div className="kpi-pill">
          Offener Betrag
          <strong>{Number(rechnung?.offener_betrag || 0).toFixed(2)} €</strong>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Zahlungshistorie</h2>
        {zahlungen.map((z) => (
          <div key={z.id} className="list-box">
            <strong>{z.zahlungsdatum || '-'}</strong>
            <br />
            Betrag: {Number(z.betrag || 0).toFixed(2)} €
            <br />
            Art: {z.zahlungsart || '-'}
            <br />
            Status: {z.status || '-'}
            <br />
            Notiz: {z.notiz || '-'}
          </div>
        ))}
        {zahlungen.length === 0 && <div className="muted">Keine Zahlungen vorhanden.</div>}
      </div>

      <AttachmentManager
        bereich="rechnung"
        datensatzId={id}
        titel={rechnung ? rechnung.rechnungsnummer || rechnung.id : 'Rechnung'}
      />

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}