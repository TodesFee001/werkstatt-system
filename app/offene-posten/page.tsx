'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  kunde_id: string | null
  rechnungsdatum: string | null
  faellig_am: string | null
  status: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  mahnstufe: number | null
  letzte_mahnung_am: string | null
}

function OffenePostenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [kundenRes, rechnungenRes] = await Promise.all([
      supabase.from('kunden').select('*'),
      supabase.from('rechnungen').select('*').order('rechnungsdatum', { ascending: false }),
    ])

    const error = kundenRes.error || rechnungenRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden(kundenRes.data || [])
    setRechnungen(rechnungenRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  const offenePosten = useMemo(() => {
    return rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0)
  }, [rechnungen])

  function kundeName(id: string | null) {
    if (!id) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return 'Unbekannter Kunde'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  function istUeberfaellig(faelligAm: string | null) {
    if (!faelligAm) return false
    return new Date(faelligAm) < new Date(new Date().toISOString().slice(0, 10))
  }

  async function mahnen(rechnung: Rechnung) {
    const bestaetigt = window.confirm('Mahnstufe erhöhen?')
    if (!bestaetigt) return

    const { error } = await supabase
      .from('rechnungen')
      .update({
        mahnstufe: Number(rechnung.mahnstufe || 0) + 1,
        letzte_mahnung_am: new Date().toISOString(),
        status: 'ueberfaellig',
      })
      .eq('id', rechnung.id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  return (
    <div className="page-card">
      <h1>Offene Posten</h1>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <strong>Gesamtoffen</strong>
        <br />
        {offenePosten.reduce((sum, r) => sum + Number(r.offener_betrag || 0), 0).toFixed(2)} €
      </div>

      <div>
        {offenePosten.map((rechnung) => (
          <div key={rechnung.id} className="list-box">
            <strong>{rechnung.rechnungsnummer || rechnung.id}</strong>
            <br />
            Kunde: {kundeName(rechnung.kunde_id)}
            <br />
            Rechnungsdatum: {rechnung.rechnungsdatum || '-'}
            <br />
            Fällig am: {rechnung.faellig_am || '-'}
            <br />
            Überfällig: {istUeberfaellig(rechnung.faellig_am) ? 'ja' : 'nein'}
            <br />
            Status: {rechnung.status || '-'}
            <br />
            Offener Betrag: {Number(rechnung.offener_betrag || 0).toFixed(2)} €
            <br />
            Mahnstufe: {rechnung.mahnstufe || 0}
            <br />
            Letzte Mahnung: {rechnung.letzte_mahnung_am ? new Date(rechnung.letzte_mahnung_am).toLocaleString() : '-'}

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => mahnen(rechnung)}>
                Mahnen
              </button>

              <a
                href={`/email-vorschau/rechnung/${rechnung.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#0f766e',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                E-Mail-Vorschau
              </a>
            </div>
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function OffenePostenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <OffenePostenPageContent />
    </RoleGuard>
  )
}