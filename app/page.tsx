'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

type Rechnung = {
  id: string
  status: string | null
  brutto_summe: number | null
  offener_betrag: number | null
  rechnungsdatum: string | null
}

type Serviceauftrag = {
  id: string
  status: string | null
}

type Mitarbeiter = {
  id: string
  status: string | null
}

type Lagerartikel = {
  id: string
  name: string
  bestand: number | null
  mindestbestand: number | null
}

type Termin = {
  id: string
  startzeit: string
  konflikt_gesamt: boolean | null
}

type Arbeitsplatz = {
  id: string
  aktiv: boolean | null
}

type Schicht = {
  id: string
  datum: string
}

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

export default function Dashboard() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])
  const [schichten, setSchichten] = useState<Schicht[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeDaten() {
    const [rechnungenRes, serviceRes, mitarbeiterRes, lagerRes, termineRes, plaetzeRes, schichtenRes] =
      await Promise.all([
        supabase.from('rechnungen').select('*'),
        supabase.from('serviceauftraege').select('*'),
        supabase.from('mitarbeiter').select('*'),
        supabase.from('lagerartikel').select('*'),
        supabase.from('termine').select('*'),
        supabase.from('arbeitsplaetze').select('*'),
        supabase.from('mitarbeiter_schichten').select('*'),
      ])

    const error =
      rechnungenRes.error ||
      serviceRes.error ||
      mitarbeiterRes.error ||
      lagerRes.error ||
      termineRes.error ||
      plaetzeRes.error ||
      schichtenRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setRechnungen(rechnungenRes.data || [])
    setServiceauftraege(serviceRes.data || [])
    setMitarbeiter(mitarbeiterRes.data || [])
    setLagerartikel(lagerRes.data || [])
    setTermine(termineRes.data || [])
    setArbeitsplaetze(plaetzeRes.data || [])
    setSchichten(schichtenRes.data || [])
  }

  useEffect(() => {
    ladeDaten()
  }, [])

  const heute = new Date().toISOString().slice(0, 10)

  const offeneRechnungen = rechnungen.filter((r) => Number(r.offener_betrag || 0) > 0).length
  const umsatz = rechnungen.reduce((sum, r) => sum + Number(r.brutto_summe || 0), 0)
  const offeneServiceauftraege = serviceauftraege.filter(
    (s) => !['abgeschlossen', 'abgerechnet', 'storniert'].includes(s.status || '')
  ).length
  const inArbeit = serviceauftraege.filter((s) => s.status === 'in_arbeit').length
  const warnungenLager = lagerartikel.filter(
    (a) => Number(a.bestand || 0) <= Number(a.mindestbestand || 0)
  )
  const aktiveMitarbeiter = mitarbeiter.filter((m) => m.status === 'aktiv').length
  const konfliktTermine = termine.filter((t) => t.konflikt_gesamt).length

  const tagesTermine = termine.filter((t) => t.startzeit.slice(0, 10) === heute).length
  const tagesSchichten = schichten.filter((s) => s.datum === heute).length
  const aktivePlaetze = arbeitsplaetze.filter((a) => a.aktiv).length

  const umsatzMonate = useMemo(() => {
    const monate = Array.from({ length: 12 }, (_, i) => ({
      monat: `${i + 1}`,
      umsatz: 0,
    }))

    for (const r of rechnungen) {
      if (!r.rechnungsdatum) continue
      const d = new Date(r.rechnungsdatum)
      monate[d.getMonth()].umsatz += Number(r.brutto_summe || 0)
    }

    return monate
  }, [rechnungen])

  const statusPieData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of serviceauftraege) {
      const key = s.status || 'unbekannt'
      map[key] = (map[key] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [serviceauftraege])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="hero-card">
        <h1>Werkstatt-Dashboard</h1>
        <p>
          Überblick über Umsatz, Tagesauslastung, Serviceaufträge, Lager und Kapazität.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Gesamtumsatz</div>
          <div className="stat-value">{umsatz.toFixed(2)} €</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offene Rechnungen</div>
          <div className="stat-value">{offeneRechnungen}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offene Serviceaufträge</div>
          <div className="stat-value">{offeneServiceauftraege}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fahrzeuge in Arbeit</div>
          <div className="stat-value">{inArbeit}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aktive Mitarbeiter</div>
          <div className="stat-value">{aktiveMitarbeiter}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Konflikt-Termine</div>
          <div className="stat-value">{konfliktTermine}</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Termine heute</div>
          <div className="stat-value">{tagesTermine}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Schichten heute</div>
          <div className="stat-value">{tagesSchichten}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aktive Arbeitsplätze</div>
          <div className="stat-value">{aktivePlaetze}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lagerwarnungen</div>
          <div className="stat-value">{warnungenLager.length}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <h2 style={{ marginTop: 0 }}>Umsatz pro Monat</h2>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={umsatzMonate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monat" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="umsatz" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h2 style={{ marginTop: 0 }}>Serviceauftrag-Status</h2>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {statusPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <h2 style={{ marginTop: 0 }}>Schnellaktionen</h2>
          <div className="action-row">
            <Link href="/kunden" className="sidebar-link" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              Neuer Kunde
            </Link>
            <Link href="/fahrzeuge" className="sidebar-link" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              Neues Fahrzeug
            </Link>
            <Link href="/serviceauftraege" className="sidebar-link" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              Neuer Auftrag
            </Link>
            <Link href="/termine" className="sidebar-link" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              Werkstattplanung
            </Link>
            <Link href="/arbeitsplaetze" className="sidebar-link" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              Arbeitsplätze
            </Link>
            <Link href="/schichten" className="sidebar-link" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              Schichten
            </Link>
          </div>
        </div>

        <div className="chart-card">
          <h2 style={{ marginTop: 0 }}>Lagerwarnungen</h2>
          {warnungenLager.length === 0 ? (
            <div className="muted">Keine Lagerwarnungen vorhanden.</div>
          ) : (
            warnungenLager.slice(0, 8).map((a) => (
              <div key={a.id} className="list-box" style={{ marginBottom: 10 }}>
                <strong>{a.name}</strong>
                <br />
                Bestand: {Number(a.bestand || 0).toFixed(2)}
                <br />
                Mindestbestand: {Number(a.mindestbestand || 0).toFixed(2)}
              </div>
            ))
          )}
        </div>
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}