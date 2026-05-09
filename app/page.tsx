'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from './components/RoleGuard'
import StatusBadge from './components/StatusBadge'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/lib/useRealtimeTable'

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
  created_at: string | null
}

type Termin = {
  id: string
  titel: string | null
  startzeit: string | null
  endzeit: string | null
  status: string | null
}

type Lagerartikel = {
  id: string
  artikelnummer: number | null
  name: string | null
  bestand: number | null
  mindestbestand: number | null
}

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  rechnungsdatum: string | null
  faellig_am: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  status: string | null
  mahnstufe: number | null
}

type LogEintrag = {
  id: string
  erstellt_am: string
  benutzer_name: string | null
  aktion: string
  tabelle: string
  titel: string | null
}

export default function DashboardPage() {
  return (
    <RoleGuard
      allowedRoles={[
        'Admin',
        'Werkstattmeister',
        'Werkstatt',
        'Serviceannahme',
        'Buchhaltung',
        'Lager',
        'Behördenvertreter',
      ]}
    >
      <DashboardContent />
    </RoleGuard>
  )
}

function DashboardContent() {
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [logs, setLogs] = useState<LogEintrag[]>([])
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState('')

  const laden = useCallback(async () => {
    setFehler('')

    const [sRes, tRes, lRes, rRes, logRes] = await Promise.all([
      supabase.from('serviceauftraege').select('id, art, status, created_at').order('created_at', { ascending: false }),
      supabase.from('termine').select('id, titel, startzeit, endzeit, status').order('startzeit', { ascending: true }),
      supabase.from('lagerartikel').select('id, artikelnummer, name, bestand, mindestbestand').order('artikelnummer', { ascending: true }),
      supabase.from('rechnungen').select('id, rechnungsnummer, rechnungsdatum, faellig_am, brutto_summe, offener_betrag, status, mahnstufe').order('rechnungsdatum', { ascending: false }),
      supabase.from('aktivitaetslog').select('id, erstellt_am, benutzer_name, aktion, tabelle, titel').order('erstellt_am', { ascending: false }).limit(8),
    ])

    if (sRes.error || tRes.error || lRes.error || rRes.error || logRes.error) {
      setFehler(
        sRes.error?.message ||
          tRes.error?.message ||
          lRes.error?.message ||
          rRes.error?.message ||
          logRes.error?.message ||
          ''
      )
      return
    }

    setServiceauftraege((sRes.data || []) as Serviceauftrag[])
    setTermine((tRes.data || []) as Termin[])
    setLagerartikel((lRes.data || []) as Lagerartikel[])
    setRechnungen((rRes.data || []) as Rechnung[])
    setLogs((logRes.data || []) as LogEintrag[])
    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('serviceauftraege', laden)
  useRealtimeTable('termine', laden)
  useRealtimeTable('lagerartikel', laden)
  useRealtimeTable('lagerbewegungen', laden)
  useRealtimeTable('rechnungen', laden)
  useRealtimeTable('zahlungen', laden)
  useRealtimeTable('aktivitaetslog', laden)

  const heute = new Date()
  const heuteKey = heute.toISOString().slice(0, 10)

  const startMonat = new Date(heute.getFullYear(), heute.getMonth(), 1)

  const offeneAuftraege = useMemo(() => {
    return serviceauftraege.filter((a) => !['abgeschlossen', 'archiviert'].includes(String(a.status || '').toLowerCase()))
  }, [serviceauftraege])

  const auftraegeInArbeit = useMemo(() => {
    return serviceauftraege.filter((a) => String(a.status || '').toLowerCase() === 'in_arbeit')
  }, [serviceauftraege])

  const heutigeTermine = useMemo(() => {
    return termine
      .filter((t) => t.startzeit && t.startzeit.slice(0, 10) === heuteKey)
      .sort((a, b) => new Date(a.startzeit || '').getTime() - new Date(b.startzeit || '').getTime())
  }, [termine, heuteKey])

  const kritischeLagerartikel = useMemo(() => {
    return lagerartikel.filter((a) => Number(a.bestand || 0) < Number(a.mindestbestand || 0))
  }, [lagerartikel])

  const offeneRechnungen = useMemo(() => {
    return rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0 && String(r.status || '').toLowerCase() !== 'bezahlt')
  }, [rechnungen])

  const ueberfaelligeRechnungen = useMemo(() => {
    const heuteOhneZeit = new Date()
    heuteOhneZeit.setHours(0, 0, 0, 0)

    return offeneRechnungen.filter((r) => {
      if (!r.faellig_am) return false
      const faellig = new Date(r.faellig_am)
      faellig.setHours(0, 0, 0, 0)
      return faellig.getTime() < heuteOhneZeit.getTime()
    })
  }, [offeneRechnungen])

  const umsatzMonat = useMemo(() => {
    return rechnungen
      .filter((r) => {
        if (!r.rechnungsdatum) return false
        const datum = new Date(r.rechnungsdatum)
        return datum.getTime() >= startMonat.getTime()
      })
      .reduce((sum, r) => sum + Number(r.brutto_summe || 0), 0)
  }, [rechnungen, startMonat])

  const offeneSumme = useMemo(() => {
    return offeneRechnungen.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0)
  }, [offeneRechnungen])

  const naechsterTermin = heutigeTermine[0]

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Dashboard</h1>
          <div className="topbar-subtitle">
            Live-Übersicht für Werkstatt, Lager, Termine und Finanzen.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>

        <div className="action-row">
          <button type="button" onClick={laden}>
            Neu laden
          </button>
        </div>
      </div>

      <div className="kpi-strip">
        <KpiCard titel="Offene Aufträge" wert={offeneAuftraege.length} hinweis={`${auftraegeInArbeit.length} in Arbeit`} href="/serviceauftraege" />
        <KpiCard titel="Heutige Termine" wert={heutigeTermine.length} hinweis={naechsterTermin?.startzeit ? `Nächster: ${new Date(naechsterTermin.startzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : 'Kein Termin'} href="/kalender" />
        <KpiCard titel="Kritisches Lager" wert={kritischeLagerartikel.length} hinweis="unter Mindestbestand" href="/lager" warnung={kritischeLagerartikel.length > 0} />
        <KpiCard titel="Offene Rechnungen" wert={offeneRechnungen.length} hinweis={`${offeneSumme.toFixed(2)} € offen`} href="/rechnungen" warnung={offeneRechnungen.length > 0} />
        <KpiCard titel="Überfällig" wert={ueberfaelligeRechnungen.length} hinweis="Fälligkeit überschritten" href="/forderungen" kritisch={ueberfaelligeRechnungen.length > 0} />
        <KpiCard titel="Umsatz Monat" wert={`${umsatzMonat.toFixed(2)} €`} hinweis="Brutto-Rechnungssumme" href="/rechnungen" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 18,
        }}
      >
        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Aktuelle Serviceaufträge</h2>

          {offeneAuftraege.slice(0, 6).map((a) => (
            <div key={a.id} className="list-box">
              <strong>{a.art || 'Serviceauftrag'}</strong>
              <br />
              Status: <StatusBadge status={a.status || 'offen'} />
              <br />
              Erstellt: {a.created_at ? new Date(a.created_at).toLocaleString('de-DE') : '-'}
              <div className="action-row">
                <Link href={`/serviceauftraege/${a.id}`} className="button-link">
                  Öffnen
                </Link>
              </div>
            </div>
          ))}

          {offeneAuftraege.length === 0 && <div className="muted">Keine offenen Serviceaufträge.</div>}
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Heutige Termine</h2>

          {heutigeTermine.slice(0, 6).map((t) => (
            <div key={t.id} className="list-box">
              <strong>{t.titel || 'Termin'}</strong>
              <br />
              Zeit:{' '}
              {t.startzeit
                ? new Date(t.startzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                : '-'}
              {' '}bis{' '}
              {t.endzeit
                ? new Date(t.endzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                : '-'}
              <br />
              Status: <StatusBadge status={t.status || 'offen'} />
            </div>
          ))}

          {heutigeTermine.length === 0 && <div className="muted">Heute keine Termine.</div>}
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Kritische Lagerartikel</h2>

          {kritischeLagerartikel.slice(0, 6).map((a) => (
            <div
              key={a.id}
              className="list-box"
              style={{
                border: '2px solid #dc2626',
                background: 'rgba(220,38,38,0.12)',
              }}
            >
              <strong>
                {a.artikelnummer ?? '-'} – {a.name || '-'}
              </strong>
              <br />
              Bestand: {Number(a.bestand || 0).toFixed(2)}
              <br />
              Mindestbestand: {Number(a.mindestbestand || 0).toFixed(2)}
            </div>
          ))}

          {kritischeLagerartikel.length === 0 && <div className="muted">Keine kritischen Lagerartikel.</div>}
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Überfällige Rechnungen</h2>

          {ueberfaelligeRechnungen.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className="list-box"
              style={{
                border: '2px solid #7f1d1d',
                background: 'rgba(127,29,29,0.18)',
              }}
            >
              <strong>{r.rechnungsnummer || r.id}</strong>
              <br />
              Fällig: {r.faellig_am || '-'}
              <br />
              Offen: {Number(r.offener_betrag || 0).toFixed(2)} €
              <br />
              Mahnstufe: {r.mahnstufe || 0}
              <div className="action-row">
                <Link href={`/rechnungen/${r.id}`} className="button-link">
                  Öffnen
                </Link>
              </div>
            </div>
          ))}

          {ueberfaelligeRechnungen.length === 0 && <div className="muted">Keine überfälligen Rechnungen.</div>}
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Letzte Aktivitäten</h2>

          {logs.map((log) => (
            <div key={log.id} className="list-box">
              <strong>{log.aktion}</strong> · {log.tabelle}
              <br />
              {log.titel || '-'}
              <br />
              Benutzer: {log.benutzer_name || '-'}
              <br />
              Zeit: {log.erstellt_am ? new Date(log.erstellt_am).toLocaleString('de-DE') : '-'}
            </div>
          ))}

          {logs.length === 0 && <div className="muted">Keine Aktivitäten vorhanden.</div>}
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Schnellzugriff</h2>

          <div className="action-row">
            <Link href="/serviceauftraege" className="button-link">
              Serviceaufträge
            </Link>
            <Link href="/kalender" className="button-link">
              Kalender
            </Link>
            <Link href="/lager" className="button-link">
              Lager
            </Link>
            <Link href="/rechnungen" className="button-link">
              Rechnungen
            </Link>
            <Link href="/zahlungen" className="button-link">
              Zahlungen
            </Link>
            <Link href="/wiki" className="button-link">
              Wiki
            </Link>
          </div>
        </div>
      </div>

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}

function KpiCard({
  titel,
  wert,
  hinweis,
  href,
  warnung = false,
  kritisch = false,
}: {
  titel: string
  wert: string | number
  hinweis: string
  href: string
  warnung?: boolean
  kritisch?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        className="kpi-pill"
        style={{
          border: kritisch
            ? '2px solid #7f1d1d'
            : warnung
            ? '2px solid #f59e0b'
            : '1px solid rgba(75,85,99,0.7)',
          background: kritisch
            ? 'rgba(127,29,29,0.22)'
            : warnung
            ? 'rgba(245,158,11,0.13)'
            : undefined,
          minHeight: 110,
          alignItems: 'flex-start',
        }}
      >
        <span>{titel}</span>
        <strong style={{ fontSize: 26 }}>{wert}</strong>
        <small style={{ color: '#9ca3af', fontWeight: 700 }}>{hinweis}</small>
      </div>
    </Link>
  )
}