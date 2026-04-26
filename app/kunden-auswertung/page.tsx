'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  email: string | null
  telefon: string | null
  ort: string | null
  created_at?: string | null
}

type Fahrzeug = {
  id: string
  kunde_id: string | null
}

type Rechnung = {
  id: string
  kunde_id: string | null
  brutto_summe: number | null
  offener_betrag: number | null
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  status: string | null
}

export default function KundenAuswertungPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Serviceannahme', 'Buchhaltung']}>
      <KundenAuswertungPageContent />
    </RoleGuard>
  )
}

function KundenAuswertungPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [suche, setSuche] = useState('')
  const [fehler, setFehler] = useState('')

  async function laden() {
    setFehler('')

    const [kundenRes, fahrzeugeRes, rechnungenRes, serviceRes] = await Promise.all([
      supabase.from('kunden').select('*').order('created_at', { ascending: false }),
      supabase.from('fahrzeuge').select('id, kunde_id'),
      supabase.from('rechnungen').select('id, kunde_id, brutto_summe, offener_betrag'),
      supabase.from('serviceauftraege').select('id, kunde_id, status'),
    ])

    const error =
      kundenRes.error || fahrzeugeRes.error || rechnungenRes.error || serviceRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden((kundenRes.data || []) as Kunde[])
    setFahrzeuge((fahrzeugeRes.data || []) as Fahrzeug[])
    setRechnungen((rechnungenRes.data || []) as Rechnung[])
    setServiceauftraege((serviceRes.data || []) as Serviceauftrag[])
  }

  useEffect(() => {
    laden()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') || ''
    setSuche(q)
  }, [])

  const daten = useMemo(() => {
    const q = suche.trim().toLowerCase()

    const gefilterteKunden = kunden.filter((kunde) => {
      if (!q) return true

      return [
        kunde.vorname,
        kunde.nachname,
        kunde.firmenname,
        kunde.email,
        kunde.telefon,
        kunde.ort,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })

    return gefilterteKunden.map((kunde) => {
      const kundenFahrzeuge = fahrzeuge.filter((f) => f.kunde_id === kunde.id)
      const kundenRechnungen = rechnungen.filter((r) => r.kunde_id === kunde.id)
      const kundenServiceauftraege = serviceauftraege.filter((s) => s.kunde_id === kunde.id)

      const umsatz = kundenRechnungen.reduce(
        (sum, r) => sum + Number(r.brutto_summe || 0),
        0
      )

      const offen = kundenRechnungen.reduce(
        (sum, r) => sum + Number(r.offener_betrag || 0),
        0
      )

      const aktiveAuftraege = kundenServiceauftraege.filter(
        (s) => !['abgeschlossen', 'abgerechnet', 'storniert'].includes(s.status || '')
      ).length

      return {
        kunde,
        fahrzeugAnzahl: kundenFahrzeuge.length,
        rechnungsAnzahl: kundenRechnungen.length,
        serviceauftragAnzahl: kundenServiceauftraege.length,
        aktiveAuftraege,
        umsatz,
        offen,
      }
    })
  }, [kunden, fahrzeuge, rechnungen, serviceauftraege, suche])

  const gesamtUmsatz = daten.reduce((sum, eintrag) => sum + eintrag.umsatz, 0)
  const gesamtOffen = daten.reduce((sum, eintrag) => sum + eintrag.offen, 0)

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Kunden-Auswertung</h1>
          <div className="topbar-subtitle">
            Umsatz, offene Beträge, Fahrzeuge und Aufträge pro Kunde.
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">
          Kunden
          <strong>{daten.length}</strong>
        </div>
        <div className="kpi-pill">
          Gesamtumsatz
          <strong>{gesamtUmsatz.toFixed(2)} €</strong>
        </div>
        <div className="kpi-pill">
          Offen gesamt
          <strong>{gesamtOffen.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="page-card">
        <div className="form-row">
          <input
            placeholder="Kunden suchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
        </div>
      </div>

      <div>
        {daten.map((eintrag) => {
          const name =
            eintrag.kunde.firmenname ||
            `${eintrag.kunde.vorname || ''} ${eintrag.kunde.nachname || ''}`.trim() ||
            'Unbekannter Kunde'

          return (
            <div key={eintrag.kunde.id} className="list-box">
              <strong>{name}</strong>
              <br />
              E-Mail: {eintrag.kunde.email || '-'}
              <br />
              Telefon: {eintrag.kunde.telefon || '-'}
              <br />
              Ort: {eintrag.kunde.ort || '-'}
              <br />
              Fahrzeuge: {eintrag.fahrzeugAnzahl}
              <br />
              Rechnungen: {eintrag.rechnungsAnzahl}
              <br />
              Serviceaufträge: {eintrag.serviceauftragAnzahl}
              <br />
              Aktive Aufträge: {eintrag.aktiveAuftraege}
              <br />
              Umsatz: {eintrag.umsatz.toFixed(2)} €
              <br />
              Offen: {eintrag.offen.toFixed(2)} €
            </div>
          )
        })}

        {daten.length === 0 && <div className="muted">Keine Kunden gefunden.</div>}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}