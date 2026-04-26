'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
import { supabase } from '@/lib/supabase'

type Termin = {
  id: string
  titel: string | null
  beschreibung: string | null
  startzeit: string | null
  endzeit: string | null
  status: string | null
  serviceauftrag_id: string | null
  mitarbeiter_id: string | null
  arbeitsplatz_id: string | null
}

type Serviceauftrag = {
  id: string
  art: string | null
}

type Mitarbeiter = {
  id: string
  vorname: string | null
  nachname: string | null
}

type Arbeitsplatz = {
  id: string
  name: string | null
  typ: string | null
  aktiv: boolean | null
}

export default function TerminePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Behördenvertreter']}>
      <TerminePageContent />
    </RoleGuard>
  )
}

function TerminePageContent() {
  const [termine, setTermine] = useState<Termin[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])

  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [startzeit, setStartzeit] = useState('')
  const [endzeit, setEndzeit] = useState('')
  const [status, setStatus] = useState('geplant')
  const [serviceauftragId, setServiceauftragId] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [arbeitsplatzId, setArbeitsplatzId] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenTitel, setBearbeitenTitel] = useState('')
  const [bearbeitenBeschreibung, setBearbeitenBeschreibung] = useState('')
  const [bearbeitenStartzeit, setBearbeitenStartzeit] = useState('')
  const [bearbeitenEndzeit, setBearbeitenEndzeit] = useState('')
  const [bearbeitenStatus, setBearbeitenStatus] = useState('geplant')
  const [bearbeitenServiceauftragId, setBearbeitenServiceauftragId] = useState('')
  const [bearbeitenMitarbeiterId, setBearbeitenMitarbeiterId] = useState('')
  const [bearbeitenArbeitsplatzId, setBearbeitenArbeitsplatzId] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    setFehler('')

    const [tRes, sRes, mRes, aRes] = await Promise.all([
      supabase.from('termine').select('*'),
      supabase.from('serviceauftraege').select('id, art').order('art'),
      supabase.from('mitarbeiter').select('id, vorname, nachname').order('vorname'),
      supabase.from('arbeitsplaetze').select('id, name, typ, aktiv').order('name'),
    ])

    if (tRes.error || sRes.error || mRes.error || aRes.error) {
      setFehler(
        tRes.error?.message ||
          sRes.error?.message ||
          mRes.error?.message ||
          aRes.error?.message ||
          ''
      )
      return
    }

    const termineSortiert = ((tRes.data || []) as Termin[]).sort((a, b) => {
      const now = Date.now()
      const aTime = a.startzeit ? new Date(a.startzeit).getTime() : 0
      const bTime = b.startzeit ? new Date(b.startzeit).getTime() : 0
      const aDiff = Math.abs(aTime - now)
      const bDiff = Math.abs(bTime - now)
      return aDiff - bDiff
    })

    setTermine(termineSortiert)
    setServiceauftraege((sRes.data || []) as Serviceauftrag[])
    setMitarbeiter((mRes.data || []) as Mitarbeiter[])
    setArbeitsplaetze(((aRes.data || []) as Arbeitsplatz[]).filter((a) => a.aktiv !== false))
  }

  useEffect(() => {
    laden()
  }, [])

  function serviceauftragName(id: string | null) {
    const s = serviceauftraege.find((x) => x.id === id)
    return s ? s.art || s.id : '-'
  }

  function mitarbeiterName(id: string | null) {
    const m = mitarbeiter.find((x) => x.id === id)
    return m ? `${m.vorname || ''} ${m.nachname || ''}`.trim() : '-'
  }

  function arbeitsplatzName(id: string | null) {
    const a = arbeitsplaetze.find((x) => x.id === id)
    return a ? `${a.name || '-'}${a.typ ? ` – ${a.typ}` : ''}` : '-'
  }

  async function erstellen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!titel.trim()) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    if (!startzeit) {
      setFehler('Bitte eine Startzeit wählen.')
      return
    }

    if (endzeit && new Date(endzeit).getTime() < new Date(startzeit).getTime()) {
      setFehler('Die Endzeit darf nicht vor der Startzeit liegen.')
      return
    }

    const { error } = await supabase.from('termine').insert({
      titel: titel.trim(),
      beschreibung: beschreibung || null,
      startzeit: startzeit || null,
      endzeit: endzeit || null,
      status,
      serviceauftrag_id: serviceauftragId || null,
      mitarbeiter_id: mitarbeiterId || null,
      arbeitsplatz_id: arbeitsplatzId || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setTitel('')
    setBeschreibung('')
    setStartzeit('')
    setEndzeit('')
    setStatus('geplant')
    setServiceauftragId('')
    setMitarbeiterId('')
    setArbeitsplatzId('')
    setMeldung('Termin wurde erstellt.')
    laden()
  }

  function bearbeitenStarten(t: Termin) {
    setBearbeitenId(t.id)
    setBearbeitenTitel(t.titel || '')
    setBearbeitenBeschreibung(t.beschreibung || '')
    setBearbeitenStartzeit(t.startzeit ? t.startzeit.slice(0, 16) : '')
    setBearbeitenEndzeit(t.endzeit ? t.endzeit.slice(0, 16) : '')
    setBearbeitenStatus(t.status || 'geplant')
    setBearbeitenServiceauftragId(t.serviceauftrag_id || '')
    setBearbeitenMitarbeiterId(t.mitarbeiter_id || '')
    setBearbeitenArbeitsplatzId(t.arbeitsplatz_id || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenTitel('')
    setBearbeitenBeschreibung('')
    setBearbeitenStartzeit('')
    setBearbeitenEndzeit('')
    setBearbeitenStatus('geplant')
    setBearbeitenServiceauftragId('')
    setBearbeitenMitarbeiterId('')
    setBearbeitenArbeitsplatzId('')
  }

  async function bearbeitenSpeichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!bearbeitenId) return

    if (!bearbeitenTitel.trim()) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    if (!bearbeitenStartzeit) {
      setFehler('Bitte eine Startzeit wählen.')
      return
    }

    if (
      bearbeitenEndzeit &&
      new Date(bearbeitenEndzeit).getTime() < new Date(bearbeitenStartzeit).getTime()
    ) {
      setFehler('Die Endzeit darf nicht vor der Startzeit liegen.')
      return
    }

    const { error } = await supabase
      .from('termine')
      .update({
        titel: bearbeitenTitel.trim(),
        beschreibung: bearbeitenBeschreibung || null,
        startzeit: bearbeitenStartzeit || null,
        endzeit: bearbeitenEndzeit || null,
        status: bearbeitenStatus,
        serviceauftrag_id: bearbeitenServiceauftragId || null,
        mitarbeiter_id: bearbeitenMitarbeiterId || null,
        arbeitsplatz_id: bearbeitenArbeitsplatzId || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    setMeldung('Termin wurde gespeichert.')
    laden()
  }

  async function loeschen(id: string) {
    setFehler('')
    setMeldung('')

    const ok = window.confirm('Termin wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('termine').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Termin wurde gelöscht.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Termine</h1>
          <div className="topbar-subtitle">
            Automatisch nach dem zeitlich nächsten Termin sortiert, mit Bearbeiten und Löschen.
          </div>
        </div>
      </div>

      <form onSubmit={erstellen} className="page-card">
        <h2 style={{ marginTop: 0 }}>Neuen Termin anlegen</h2>

        <div className="form-row">
          <input
            placeholder="Titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="geplant">geplant</option>
            <option value="bestaetigt">bestaetigt</option>
            <option value="in_arbeit">in_arbeit</option>
            <option value="abgeschlossen">abgeschlossen</option>
            <option value="verschoben">verschoben</option>
            <option value="storniert">storniert</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Beschreibung"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 100 }}
          />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            type="datetime-local"
            value={startzeit}
            onChange={(e) => setStartzeit(e.target.value)}
          />
          <input
            type="datetime-local"
            value={endzeit}
            onChange={(e) => setEndzeit(e.target.value)}
          />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <select
            value={serviceauftragId}
            onChange={(e) => setServiceauftragId(e.target.value)}
          >
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraege.map((s) => (
              <option key={s.id} value={s.id}>
                {s.art || s.id}
              </option>
            ))}
          </select>

          <select
            value={mitarbeiterId}
            onChange={(e) => setMitarbeiterId(e.target.value)}
          >
            <option value="">Mitarbeiter auswählen</option>
            {mitarbeiter.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
              </option>
            ))}
          </select>

          <select
            value={arbeitsplatzId}
            onChange={(e) => setArbeitsplatzId(e.target.value)}
          >
            <option value="">Arbeitsplatz auswählen</option>
            {arbeitsplaetze.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.id} {a.typ ? `– ${a.typ}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="action-row">
          <button type="submit">Termin erstellen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={bearbeitenSpeichern} className="page-card">
          <h2 style={{ marginTop: 0 }}>Termin bearbeiten</h2>

          <div className="form-row">
            <input
              placeholder="Titel"
              value={bearbeitenTitel}
              onChange={(e) => setBearbeitenTitel(e.target.value)}
            />
            <select
              value={bearbeitenStatus}
              onChange={(e) => setBearbeitenStatus(e.target.value)}
            >
              <option value="geplant">geplant</option>
              <option value="bestaetigt">bestaetigt</option>
              <option value="in_arbeit">in_arbeit</option>
              <option value="abgeschlossen">abgeschlossen</option>
              <option value="verschoben">verschoben</option>
              <option value="storniert">storniert</option>
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Beschreibung"
              value={bearbeitenBeschreibung}
              onChange={(e) => setBearbeitenBeschreibung(e.target.value)}
              style={{ width: '100%', minHeight: 100 }}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <input
              type="datetime-local"
              value={bearbeitenStartzeit}
              onChange={(e) => setBearbeitenStartzeit(e.target.value)}
            />
            <input
              type="datetime-local"
              value={bearbeitenEndzeit}
              onChange={(e) => setBearbeitenEndzeit(e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <select
              value={bearbeitenServiceauftragId}
              onChange={(e) => setBearbeitenServiceauftragId(e.target.value)}
            >
              <option value="">Serviceauftrag auswählen</option>
              {serviceauftraege.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.art || s.id}
                </option>
              ))}
            </select>

            <select
              value={bearbeitenMitarbeiterId}
              onChange={(e) => setBearbeitenMitarbeiterId(e.target.value)}
            >
              <option value="">Mitarbeiter auswählen</option>
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
                </option>
              ))}
            </select>

            <select
              value={bearbeitenArbeitsplatzId}
              onChange={(e) => setBearbeitenArbeitsplatzId(e.target.value)}
            >
              <option value="">Arbeitsplatz auswählen</option>
              {arbeitsplaetze.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.id} {a.typ ? `– ${a.typ}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="action-row">
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Terminliste</h2>

        {termine.map((t) => (
          <div key={t.id} className="list-box">
            <strong>{t.titel || '-'}</strong>
            <br />
            Beschreibung: {t.beschreibung || '-'}
            <br />
            Start: {t.startzeit ? new Date(t.startzeit).toLocaleString('de-DE') : '-'}
            <br />
            Ende: {t.endzeit ? new Date(t.endzeit).toLocaleString('de-DE') : '-'}
            <br />
            Serviceauftrag: {serviceauftragName(t.serviceauftrag_id)}
            <br />
            Mitarbeiter: {mitarbeiterName(t.mitarbeiter_id)}
            <br />
            Arbeitsplatz: {arbeitsplatzName(t.arbeitsplatz_id)}
            <br />
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={t.status || 'geplant'} />
            </div>

            <div className="action-row" style={{ marginTop: 10 }}>
              <button type="button" onClick={() => bearbeitenStarten(t)}>
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => loeschen(t.id)}
                style={{ background: '#dc2626' }}
              >
                Löschen
              </button>
            </div>
          </div>
        ))}

        {termine.length === 0 && <div className="muted">Noch keine Termine vorhanden.</div>}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}