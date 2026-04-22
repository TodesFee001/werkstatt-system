'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'

type Termin = {
  id: string
  titel: string | null
  beschreibung: string | null
  startzeit: string
  endzeit: string | null
  serviceauftrag_id: string | null
  mitarbeiter_id: string | null
  arbeitsplatz: string | null
  arbeitsplatz_id: string | null
  status: string | null
  konflikt_mitarbeiter: boolean | null
  konflikt_arbeitsplatz: boolean | null
  konflikt_gesamt: boolean | null
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
  name: string
  typ: string | null
  aktiv: boolean | null
}

type Schicht = {
  id: string
  mitarbeiter_id: string
  datum: string
  startzeit: string
  endzeit: string
  notiz: string | null
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfCalendar(date: Date) {
  const first = startOfMonth(date)
  const day = first.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const result = new Date(first)
  result.setDate(first.getDate() + diff)
  return result
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
}

function datetimeLocalValue(value: string | null) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDatum(d: string) {
  return new Date(d).toLocaleString('de-DE')
}

function zeitenUeberschneiden(
  startA: string,
  endeA: string | null,
  startB: string,
  endeB: string | null
) {
  const aStart = new Date(startA).getTime()
  const aEnd = new Date(endeA || startA).getTime()
  const bStart = new Date(startB).getTime()
  const bEnd = new Date(endeB || startB).getTime()
  return aStart < bEnd && bStart < aEnd
}

function konfliktHintergrund(t: Termin) {
  if (t.konflikt_gesamt) return '#fee2e2'
  if (t.status === 'abgeschlossen') return '#dcfce7'
  if (t.status === 'in_arbeit') return '#dbeafe'
  if (t.status === 'bestaetigt') return '#ede9fe'
  if (t.status === 'verschoben') return '#fef3c7'
  return '#eff6ff'
}

export default function TerminePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Serviceannahme', 'Werkstatt']}>
      <TermineContent />
    </RoleGuard>
  )
}

function TermineContent() {
  const [termine, setTermine] = useState<Termin[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])
  const [schichten, setSchichten] = useState<Schicht[]>([])

  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [start, setStart] = useState('')
  const [ende, setEnde] = useState('')
  const [auftragId, setAuftragId] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [arbeitsplatzId, setArbeitsplatzId] = useState('')
  const [status, setStatus] = useState('geplant')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenTitel, setBearbeitenTitel] = useState('')
  const [bearbeitenBeschreibung, setBearbeitenBeschreibung] = useState('')
  const [bearbeitenStart, setBearbeitenStart] = useState('')
  const [bearbeitenEnde, setBearbeitenEnde] = useState('')
  const [bearbeitenAuftragId, setBearbeitenAuftragId] = useState('')
  const [bearbeitenMitarbeiterId, setBearbeitenMitarbeiterId] = useState('')
  const [bearbeitenArbeitsplatzId, setBearbeitenArbeitsplatzId] = useState('')
  const [bearbeitenStatus, setBearbeitenStatus] = useState('geplant')

  const [aktuellerMonat, setAktuellerMonat] = useState(new Date())
  const [tageFilter, setTageFilter] = useState(new Date().toISOString().slice(0, 10))
  const [mitarbeiterFilter, setMitarbeiterFilter] = useState('alle')
  const [arbeitsplatzFilter, setArbeitsplatzFilter] = useState('alle')
  const [statusFilter, setStatusFilter] = useState('alle')
  const [fehler, setFehler] = useState('')

  async function ladeBasis() {
    const [tRes, sRes, mRes, aRes, schRes] = await Promise.all([
      supabase.from('termine').select('*').order('startzeit'),
      supabase.from('serviceauftraege').select('id, art'),
      supabase.from('mitarbeiter').select('id, vorname, nachname'),
      supabase.from('arbeitsplaetze').select('*').eq('aktiv', true).order('name'),
      supabase.from('mitarbeiter_schichten').select('*').order('datum').order('startzeit'),
    ])

    if (tRes.error || sRes.error || mRes.error || aRes.error || schRes.error) {
      setFehler(
        tRes.error?.message ||
          sRes.error?.message ||
          mRes.error?.message ||
          aRes.error?.message ||
          schRes.error?.message ||
          ''
      )
      return
    }

    const geladeneTermine = (tRes.data || []) as Termin[]
    await konflikteBerechnenUndSpeichern(geladeneTermine)

    const { data: termineNeu, error: termineNeuError } = await supabase
      .from('termine')
      .select('*')
      .order('startzeit')

    if (termineNeuError) {
      setFehler(termineNeuError.message)
      return
    }

    setTermine((termineNeu || []) as Termin[])
    setServiceauftraege(sRes.data || [])
    setMitarbeiter(mRes.data || [])
    setArbeitsplaetze((aRes.data || []) as Arbeitsplatz[])
    setSchichten((schRes.data || []) as Schicht[])
  }

  async function konflikteBerechnenUndSpeichern(alleTermine: Termin[]) {
    for (const termin of alleTermine) {
      const konfliktMitarbeiter = alleTermine.some((anderer) => {
        if (anderer.id === termin.id) return false
        if (!termin.mitarbeiter_id || !anderer.mitarbeiter_id) return false
        if (anderer.mitarbeiter_id !== termin.mitarbeiter_id) return false
        return zeitenUeberschneiden(
          termin.startzeit,
          termin.endzeit,
          anderer.startzeit,
          anderer.endzeit
        )
      })

      const konfliktArbeitsplatz = alleTermine.some((anderer) => {
        if (anderer.id === termin.id) return false

        const gleicherPlatz =
          (termin.arbeitsplatz_id && anderer.arbeitsplatz_id && termin.arbeitsplatz_id === anderer.arbeitsplatz_id) ||
          (!termin.arbeitsplatz_id && !anderer.arbeitsplatz_id && termin.arbeitsplatz && anderer.arbeitsplatz && termin.arbeitsplatz === anderer.arbeitsplatz)

        if (!gleicherPlatz) return false

        return zeitenUeberschneiden(
          termin.startzeit,
          termin.endzeit,
          anderer.startzeit,
          anderer.endzeit
        )
      })

      const konfliktGesamt = konfliktMitarbeiter || konfliktArbeitsplatz

      if (
        konfliktMitarbeiter !== Boolean(termin.konflikt_mitarbeiter) ||
        konfliktArbeitsplatz !== Boolean(termin.konflikt_arbeitsplatz) ||
        konfliktGesamt !== Boolean(termin.konflikt_gesamt)
      ) {
        await supabase
          .from('termine')
          .update({
            konflikt_mitarbeiter: konfliktMitarbeiter,
            konflikt_arbeitsplatz: konfliktArbeitsplatz,
            konflikt_gesamt: konfliktGesamt,
          })
          .eq('id', termin.id)
      }
    }
  }

  useEffect(() => {
    ladeBasis()
  }, [])

  function mitarbeiterName(id: string | null) {
    if (!id) return '-'
    const person = mitarbeiter.find((m) => m.id === id)
    if (!person) return '-'
    return `${person.vorname || ''} ${person.nachname || ''}`.trim()
  }

  function auftragName(id: string | null) {
    if (!id) return '-'
    const auftrag = serviceauftraege.find((s) => s.id === id)
    return auftrag?.art || id
  }

  function arbeitsplatzName(id: string | null, fallback: string | null | undefined) {
    if (id) {
      const platz = arbeitsplaetze.find((a) => a.id === id)
      if (platz) return platz.name
    }
    return fallback || '-'
  }

  function schichtFuerTermin(mitarbeiterIdValue: string | null, startZeit: string, endZeit: string | null) {
    if (!mitarbeiterIdValue) return null

    const startDate = new Date(startZeit)
    const datum = startDate.toISOString().slice(0, 10)
    const startOnly = startDate.toTimeString().slice(0, 5)
    const endeOnly = endZeit ? new Date(endZeit).toTimeString().slice(0, 5) : startOnly

    return schichten.find((s) => {
      if (s.mitarbeiter_id !== mitarbeiterIdValue) return false
      if (s.datum !== datum) return false
      return s.startzeit <= startOnly && s.endzeit >= endeOnly
    }) || null
  }

  async function erstellen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!titel.trim()) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    if (!start) {
      setFehler('Bitte eine Startzeit angeben.')
      return
    }

    const schicht = schichtFuerTermin(mitarbeiterId || null, start, ende || null)

    if (mitarbeiterId && !schicht) {
      setFehler('Der Termin liegt außerhalb der hinterlegten Schicht des Mitarbeiters.')
      return
    }

    const platz = arbeitsplaetze.find((a) => a.id === arbeitsplatzId)

    const { error } = await supabase.from('termine').insert({
      titel: titel.trim(),
      beschreibung: beschreibung || null,
      startzeit: start,
      endzeit: ende || null,
      serviceauftrag_id: auftragId || null,
      mitarbeiter_id: mitarbeiterId || null,
      arbeitsplatz_id: arbeitsplatzId || null,
      arbeitsplatz: platz?.name || null,
      status,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setTitel('')
    setBeschreibung('')
    setStart('')
    setEnde('')
    setAuftragId('')
    setMitarbeiterId('')
    setArbeitsplatzId('')
    setStatus('geplant')
    ladeBasis()
  }

  function bearbeitenStarten(t: Termin) {
    setBearbeitenId(t.id)
    setBearbeitenTitel(t.titel || '')
    setBearbeitenBeschreibung(t.beschreibung || '')
    setBearbeitenStart(datetimeLocalValue(t.startzeit))
    setBearbeitenEnde(datetimeLocalValue(t.endzeit))
    setBearbeitenAuftragId(t.serviceauftrag_id || '')
    setBearbeitenMitarbeiterId(t.mitarbeiter_id || '')
    setBearbeitenArbeitsplatzId(t.arbeitsplatz_id || '')
    setBearbeitenStatus(t.status || 'geplant')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenTitel('')
    setBearbeitenBeschreibung('')
    setBearbeitenStart('')
    setBearbeitenEnde('')
    setBearbeitenAuftragId('')
    setBearbeitenMitarbeiterId('')
    setBearbeitenArbeitsplatzId('')
    setBearbeitenStatus('geplant')
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    const schicht = schichtFuerTermin(
      bearbeitenMitarbeiterId || null,
      bearbeitenStart,
      bearbeitenEnde || null
    )

    if (bearbeitenMitarbeiterId && !schicht) {
      setFehler('Der bearbeitete Termin liegt außerhalb der hinterlegten Schicht.')
      return
    }

    const platz = arbeitsplaetze.find((a) => a.id === bearbeitenArbeitsplatzId)

    const { error } = await supabase
      .from('termine')
      .update({
        titel: bearbeitenTitel.trim(),
        beschreibung: bearbeitenBeschreibung || null,
        startzeit: bearbeitenStart,
        endzeit: bearbeitenEnde || null,
        serviceauftrag_id: bearbeitenAuftragId || null,
        mitarbeiter_id: bearbeitenMitarbeiterId || null,
        arbeitsplatz_id: bearbeitenArbeitsplatzId || null,
        arbeitsplatz: platz?.name || null,
        status: bearbeitenStatus,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeBasis()
  }

  async function loeschen(id: string) {
    const ok = window.confirm('Termin wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('termine').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeBasis()
  }

  async function statusSchnellwechsel(id: string, neuerStatus: string) {
    const { error } = await supabase
      .from('termine')
      .update({ status: neuerStatus })
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeBasis()
  }

  const kalenderTage = useMemo(() => {
    const start = startOfCalendar(aktuellerMonat)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [aktuellerMonat])

  const gefilterteTermine = useMemo(() => {
    return termine.filter((t) => {
      const tagOk = sameDay(new Date(t.startzeit), new Date(tageFilter))
      const mitarbeiterOk =
        mitarbeiterFilter === 'alle' || t.mitarbeiter_id === mitarbeiterFilter
      const arbeitsplatzOk =
        arbeitsplatzFilter === 'alle' || t.arbeitsplatz_id === arbeitsplatzFilter
      const statusOk = statusFilter === 'alle' || t.status === statusFilter

      return tagOk && mitarbeiterOk && arbeitsplatzOk && statusOk
    })
  }, [termine, tageFilter, mitarbeiterFilter, arbeitsplatzFilter, statusFilter])

  function termineFuerTag(tag: Date) {
    return termine.filter((t) => sameDay(new Date(t.startzeit), tag))
  }

  const boardNachStatus = useMemo(() => {
    const statusListe = ['geplant', 'bestaetigt', 'in_arbeit', 'abgeschlossen', 'verschoben', 'storniert']
    return statusListe.map((statusName) => ({
      status: statusName,
      termine: gefilterteTermine.filter((t) => t.status === statusName),
    }))
  }, [gefilterteTermine])

  const kapazitaet = useMemo(() => {
    const aktiveMitarbeiter = schichten.filter((s) => s.datum === tageFilter).length
    const aktivePlaetze = arbeitsplaetze.filter((a) => a.aktiv).length
    const termineHeute = gefilterteTermine.length
    const konflikte = gefilterteTermine.filter((t) => t.konflikt_gesamt).length

    return {
      aktiveMitarbeiter,
      aktivePlaetze,
      termineHeute,
      konflikte,
    }
  }, [schichten, arbeitsplaetze, gefilterteTermine, tageFilter])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Kalender / Werkstattplanung</h1>
          <div className="topbar-subtitle">
            Kapazität, Arbeitsplätze, Schichten und Status in einer Ansicht.
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Schichten am Tag</div>
          <div className="stat-value">{kapazitaet.aktiveMitarbeiter}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aktive Arbeitsplätze</div>
          <div className="stat-value">{kapazitaet.aktivePlaetze}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gefilterte Termine</div>
          <div className="stat-value">{kapazitaet.termineHeute}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Konflikte</div>
          <div className="stat-value">{kapazitaet.konflikte}</div>
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
          <select value={arbeitsplatzId} onChange={(e) => setArbeitsplatzId(e.target.value)}>
            <option value="">Kein Arbeitsplatz</option>
            {arbeitsplaetze.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.typ ? `- ${a.typ}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            type="datetime-local"
            value={ende}
            onChange={(e) => setEnde(e.target.value)}
          />
          <select value={auftragId} onChange={(e) => setAuftragId(e.target.value)}>
            <option value="">Kein Serviceauftrag</option>
            {serviceauftraege.map((s) => (
              <option key={s.id} value={s.id}>
                {s.art || s.id}
              </option>
            ))}
          </select>
          <select value={mitarbeiterId} onChange={(e) => setMitarbeiterId(e.target.value)}>
            <option value="">Kein Mitarbeiter</option>
            {mitarbeiter.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Beschreibung"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div className="action-row">
          <button type="submit">Termin erstellen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={speichern} className="page-card">
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
            <select
              value={bearbeitenArbeitsplatzId}
              onChange={(e) => setBearbeitenArbeitsplatzId(e.target.value)}
            >
              <option value="">Kein Arbeitsplatz</option>
              {arbeitsplaetze.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.typ ? `- ${a.typ}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <input
              type="datetime-local"
              value={bearbeitenStart}
              onChange={(e) => setBearbeitenStart(e.target.value)}
            />
            <input
              type="datetime-local"
              value={bearbeitenEnde}
              onChange={(e) => setBearbeitenEnde(e.target.value)}
            />
            <select
              value={bearbeitenAuftragId}
              onChange={(e) => setBearbeitenAuftragId(e.target.value)}
            >
              <option value="">Kein Serviceauftrag</option>
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
              <option value="">Kein Mitarbeiter</option>
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Beschreibung"
              value={bearbeitenBeschreibung}
              onChange={(e) => setBearbeitenBeschreibung(e.target.value)}
              style={{ width: '100%', minHeight: 90 }}
            />
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
        <div className="topbar" style={{ marginBottom: 0 }}>
          <button
            type="button"
            onClick={() =>
              setAktuellerMonat(
                new Date(aktuellerMonat.getFullYear(), aktuellerMonat.getMonth() - 1, 1)
              )
            }
          >
            Voriger Monat
          </button>

          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {formatMonthTitle(aktuellerMonat)}
          </div>

          <button
            type="button"
            onClick={() =>
              setAktuellerMonat(
                new Date(aktuellerMonat.getFullYear(), aktuellerMonat.getMonth() + 1, 1)
              )
            }
          >
            Nächster Monat
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(180px, 1fr))',
          gap: 12,
          alignItems: 'start',
          overflowX: 'auto',
        }}
      >
        {kalenderTage.map((tag) => {
          const istAndererMonat = tag.getMonth() !== aktuellerMonat.getMonth()
          const tagTermine = termineFuerTag(tag)

          return (
            <div
              key={tag.toISOString()}
              style={{
                minHeight: 220,
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                background: istAndererMonat ? '#f8fafc' : 'white',
                padding: 12,
                boxShadow: '0 6px 16px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 10,
                  color: istAndererMonat ? '#94a3b8' : '#111827',
                }}
              >
                {dayLabel(tag)}
              </div>

              {tagTermine.length === 0 ? (
                <div className="muted">Keine Termine</div>
              ) : (
                tagTermine.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      marginBottom: 10,
                      padding: 10,
                      borderRadius: 12,
                      background: konfliktHintergrund(t),
                      border: t.konflikt_gesamt ? '1px solid #fca5a5' : '1px solid #dbeafe',
                    }}
                  >
                    <strong>{t.titel || '-'}</strong>
                    <br />
                    <span style={{ fontSize: 13 }}>
                      {new Date(t.startzeit).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {t.endzeit
                        ? ` - ${new Date(t.endzeit).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : ''}
                    </span>
                    <br />
                    <span style={{ fontSize: 13 }}>
                      Mitarbeiter: {mitarbeiterName(t.mitarbeiter_id)}
                    </span>
                    <br />
                    <span style={{ fontSize: 13 }}>
                      Platz: {arbeitsplatzName(t.arbeitsplatz_id, t.arbeitsplatz)}
                    </span>
                    <br />
                    <span style={{ fontSize: 13 }}>
                      Auftrag: {auftragName(t.serviceauftrag_id)}
                    </span>
                    <br />
                    <div style={{ marginTop: 6 }}>
                      <StatusBadge status={t.status} />
                    </div>
                    {t.konflikt_mitarbeiter && (
                      <div style={{ fontSize: 12, color: '#991b1b', marginTop: 6 }}>
                        Konflikt Mitarbeiter
                      </div>
                    )}
                    {t.konflikt_arbeitsplatz && (
                      <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>
                        Konflikt Arbeitsplatz
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Werkstattboard nach Status</h2>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <input type="date" value={tageFilter} onChange={(e) => setTageFilter(e.target.value)} />

          <select value={mitarbeiterFilter} onChange={(e) => setMitarbeiterFilter(e.target.value)}>
            <option value="alle">Alle Mitarbeiter</option>
            {mitarbeiter.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
              </option>
            ))}
          </select>

          <select value={arbeitsplatzFilter} onChange={(e) => setArbeitsplatzFilter(e.target.value)}>
            <option value="alle">Alle Arbeitsplätze</option>
            {arbeitsplaetze.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="alle">Alle Status</option>
            <option value="geplant">geplant</option>
            <option value="bestaetigt">bestaetigt</option>
            <option value="in_arbeit">in_arbeit</option>
            <option value="abgeschlossen">abgeschlossen</option>
            <option value="verschoben">verschoben</option>
            <option value="storniert">storniert</option>
          </select>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 14,
          }}
        >
          {boardNachStatus.map((spalte) => (
            <div
              key={spalte.status}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 14,
                background: 'white',
              }}
            >
              <strong>{spalte.status}</strong>
              <div style={{ marginTop: 12 }}>
                {spalte.termine.length === 0 ? (
                  <div className="muted">Keine Termine</div>
                ) : (
                  spalte.termine.map((t) => (
                    <div
                      key={t.id}
                      className="list-box"
                      style={{ background: konfliktHintergrund(t) }}
                    >
                      <strong>{t.titel || '-'}</strong>
                      <br />
                      {new Date(t.startzeit).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {t.endzeit
                        ? ` - ${new Date(t.endzeit).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : ''}
                      <br />
                      Mitarbeiter: {mitarbeiterName(t.mitarbeiter_id)}
                      <br />
                      Platz: {arbeitsplatzName(t.arbeitsplatz_id, t.arbeitsplatz)}
                      <br />
                      Auftrag: {auftragName(t.serviceauftrag_id)}
                      <br />
                      <div style={{ marginTop: 8 }}>
                        <StatusBadge status={t.status} />
                      </div>

                      <div className="action-row">
                        <button type="button" onClick={() => bearbeitenStarten(t)}>
                          Bearbeiten
                        </button>
                        <button type="button" onClick={() => statusSchnellwechsel(t.id, 'in_arbeit')}>
                          In Arbeit
                        </button>
                        <button type="button" onClick={() => statusSchnellwechsel(t.id, 'abgeschlossen')}>
                          Abschließen
                        </button>
                        <button type="button" onClick={() => loeschen(t.id)} style={{ background: '#dc2626' }}>
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Terminliste</h2>

        {termine.map((t) => (
          <div key={t.id} className="list-box">
            <strong>{t.titel || '-'}</strong>
            <br />
            Beschreibung: {t.beschreibung || '-'}
            <br />
            Start: {formatDatum(t.startzeit)}
            <br />
            Ende: {t.endzeit ? formatDatum(t.endzeit) : '-'}
            <br />
            Auftrag: {auftragName(t.serviceauftrag_id)}
            <br />
            Mitarbeiter: {mitarbeiterName(t.mitarbeiter_id)}
            <br />
            Arbeitsplatz: {arbeitsplatzName(t.arbeitsplatz_id, t.arbeitsplatz)}
            <br />
            Konflikt Mitarbeiter: {t.konflikt_mitarbeiter ? 'ja' : 'nein'}
            <br />
            Konflikt Arbeitsplatz: {t.konflikt_arbeitsplatz ? 'ja' : 'nein'}
            <br />
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={t.status} />
            </div>
          </div>
        ))}

        {termine.length === 0 && <div className="muted">Keine Termine vorhanden.</div>}
      </div>

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}