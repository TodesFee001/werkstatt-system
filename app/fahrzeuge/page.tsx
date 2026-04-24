'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Fahrzeug = {
  id: string
  kunde_id: string | null
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  fahrgestellnummer: string | null
  farbe: string | null
  kilometerstand: number | null
}

export default function FahrzeugePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Behördenvertreter']}>
      <FahrzeugePageContent />
    </RoleGuard>
  )
}

function FahrzeugePageContent() {
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [suche, setSuche] = useState('')
  const [kundenSuche, setKundenSuche] = useState('')

  const [kundeId, setKundeId] = useState('')
  const [kennzeichen, setKennzeichen] = useState('')
  const [marke, setMarke] = useState('')
  const [modell, setModell] = useState('')
  const [fahrgestellnummer, setFahrgestellnummer] = useState('')
  const [farbe, setFarbe] = useState('')
  const [kilometerstand, setKilometerstand] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const [fRes, kRes] = await Promise.all([
      supabase.from('fahrzeuge').select('*').order('kennzeichen'),
      supabase.from('kunden').select('*').order('firmenname'),
    ])

    if (fRes.error || kRes.error) {
      setFehler(fRes.error?.message || kRes.error?.message || '')
      return
    }

    setFahrzeuge((fRes.data || []) as Fahrzeug[])
    setKunden((kRes.data || []) as Kunde[])
  }

  useEffect(() => {
    laden()
  }, [])

  function kundenName(id: string | null) {
    const k = kunden.find((x) => x.id === id)
    return k ? k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim() : '-'
  }

  const kundenGefiltert = useMemo(() => {
    const q = kundenSuche.trim().toLowerCase()
    return kunden.filter((k) => {
      if (!q) return true
      return [k.firmenname, k.vorname, k.nachname]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [kunden, kundenSuche])

  const fahrzeugeGefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    return fahrzeuge.filter((f) => {
      if (!q) return true
      return [
        f.kennzeichen,
        f.marke,
        f.modell,
        f.fahrgestellnummer,
        f.farbe,
        kundenName(f.kunde_id),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [fahrzeuge, suche, kunden])

  function resetForm() {
    setBearbeitenId(null)
    setKundeId('')
    setKundenSuche('')
    setKennzeichen('')
    setMarke('')
    setModell('')
    setFahrgestellnummer('')
    setFarbe('')
    setKilometerstand('')
  }

  function bearbeitenStarten(f: Fahrzeug) {
    setBearbeitenId(f.id)
    setKundeId(f.kunde_id || '')
    setKundenSuche(kundenName(f.kunde_id))
    setKennzeichen(f.kennzeichen || '')
    setMarke(f.marke || '')
    setModell(f.modell || '')
    setFahrgestellnummer(f.fahrgestellnummer || '')
    setFarbe(f.farbe || '')
    setKilometerstand(f.kilometerstand != null ? String(f.kilometerstand) : '')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!kundeId) {
      setFehler('Bitte einen Kunden auswählen.')
      return
    }

    if (!kennzeichen.trim()) {
      setFehler('Bitte Kennzeichen eingeben.')
      return
    }

    const payload = {
      kunde_id: kundeId,
      kennzeichen: kennzeichen || null,
      marke: marke || null,
      modell: modell || null,
      fahrgestellnummer: fahrgestellnummer || null,
      farbe: farbe || null,
      kilometerstand: kilometerstand ? Number(kilometerstand) : null,
    }

    const res = bearbeitenId
      ? await supabase.from('fahrzeuge').update(payload).eq('id', bearbeitenId)
      : await supabase.from('fahrzeuge').insert(payload)

    if (res.error) {
      setFehler(res.error.message)
      return
    }

    setMeldung(bearbeitenId ? 'Fahrzeug wurde gespeichert.' : 'Fahrzeug wurde erstellt.')
    resetForm()
    laden()
  }

  async function loeschen(id: string) {
    const ok = window.confirm('Fahrzeug wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('fahrzeuge').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Fahrzeug wurde gelöscht.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Fahrzeuge</h1>
          <div className="topbar-subtitle">Fahrzeuge mit integrierter Kundensuche und direkter Kundenauswahl.</div>
        </div>
      </div>

      <form onSubmit={speichern} className="page-card">
        <h2 style={{ marginTop: 0 }}>{bearbeitenId ? 'Fahrzeug bearbeiten' : 'Fahrzeug anlegen'}</h2>

        <div className="form-row">
          <input
            placeholder="Kunde suchen und auswählen"
            value={kundenSuche}
            onChange={(e) => {
              setKundenSuche(e.target.value)
              setKundeId('')
            }}
          />
          <input placeholder="Kennzeichen" value={kennzeichen} onChange={(e) => setKennzeichen(e.target.value)} />
        </div>

        {kundenSuche && !kundeId && (
          <div className="list-box" style={{ marginTop: 12 }}>
            {kundenGefiltert.slice(0, 8).map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setKundeId(k.id)
                  setKundenSuche(kundenName(k.id))
                }}
                style={{ margin: 4, background: '#374151' }}
              >
                {kundenName(k.id)}
              </button>
            ))}
            {kundenGefiltert.length === 0 && <div className="muted">Kein Kunde gefunden.</div>}
          </div>
        )}

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="Marke" value={marke} onChange={(e) => setMarke(e.target.value)} />
          <input placeholder="Modell" value={modell} onChange={(e) => setModell(e.target.value)} />
          <input placeholder="FIN / Fahrgestellnummer" value={fahrgestellnummer} onChange={(e) => setFahrgestellnummer(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="Farbe" value={farbe} onChange={(e) => setFarbe(e.target.value)} />
          <input placeholder="Kilometerstand" value={kilometerstand} onChange={(e) => setKilometerstand(e.target.value)} />
        </div>

        <div className="action-row">
          <button type="submit">{bearbeitenId ? 'Speichern' : 'Fahrzeug erstellen'}</button>
          {bearbeitenId && (
            <button type="button" onClick={resetForm} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="page-card">
        <input placeholder="Fahrzeuge suchen" value={suche} onChange={(e) => setSuche(e.target.value)} />

        <div style={{ marginTop: 16 }}>
          {fahrzeugeGefiltert.map((f) => (
            <div key={f.id} className="list-box">
              <strong>{f.kennzeichen || '-'}</strong>
              <br />
              Kunde: {kundenName(f.kunde_id)}
              <br />
              Fahrzeug: {f.marke || '-'} {f.modell || '-'}
              <br />
              FIN: {f.fahrgestellnummer || '-'}
              <br />
              Kilometerstand: {f.kilometerstand ?? '-'}
              <div className="action-row">
                <Link
                  href={`/fahrzeuge/${f.id}`}
                  style={{ padding: '10px 16px', background: '#2563eb', color: 'white', borderRadius: 12, textDecoration: 'none' }}
                >
                  Fahrzeugakte
                </Link>
                <button type="button" onClick={() => bearbeitenStarten(f)}>Bearbeiten</button>
                <button type="button" onClick={() => loeschen(f.id)} style={{ background: '#dc2626' }}>Löschen</button>
              </div>
            </div>
          ))}

          {fahrzeugeGefiltert.length === 0 && <div className="muted">Keine Fahrzeuge gefunden.</div>}
        </div>
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}