'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/lib/useRealtimeTable'

type Bewegung = {
  id: string
  erstellt_am: string
  lagerartikel_id: string
  bewegung: string
  menge: number
  alter_bestand: number | null
  neuer_bestand: number | null
  grund: string | null
  benutzername: string | null
}

type Artikel = {
  id: string
  artikelnummer: number | null
  name: string | null
}

export default function LagerbewegungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Lager', 'Werkstatt', 'Behördenvertreter']}>
      <LagerbewegungenContent />
    </RoleGuard>
  )
}

function LagerbewegungenContent() {
  const [bewegungen, setBewegungen] = useState<Bewegung[]>([])
  const [artikel, setArtikel] = useState<Artikel[]>([])
  const [suche, setSuche] = useState('')
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState<string>('')

  const laden = useCallback(async () => {
    const [bRes, aRes] = await Promise.all([
      supabase.from('lagerbewegungen').select('*').order('erstellt_am', { ascending: false }),
      supabase.from('lagerartikel').select('id, artikelnummer, name'),
    ])

    if (bRes.error || aRes.error) {
      setFehler(bRes.error?.message || aRes.error?.message || '')
      return
    }

    setBewegungen((bRes.data || []) as Bewegung[])
    setArtikel((aRes.data || []) as Artikel[])
    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('lagerbewegungen', laden)
  useRealtimeTable('lagerartikel', laden)

  function artikelName(id: string) {
    const a = artikel.find((x) => x.id === id)
    if (!a) return '-'
    return `${a.artikelnummer ?? '-'} – ${a.name || '-'}`
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return bewegungen.filter((b) => {
      if (!q) return true

      return [
        artikelName(b.lagerartikel_id),
        b.bewegung,
        b.grund,
        b.benutzername,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [bewegungen, suche, artikel])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Lagerbewegungen</h1>
          <div className="topbar-subtitle">
            Live-Historie aller Bestandsänderungen.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>
      </div>

      <div className="page-card">
        <input
          placeholder="Lagerbewegungen durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          {gefiltert.map((b) => (
            <div key={b.id} className="list-box">
              <strong>{artikelName(b.lagerartikel_id)}</strong>
              <br />
              Bewegung: {b.bewegung}
              <br />
              Menge: {Number(b.menge || 0).toFixed(2)}
              <br />
              Bestand: {b.alter_bestand ?? '-'} → {b.neuer_bestand ?? '-'}
              <br />
              Grund: {b.grund || '-'}
              <br />
              Benutzer: {b.benutzername || '-'}
              <br />
              Zeit: {b.erstellt_am ? new Date(b.erstellt_am).toLocaleString('de-DE') : '-'}
            </div>
          ))}

          {gefiltert.length === 0 && <div className="muted">Keine Lagerbewegungen vorhanden.</div>}
        </div>
      </div>

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}