'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  offener_betrag: number | null
  mahnstufe: number | null
  forderungsstatus: string | null
  inkasso_am: string | null
  status: string | null
  faellig_am: string | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

export default function ForderungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <ForderungenPageContent />
    </RoleGuard>
  )
}

function ForderungenPageContent() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [filter, setFilter] = useState('alle')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const [rRes, kRes] = await Promise.all([
      supabase.from('rechnungen').select('*').order('created_at', { ascending: false }),
      supabase.from('kunden').select('*'),
    ])

    if (rRes.error || kRes.error) {
      setFehler(rRes.error?.message || kRes.error?.message || '')
      return
    }

    setRechnungen((rRes.data || []) as Rechnung[])
    setKunden((kRes.data || []) as Kunde[])
  }

  useEffect(() => {
    laden()
  }, [])

  function kundeName(id: string | null) {
    const kunde = kunden.find((k) => k.id === id)
    return kunde
      ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
      : '-'
  }

  const posten = useMemo(() => {
    const basis = rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0)

    if (filter === 'alle') return basis
    if (filter === 'mahnung_1') {
      return basis.filter((r) => Number(r.mahnstufe || 0) === 1)
    }
    if (filter === 'mahnung_2') {
      return basis.filter((r) => Number(r.mahnstufe || 0) === 2)
    }
    if (filter === 'mahnung_3_plus') {
      return basis.filter((r) => Number(r.mahnstufe || 0) >= 3)
    }
    return basis
  }, [rechnungen, filter])

  const gesamt = posten.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0)

  return (
    <div className="page-card">
      <h1>Forderungen</h1>
      <p>
        Diese Seite dient der kaufmännischen Nachverfolgung offener Rechnungen mit Mahnstufe und Forderungsstatus.
      </p>

      <div className="kpi-strip" style={{ marginBottom: 18 }}>
        <div className="kpi-pill">
          Aktive Forderungen
          <strong>{posten.length}</strong>
        </div>
        <div className="kpi-pill">
          Forderungssumme
          <strong>{gesamt.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="action-row" style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setFilter('alle')}
          style={{ background: filter === 'alle' ? '#2563eb' : '#6b7280' }}
        >
          Alle
        </button>
        <button
          type="button"
          onClick={() => setFilter('mahnung_1')}
          style={{ background: filter === 'mahnung_1' ? '#2563eb' : '#6b7280' }}
        >
          Mahnung 1
        </button>
        <button
          type="button"
          onClick={() => setFilter('mahnung_2')}
          style={{ background: filter === 'mahnung_2' ? '#2563eb' : '#6b7280' }}
        >
          Mahnung 2
        </button>
        <button
          type="button"
          onClick={() => setFilter('mahnung_3_plus')}
          style={{ background: filter === 'mahnung_3_plus' ? '#2563eb' : '#6b7280' }}
        >
          Mahnung 3+
        </button>
      </div>

      {posten.map((r) => (
        <div key={r.id} className="list-box">
          <strong>{r.rechnungsnummer || r.id}</strong>
          <br />
          Kunde: {kundeName(r.kunde_id)}
          <br />
          Fällig am: {r.faellig_am || '-'}
          <br />
          Offener Betrag: {Number(r.offener_betrag || 0).toFixed(2)} €
          <br />
          Mahnstufe: {r.mahnstufe || 0}
          <br />
          Inkasso am: {r.inkasso_am ? new Date(r.inkasso_am).toLocaleString('de-DE') : '-'}
          <br />
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={r.forderungsstatus || 'offen'} />
          </div>

          <div className="action-row" style={{ marginTop: 10 }}>
            <Link
              href="/zahlungen"
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                background: '#2563eb',
                color: 'white',
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              Zahlung prüfen
            </Link>
            <Link
              href="/mahnungen"
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                background: '#f59e0b',
                color: 'white',
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              Mahnung verwalten
            </Link>
          </div>
        </div>
      ))}

      {posten.length === 0 && <div className="muted">Keine aktiven Forderungen vorhanden.</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}