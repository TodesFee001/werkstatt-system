'use client'

import { useEffect, useMemo, useState } from 'react'
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
    return rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0)
  }, [rechnungen])

  return (
    <div className="page-card">
      <h1>Forderungen</h1>
      <p>
        Diese Seite ist die kaufmännische Nachverfolgung offener Rechnungen mit Mahnstufe,
        Inkasso und Forderungsstatus.
      </p>

      {posten.map((r) => (
        <div key={r.id} className="list-box">
          <strong>{r.rechnungsnummer || r.id}</strong>
          <br />
          Kunde: {kundeName(r.kunde_id)}
          <br />
          Offener Betrag: {Number(r.offener_betrag || 0).toFixed(2)} €
          <br />
          Mahnstufe: {r.mahnstufe || 0}
          <br />
          Inkasso am:{' '}
          {r.inkasso_am ? new Date(r.inkasso_am).toLocaleString('de-DE') : '-'}
          <br />
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={r.forderungsstatus || 'offen'} />
          </div>
        </div>
      ))}

      {posten.length === 0 && <div className="muted">Keine Forderungen vorhanden.</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}