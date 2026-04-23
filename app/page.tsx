'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
  freigabe_status: string | null
}

type Termin = {
  id: string
  titel: string | null
  startzeit: string | null
  status: string | null
}

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  offener_betrag: number | null
  status: string | null
  faellig_am: string | null
  mahnstufe: number | null
}

type Lagerartikel = {
  id: string
  artikelnummer: number | null
  name: string | null
  bestand: number | null
  mindestbestand: number | null
}

export default function DashboardPage() {
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [fehler, setFehler] = useState('')

  async function laden() {
    const [serviceRes, terminRes, rechnungRes, lagerRes] = await Promise.all([
      supabase.from('serviceauftraege').select('id, art, status, freigabe_status'),
      supabase.from('termine').select('id, titel, startzeit, status'),
      supabase.from('rechnungen').select('id, rechnungsnummer, offener_betrag, status, faellig_am, mahnstufe'),
      supabase.from('lagerartikel').select('id, artikelnummer, name, bestand, mindestbestand'),
    ])

    if (serviceRes.error || terminRes.error || rechnungRes.error || lagerRes.error) {
      setFehler(
        serviceRes.error?.message ||
          terminRes.error?.message ||
          rechnungRes.error?.message ||
          lagerRes.error?.message ||
          ''
      )
      return
    }

    setServiceauftraege((serviceRes.data || []) as Serviceauftrag[])
    setTermine((terminRes.data || []) as Termin[])
    setRechnungen((rechnungRes.data || []) as Rechnung[])
    setLagerartikel((lagerRes.data || []) as Lagerartikel[])
  }

  useEffect(() => {
    laden()
  }, [])

  const statistik = useMemo(() => {
    const heute = new Date()

    const offeneServiceauftraege = serviceauftraege.filter(
      (s) => !['abgeschlossen', 'archiviert'].includes(String(s.status || '').toLowerCase())
    ).length

    const freigabenOffen = serviceauftraege.filter(
      (s) => String(s.freigabe_status || '').toLowerCase() === 'offen'
    ).length

    const aktiveTermine = termine.filter((t) => {
      if (!t.startzeit) return false
      const start = new Date(t.startzeit)
      return start.getTime() >= heute.getTime()
    }).length

    const offeneRechnungen = rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0).length

    const offeneSumme = rechnungen.reduce(
      (sum, r) => sum + Number(r.offener_betrag || 0),
      0
    )

    const kritischeLagerartikel = lagerartikel.filter(
      (l) => Number(l.bestand || 0) < Number(l.mindestbestand || 0)
    ).length

    return {
      offeneServiceauftraege,
      freigabenOffen,
      aktiveTermine,
      offeneRechnungen,
      offeneSumme,
      kritischeLagerartikel,
    }
  }, [serviceauftraege, termine, rechnungen, lagerartikel])

  const naechsteTermine = useMemo(() => {
    return [...termine]
      .filter((t) => t.startzeit)
      .sort(
        (a, b) =>
          new Date(a.startzeit || '').getTime() - new Date(b.startzeit || '').getTime()
      )
      .slice(0, 5)
  }, [termine])

  const offeneRechnungenListe = useMemo(() => {
    return rechnungen
      .filter((r) => Number(r.offener_betrag || 0) > 0)
      .sort((a, b) => Number(b.offener_betrag || 0) - Number(a.offener_betrag || 0))
      .slice(0, 5)
  }, [rechnungen])

  const lagerWarnungen = useMemo(() => {
    return lagerartikel
      .filter((l) => Number(l.bestand || 0) < Number(l.mindestbestand || 0))
      .sort((a, b) => Number(a.artikelnummer || 0) - Number(b.artikelnummer || 0))
      .slice(0, 5)
  }, [lagerartikel])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Dashboard</h1>
          <div className="topbar-subtitle">
            Werkstattübersicht für Aufträge, Termine, Rechnungen und Lager.
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">
          Offene Serviceaufträge
          <strong>{statistik.offeneServiceauftraege}</strong>
        </div>
        <div className="kpi-pill">
          Offene Freigaben
          <strong>{statistik.freigabenOffen}</strong>
        </div>
        <div className="kpi-pill">
          Aktive Termine
          <strong>{statistik.aktiveTermine}</strong>
        </div>
        <div className="kpi-pill">
          Offene Rechnungen
          <strong>{statistik.offeneRechnungen}</strong>
        </div>
        <div className="kpi-pill">
          Offene Summe
          <strong>{statistik.offeneSumme.toFixed(2)} €</strong>
        </div>
        <div className="kpi-pill">
          Kritische Lagerartikel
          <strong>{statistik.kritischeLagerartikel}</strong>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Schnellzugriff</h2>
        <div className="action-row">
          <Link className="sidebar-link" href="/serviceauftraege">Serviceaufträge</Link>
          <Link className="sidebar-link" href="/termine">Termine</Link>
          <Link className="sidebar-link" href="/lager">Lager</Link>
          <Link className="sidebar-link" href="/rechnungen">Rechnungen</Link>
          <Link className="sidebar-link" href="/zahlungen">Zahlungen</Link>
          <Link className="sidebar-link" href="/benachrichtigungen">Benachrichtigungen</Link>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Nächste Termine</h2>
        {naechsteTermine.map((t) => (
          <div key={t.id} className="list-box">
            <strong>{t.titel || '-'}</strong>
            <br />
            Start: {t.startzeit ? new Date(t.startzeit).toLocaleString('de-DE') : '-'}
            <br />
            Status: {t.status || '-'}
          </div>
        ))}
        {naechsteTermine.length === 0 && <div className="muted">Keine kommenden Termine vorhanden.</div>}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Größte offenen Rechnungen</h2>
        {offeneRechnungenListe.map((r) => (
          <div key={r.id} className="list-box">
            <strong>{r.rechnungsnummer || r.id}</strong>
            <br />
            Offen: {Number(r.offener_betrag || 0).toFixed(2)} €
            <br />
            Fällig am: {r.faellig_am || '-'}
            <br />
            Mahnstufe: {r.mahnstufe || 0}
          </div>
        ))}
        {offeneRechnungenListe.length === 0 && <div className="muted">Keine offenen Rechnungen vorhanden.</div>}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Kritische Lagerartikel</h2>
        {lagerWarnungen.map((l) => (
          <div
            key={l.id}
            className="list-box"
            style={{
              background: 'rgba(220,38,38,0.18)',
              border: '2px solid #dc2626',
            }}
          >
            <strong>{l.artikelnummer || '-'} – {l.name || '-'}</strong>
            <br />
            Bestand: {Number(l.bestand || 0).toFixed(2)}
            <br />
            Mindestbestand: {Number(l.mindestbestand || 0).toFixed(2)}
          </div>
        ))}
        {lagerWarnungen.length === 0 && <div className="muted">Keine kritischen Lagerartikel vorhanden.</div>}
      </div>

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}