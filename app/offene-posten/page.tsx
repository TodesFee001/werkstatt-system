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
  status: string | null
  faellig_am: string | null
  mahnstufe: number | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

export default function OffenePostenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <OffenePostenPageContent />
    </RoleGuard>
  )
}

function OffenePostenPageContent() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [suche, setSuche] = useState('')
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

  const offen = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return rechnungen
      .filter((r) => Number(r.offener_betrag || 0) > 0)
      .filter((r) => {
        if (!q) return true
        return [
          r.rechnungsnummer,
          kundeName(r.kunde_id),
          r.faellig_am,
          r.status,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      })
      .sort((a, b) => Number(b.offener_betrag || 0) - Number(a.offener_betrag || 0))
  }, [rechnungen, suche, kunden])

  const gesamtOffen = offen.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0)

  return (
    <div className="page-card">
      <h1>Offene Posten</h1>
      <p>Hier siehst du ausschließlich aktive unbezahlte oder teilbezahlte Rechnungen.</p>

      <div className="kpi-strip" style={{ marginBottom: 18 }}>
        <div className="kpi-pill">
          Aktive offene Posten
          <strong>{offen.length}</strong>
        </div>
        <div className="kpi-pill">
          Gesamtsumme offen
          <strong>{gesamtOffen.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          placeholder="Offene Posten durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
      </div>

      {offen.map((r) => (
        <div key={r.id} className="list-box">
          <strong>{r.rechnungsnummer || r.id}</strong>
          <br />
          Kunde: {kundeName(r.kunde_id)}
          <br />
          Fällig am: {r.faellig_am || '-'}
          <br />
          Mahnstufe: {r.mahnstufe || 0}
          <br />
          Offener Betrag: {Number(r.offener_betrag || 0).toFixed(2)} €
          <br />
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={r.status || 'offen'} />
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
              Zahlung erfassen
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
              Mahnung prüfen
            </Link>
          </div>
        </div>
      ))}

      {offen.length === 0 && <div className="muted">Keine offenen Posten vorhanden.</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}