'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import { logAktion } from '@/lib/activity-log'
import { softDeleteDatensatz } from '@/lib/soft-delete'
import { useRealtimeTable } from '@/lib/useRealtimeTable'

type Kunde = {
  id: string
  firmenname: string | null
  vorname: string | null
  nachname: string | null
  telefon: string | null
  email: string | null
  adresse: string | null
  interne_notiz: string | null
  ist_geloescht: boolean | null
}

export default function KundenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Serviceannahme', 'Buchhaltung', 'Behördenvertreter']}>
      <KundenPageContent />
    </RoleGuard>
  )
}

function KundenPageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [suche, setSuche] = useState('')

  const [firmenname, setFirmenname] = useState('')
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [adresse, setAdresse] = useState('')
  const [notiz, setNotiz] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState('')

  const laden = useCallback(async () => {
    const { data, error } = await supabase
      .from('kunden')
      .select('*')
      .eq('ist_geloescht', false)
      .order('firmenname')

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden((data || []) as Kunde[])
    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('kunden', laden)

  function kundenName(k: Partial<Kunde>) {
    return k.firmenname || `${k.vorname || ''} ${k.nachname || ''}`.trim() || 'Unbenannter Kunde'
  }

  const gefiltert = useMemo(() => {
    const q = suche.toLowerCase()

    return kunden.filter((k) =>
      [
        kundenName(k),
        k.telefon,
        k.email,
        k.adresse,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [kunden, suche])

  function resetForm() {
    setBearbeitenId(null)
    setFirmenname('')
    setVorname('')
    setNachname('')
    setTelefon('')
    setEmail('')
    setAdresse('')
    setNotiz('')
  }

  function bearbeitenStarten(k: Kunde) {
    setBearbeitenId(k.id)
    setFirmenname(k.firmenname || '')
    setVorname(k.vorname || '')
    setNachname(k.nachname || '')
    setTelefon(k.telefon || '')
    setEmail(k.email || '')
    setAdresse(k.adresse || '')
    setNotiz(k.interne_notiz || '')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    const payload = {
      firmenname: firmenname || null,
      vorname: vorname || null,
      nachname: nachname || null,
      telefon: telefon || null,
      email: email || null,
      adresse: adresse || null,
      interne_notiz: notiz || null,
      ist_geloescht: false,
    }

    if (bearbeitenId) {
      const { error } = await supabase
        .from('kunden')
        .update(payload)
        .eq('id', bearbeitenId)

      if (error) {
        setFehler(error.message)
        return
      }

      await logAktion('kunden', 'bearbeitet', bearbeitenId, kundenName(payload), { neueDaten: payload })
      setMeldung('Kunde wurde aktualisiert.')
    } else {
      const { data, error } = await supabase
        .from('kunden')
        .insert(payload)
        .select()
        .single()

      if (error) {
        setFehler(error.message)
        return
      }

      await logAktion('kunden', 'erstellt', data.id, kundenName(payload), payload)
      setMeldung('Kunde wurde erstellt.')
    }

    resetForm()
    laden()
  }

  async function loeschen(k: Kunde) {
    const ok = window.confirm('Kunde wirklich archivieren? Er wird nicht endgültig gelöscht.')
    if (!ok) return

    try {
      await softDeleteDatensatz({
        tabelle: 'kunden',
        id: k.id,
        titel: kundenName(k),
      })

      setMeldung('Kunde wurde archiviert.')
      laden()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler beim Archivieren.')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Kunden</h1>
          <div className="topbar-subtitle">
            Kundenverwaltung mit Soft Delete.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>
      </div>

      <form onSubmit={speichern} className="page-card">
        <h2>{bearbeitenId ? 'Kunde bearbeiten' : 'Kunde anlegen'}</h2>

        <div className="form-row">
          <input placeholder="Firmenname" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} />
          <input placeholder="Vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
          <input placeholder="Nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} />
        </div>

        <div className="form-row">
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          <input placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-row">
          <input placeholder="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
        </div>

        <textarea
          placeholder="Interne Notiz"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          style={{ marginTop: 10 }}
        />

        <div className="action-row">
          <button type="submit">{bearbeitenId ? 'Speichern' : 'Erstellen'}</button>

          {bearbeitenId && (
            <button type="button" onClick={resetForm} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="page-card">
        <input
          placeholder="Kunden suchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />

        {gefiltert.map((k) => (
          <div key={k.id} className="list-box">
            <strong>{kundenName(k)}</strong>
            <br />
            {k.telefon || '-'} | {k.email || '-'}
            <div className="action-row">
              <Link href={`/kunden/${k.id}`} className="button-link">
                Kundenakte
              </Link>
              <button type="button" onClick={() => bearbeitenStarten(k)}>
                Bearbeiten
              </button>
              <button type="button" onClick={() => loeschen(k)} style={{ background: '#dc2626' }}>
                Archivieren
              </button>
            </div>
          </div>
        ))}

        {gefiltert.length === 0 && <div className="muted">Keine Kunden vorhanden.</div>}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}