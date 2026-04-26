'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

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
  offener_betrag: number | null
  status: string | null
  faellig_am: string | null
  mahnstufe: number | null
  created_at?: string | null
}

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
  freigabe_status: string | null
  created_at?: string | null
}

type Termin = {
  id: string
  titel: string | null
  startzeit: string | null
  status: string | null
  created_at?: string | null
}

type Prioritaet = 'hoch' | 'mittel' | 'niedrig'
type Sortierung = 'prioritaet' | 'neuheit'

type Nachricht = {
  id: string
  typ: 'lager' | 'rechnung' | 'serviceauftrag' | 'termin'
  titel: string
  text: string
  link: string
  prioritaet: Prioritaet
  zeitstempel: string
}

export default function BenachrichtigungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Lager', 'Behördenvertreter']}>
      <BenachrichtigungenPageContent />
    </RoleGuard>
  )
}

function BenachrichtigungenPageContent() {
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [sortierung, setSortierung] = useState<Sortierung>('prioritaet')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const [lagerRes, rechnungRes, serviceRes, terminRes] = await Promise.all([
      supabase.from('lagerartikel').select('id, artikelnummer, name, bestand, mindestbestand'),
      supabase.from('rechnungen').select('id, rechnungsnummer, offener_betrag, status, faellig_am, mahnstufe, created_at'),
      supabase.from('serviceauftraege').select('id, art, status, freigabe_status, created_at'),
      supabase.from('termine').select('id, titel, startzeit, status, created_at'),
    ])

    if (lagerRes.error || rechnungRes.error || serviceRes.error || terminRes.error) {
      setFehler(
        lagerRes.error?.message ||
          rechnungRes.error?.message ||
          serviceRes.error?.message ||
          terminRes.error?.message ||
          ''
      )
      return
    }

    setLagerartikel((lagerRes.data || []) as Lagerartikel[])
    setRechnungen((rechnungRes.data || []) as Rechnung[])
    setServiceauftraege((serviceRes.data || []) as Serviceauftrag[])
    setTermine((terminRes.data || []) as Termin[])
  }

  useEffect(() => {
    laden()
  }, [])

  const benachrichtigungen = useMemo(() => {
    const now = new Date()
    const liste: Nachricht[] = []

    for (const artikel of lagerartikel) {
      if (Number(artikel.bestand || 0) < Number(artikel.mindestbestand || 0)) {
        liste.push({
          id: `lager-${artikel.id}`,
          typ: 'lager',
          titel: 'Mindestbestand unterschritten',
          text: `${artikel.artikelnummer || '-'} – ${artikel.name || '-'} ist unter Mindestbestand.`,
          link: '/lager',
          prioritaet: 'hoch',
          zeitstempel: new Date().toISOString(),
        })
      }
    }

    for (const rechnung of rechnungen) {
      const offen = Number(rechnung.offener_betrag || 0) > 0
      if (!offen) continue

      const faellig = rechnung.faellig_am ? new Date(rechnung.faellig_am) : null
      const istUeberfaellig = faellig ? faellig.getTime() < now.getTime() : false

      if (istUeberfaellig) {
        liste.push({
          id: `rechnung-${rechnung.id}`,
          typ: 'rechnung',
          titel: 'Überfällige Rechnung',
          text: `${rechnung.rechnungsnummer || rechnung.id} ist überfällig. Mahnstufe: ${rechnung.mahnstufe || 0}.`,
          link: '/zahlungen',
          prioritaet: 'hoch',
          zeitstempel: rechnung.created_at || new Date().toISOString(),
        })
      } else {
        liste.push({
          id: `rechnung-offen-${rechnung.id}`,
          typ: 'rechnung',
          titel: 'Offene Rechnung',
          text: `${rechnung.rechnungsnummer || rechnung.id} ist noch offen.`,
          link: '/offene-posten',
          prioritaet: 'mittel',
          zeitstempel: rechnung.created_at || new Date().toISOString(),
        })
      }
    }

    for (const auftrag of serviceauftraege) {
      if (String(auftrag.freigabe_status || '').toLowerCase() === 'offen') {
        liste.push({
          id: `service-${auftrag.id}`,
          typ: 'serviceauftrag',
          titel: 'Offene Freigabe',
          text: `Serviceauftrag ${auftrag.art || auftrag.id} wartet auf Freigabe.`,
          link: '/serviceauftraege',
          prioritaet: 'mittel',
          zeitstempel: auftrag.created_at || new Date().toISOString(),
        })
      }
    }

    for (const termin of termine) {
      if (!termin.startzeit) continue
      const start = new Date(termin.startzeit)
      const diffMs = start.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)

      if (
        diffHours >= 0 &&
        diffHours <= 24 &&
        String(termin.status || '').toLowerCase() !== 'abgeschlossen'
      ) {
        liste.push({
          id: `termin-${termin.id}`,
          typ: 'termin',
          titel: 'Bevorstehender Termin',
          text: `${termin.titel || termin.id} findet innerhalb der nächsten 24 Stunden statt.`,
          link: '/termine',
          prioritaet: 'niedrig',
          zeitstempel: termin.startzeit || termin.created_at || new Date().toISOString(),
        })
      }
    }

    const gewicht: Record<Prioritaet, number> = {
      hoch: 1,
      mittel: 2,
      niedrig: 3,
    }

    if (sortierung === 'prioritaet') {
      return liste.sort((a, b) => {
        const diffPrio = gewicht[a.prioritaet] - gewicht[b.prioritaet]
        if (diffPrio !== 0) return diffPrio
        return new Date(b.zeitstempel).getTime() - new Date(a.zeitstempel).getTime()
      })
    }

    return liste.sort(
      (a, b) => new Date(b.zeitstempel).getTime() - new Date(a.zeitstempel).getTime()
    )
  }, [lagerartikel, rechnungen, serviceauftraege, termine, sortierung])

  function farbe(prio: Prioritaet) {
    if (prio === 'hoch') {
      return {
        background: 'rgba(220,38,38,0.18)',
        border: '#dc2626',
        label: 'Hoch',
      }
    }
    if (prio === 'mittel') {
      return {
        background: 'rgba(245,158,11,0.18)',
        border: '#f59e0b',
        label: 'Mittel',
      }
    }
    return {
      background: 'rgba(37,99,235,0.18)',
      border: '#2563eb',
      label: 'Niedrig',
    }
  }

  return (
    <div className="page-card">
      <h1>Benachrichtigungen</h1>
      <p>Automatische Hinweise aus Lager, Rechnungen, Serviceaufträgen und Terminen.</p>

      <div
        className="list-box"
        style={{
          marginBottom: 16,
          border: '2px solid #d1d5db',
        }}
      >
        <strong>Farblegende</strong>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          <div
            style={{
              background: 'rgba(220,38,38,0.18)',
              border: '2px solid #dc2626',
              borderRadius: 12,
              padding: 10,
            }}
          >
            Hoch – dringend bearbeiten
          </div>
          <div
            style={{
              background: 'rgba(245,158,11,0.18)',
              border: '2px solid #f59e0b',
              borderRadius: 12,
              padding: 10,
            }}
          >
            Mittel – zeitnah prüfen
          </div>
          <div
            style={{
              background: 'rgba(37,99,235,0.18)',
              border: '2px solid #2563eb',
              borderRadius: 12,
              padding: 10,
            }}
          >
            Niedrig – Hinweis / bevorstehend
          </div>
        </div>

        <div className="action-row" style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setSortierung('prioritaet')}
            style={{
              background: sortierung === 'prioritaet' ? '#2563eb' : '#6b7280',
            }}
          >
            Nach Priorität
          </button>
          <button
            type="button"
            onClick={() => setSortierung('neuheit')}
            style={{
              background: sortierung === 'neuheit' ? '#2563eb' : '#6b7280',
            }}
          >
            Nach Neuheit
          </button>
        </div>
      </div>

      {benachrichtigungen.map((n) => {
        const style = farbe(n.prioritaet)

        return (
          <div
            key={n.id}
            className="list-box"
            style={{
              background: style.background,
              border: `2px solid ${style.border}`,
            }}
          >
            <strong>{n.titel}</strong>
            <br />
            Priorität: {style.label}
            <br />
            Zeitpunkt: {new Date(n.zeitstempel).toLocaleString('de-DE')}
            <br />
            {n.text}

            <div className="action-row" style={{ marginTop: 10 }}>
              <Link
                href={n.link}
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Öffnen
              </Link>
            </div>
          </div>
        )
      })}

      {benachrichtigungen.length === 0 && (
        <div className="muted">Aktuell keine Benachrichtigungen vorhanden.</div>
      )}

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}