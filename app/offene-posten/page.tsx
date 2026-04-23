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
  status: string | null
  faellig_am: string | null
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
    return rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0)
  }, [rechnungen])

  return (
    <div className="page-card">
      <h1>Offene Posten</h1>
      <p>Hier siehst du ausschließlich unbezahlte oder teilbezahlte Rechnungen.</p>

      {offen.map((r) => (
        <div key={r.id} className="list-box">
          <strong>{r.rechnungsnummer || r.id}</strong>
          <br />
          Kunde: {kundeName(r.kunde_id)}
          <br />
          Fällig am: {r.faellig_am || '-'}
          <br />
          Offener Betrag: {Number(r.offener_betrag || 0).toFixed(2)} €
          <br />
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={r.status || 'offen'} />
          </div>
        </div>
      ))}

      {offen.length === 0 && <div className="muted">Keine offenen Posten vorhanden.</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}