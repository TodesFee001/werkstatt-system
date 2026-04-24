'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import { logAktion } from '@/lib/activity-log'

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

type Mitarbeiter = {
  id: string
  vorname: string | null
  nachname: string | null
}

type Arbeitsplatz = {
  id: string
  name: string | null
  typ: string | null
}

type Serviceauftrag = {
  id: string
  art: string | null
  status: string | null
}

const STATUS = ['geplant', 'bestaetigt', 'in_arbeit', 'abgeschlossen', 'abgesagt']

export default function KalenderPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Behördenvertreter']}>
      <KalenderPageContent />
    </RoleGuard>
  )
}

function KalenderPageContent() {
  const [termine, setTermine] = useState<Termin[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])

  const [ansicht, setAnsicht] = useState<'tag' | 'monat'>('monat')
  const [aktuellesDatum, setAktuellesDatum] = useState(new Date())

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [startzeit, setStartzeit] = useState('')
  const [endzeit, setEndzeit] = useState('')
  const [status, setStatus] = useState('geplant')
  const [serviceauftragId, setServiceauftragId] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [arbeitsplatzId, setArbeitsplatzId] = useState('')

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const [tRes, mRes, aRes, sRes] = await Promise.all([
      supabase.from('termine').select('*').order('startzeit', { ascending: true }),
      supabase.from('mitarbeiter').select('*').order('vorname'),
      supabase.from('arbeitsplaetze').select('*').order('name'),
      supabase.from('serviceauftraege').select('id, art, status').order('created_at', { ascending: false }),
    ])

    if (tRes.error || mRes.error || aRes.error || sRes.error) {
      setFehler(tRes.error?.message || mRes.error?.message || aRes.error?.message || sRes.error?.message || '')
      return
    }

    setTermine((tRes.data || []) as Termin[])
    setMitarbeiter((mRes.data || []) as Mitarbeiter[])
    setArbeitsplaetze((aRes.data || []) as Arbeitsplatz[])
    setServiceauftraege((sRes.data || []) as Serviceauftrag[])
  }

  useEffect(() => {
    laden()
  }, [])

  function datumKey(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  function mitarbeiterName(id: string | null) {
    const m = mitarbeiter.find((x) => x.id === id)
    return m ? `${m.vorname || ''} ${m.nachname || ''}`.trim() : '-'
  }

  function arbeitsplatzName(id: string | null) {
    const a = arbeitsplaetze.find((x) => x.id === id)
    return a ? `${a.name || '-'}${a.typ ? ` – ${a.typ}` : ''}` : '-'
  }

  function serviceauftragName(id: string | null) {
    const s = serviceauftraege.find((x) => x.id === id)
    return s ? `${s.art || 'Serviceauftrag'} – ${s.status || '-'}` : '-'
  }

  const termineAmTag = useMemo(() => {
    const key = datumKey(aktuellesDatum)

    return termine
      .filter((t) => t.startzeit && datumKey(new Date(t.startzeit)) === key)
      .sort((a, b) => new Date(a.startzeit || '').getTime() - new Date(b.startzeit || '').getTime())
  }, [termine, aktuellesDatum])

  const monatstage = useMemo(() => {
    const jahr = aktuellesDatum.getFullYear()
    const monat = aktuellesDatum.getMonth()

    const erster = new Date(jahr, monat, 1)
    const letzter = new Date(jahr, monat + 1, 0)

    const start = new Date(erster)
    const startTag = start.getDay() === 0 ? 6 : start.getDay() - 1
    start.setDate(start.getDate() - startTag)

    const tage: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      tage.push(d)
    }

    return tage
  }, [aktuellesDatum])

  function termineFuerDatum(d: Date) {
    const key = datumKey(d)
    return termine
      .filter((t) => t.startzeit && datumKey(new Date(t.startzeit)) === key)
      .sort((a, b) => new Date(a.startzeit || '').getTime() - new Date(b.startzeit || '').getTime())
  }

  function vorher() {
    const d = new Date(aktuellesDatum)
    if (ansicht === 'tag') d.setDate(d.getDate() - 1)
    if (ansicht === 'monat') d.setMonth(d.getMonth() - 1)
    setAktuellesDatum(d)
  }

  function weiter() {
    const d = new Date(aktuellesDatum)
    if (ansicht === 'tag') d.setDate(d.getDate() + 1)
    if (ansicht === 'monat') d.setMonth(d.getMonth() + 1)
    setAktuellesDatum(d)
  }

  function heute() {
    setAktuellesDatum(new Date())
  }

  function bearbeitenStarten(t: Termin) {
    setBearbeitenId(t.id)
    setTitel(t.titel || '')
    setBeschreibung(t.beschreibung || '')
    setStartzeit(t.startzeit ? t.startzeit.slice(0, 16) : '')
    setEndzeit(t.endzeit ? t.endzeit.slice(0, 16) : '')
    setStatus(t.status || 'geplant')
    setServiceauftragId(t.serviceauftrag_id || '')
    setMitarbeiterId(t.mitarbeiter_id || '')
    setArbeitsplatzId(t.arbeitsplatz_id || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setTitel('')
    setBeschreibung('')
    setStartzeit('')
    setEndzeit('')
    setStatus('geplant')
    setServiceauftragId('')
    setMitarbeiterId('')
    setArbeitsplatzId('')
  }

  async function bearbeitenSpeichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!bearbeitenId) return

    if (!titel.trim()) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    if (!startzeit || !endzeit) {
      setFehler('Bitte Startzeit und Endzeit angeben.')
      return
    }

    const start = new Date(startzeit)
    const ende = new Date(endzeit)

    if (ende.getTime() <= start.getTime()) {
      setFehler('Die Endzeit muss nach der Startzeit liegen.')
      return
    }

    const { error } = await supabase
      .from('termine')
      .update({
        titel,
        beschreibung: beschreibung || null,
        startzeit: start.toISOString(),
        endzeit: ende.toISOString(),
        status,
        serviceauftrag_id: serviceauftragId || null,
        mitarbeiter_id: mitarbeiterId || null,
        arbeitsplatz_id: arbeitsplatzId || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    await logAktion('termin', 'bearbeitet', bearbeitenId, titel, {
      startzeit,
      endzeit,
      status,
      serviceauftrag_id: serviceauftragId || null,
      mitarbeiter_id: mitarbeiterId || null,
      arbeitsplatz_id: arbeitsplatzId || null,
    })

    bearbeitenAbbrechen()
    setMeldung('Termin wurde gespeichert.')
    laden()
  }

  async function terminLoeschen(id: string) {
    setFehler('')
    setMeldung('')

    const termin = termine.find((t) => t.id === id)
    const ok = window.confirm('Termin wirklich löschen?')
    if (!ok) return

    const { error } = await supabase.from('termine').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    await logAktion('termin', 'geloescht', id, termin?.titel || id, {
      startzeit: termin?.startzeit || null,
      endzeit: termin?.endzeit || null,
    })

    setMeldung('Termin wurde gelöscht.')
    laden()
  }

  const titelDatum =
    ansicht === 'tag'
      ? aktuellesDatum.toLocaleDateString('de-DE', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : aktuellesDatum.toLocaleDateString('de-DE', {
          month: 'long',
          year: 'numeric',
        })

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Kalender / Planung</h1>
          <div className="topbar-subtitle">
            Tages- und Monatsansicht mit Bearbeiten, Löschen, Mitarbeiter-, Arbeitsplatz- und Serviceauftrag-Verknüpfung.
          </div>
        </div>
      </div>

      <div className="page-card">
        <div className="action-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="action-row" style={{ marginTop: 0 }}>
            <button
              type="button"
              onClick={() => setAnsicht('tag')}
              style={{ background: ansicht === 'tag' ? '#2563eb' : '#6b7280' }}
            >
              Tagesansicht
            </button>
            <button
              type="button"
              onClick={() => setAnsicht('monat')}
              style={{ background: ansicht === 'monat' ? '#2563eb' : '#6b7280' }}
            >
              Monatsansicht
            </button>
          </div>

          <div className="action-row" style={{ marginTop: 0 }}>
            <button type="button" onClick={vorher}>
              Zurück
            </button>
            <button type="button" onClick={heute}>
              Heute
            </button>
            <button type="button" onClick={weiter}>
              Weiter
            </button>
          </div>
        </div>

        <h2 style={{ marginBottom: 0 }}>{titelDatum}</h2>
      </div>

      {bearbeitenId && (
        <form onSubmit={bearbeitenSpeichern} className="page-card">
          <h2 style={{ marginTop: 0 }}>Termin bearbeiten</h2>

          <div className="form-row">
            <input
              placeholder="Titel"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
            />

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
            <select value={serviceauftragId} onChange={(e) => setServiceauftragId(e.target.value)}>
              <option value="">Serviceauftrag auswählen</option>
              {serviceauftraege.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.art || 'Serviceauftrag'} – {s.status || '-'}
                </option>
              ))}
            </select>

            <select value={mitarbeiterId} onChange={(e) => setMitarbeiterId(e.target.value)}>
              <option value="">Mitarbeiter auswählen</option>
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {`${m.vorname || ''} ${m.nachname || ''}`.trim() || m.id}
                </option>
              ))}
            </select>

            <select value={arbeitsplatzId} onChange={(e) => setArbeitsplatzId(e.target.value)}>
              <option value="">Arbeitsplatz auswählen</option>
              {arbeitsplaetze.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.id}{a.typ ? ` – ${a.typ}` : ''}
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
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {ansicht === 'tag' && (
        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Termine am Tag</h2>

          {termineAmTag.map((t) => (
            <div key={t.id} className="list-box">
              <strong>{t.titel || '-'}</strong>
              <br />
              Zeit:{' '}
              {t.startzeit ? new Date(t.startzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-'}
              {' '}bis{' '}
              {t.endzeit ? new Date(t.endzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-'}
              <br />
              Status: {t.status || '-'}
              <br />
              Serviceauftrag: {serviceauftragName(t.serviceauftrag_id)}
              <br />
              Mitarbeiter: {mitarbeiterName(t.mitarbeiter_id)}
              <br />
              Arbeitsplatz: {arbeitsplatzName(t.arbeitsplatz_id)}
              <br />
              Beschreibung: {t.beschreibung || '-'}

              <div className="action-row">
                <button type="button" onClick={() => bearbeitenStarten(t)}>
                  Bearbeiten
                </button>
                <button type="button" onClick={() => terminLoeschen(t.id)} style={{ background: '#dc2626' }}>
                  Löschen
                </button>
              </div>
            </div>
          ))}

          {termineAmTag.length === 0 && <div className="muted">Keine Termine an diesem Tag vorhanden.</div>}
        </div>
      )}

      {ansicht === 'monat' && (
        <div className="page-card">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))',
              gap: 10,
            }}
          >
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((tag) => (
              <div
                key={tag}
                style={{
                  fontWeight: 900,
                  color: '#f59e0b',
                  padding: 10,
                  textAlign: 'center',
                }}
              >
                {tag}
              </div>
            ))}

            {monatstage.map((d) => {
              const imMonat = d.getMonth() === aktuellesDatum.getMonth()
              const heuteKey = datumKey(new Date()) === datumKey(d)
              const tagesTermine = termineFuerDatum(d)

              return (
                <div
                  key={datumKey(d)}
                  style={{
                    minHeight: 150,
                    border: heuteKey ? '2px solid #f59e0b' : '1px solid #36414d',
                    borderRadius: 14,
                    padding: 10,
                    background: imMonat ? '#1b232c' : 'rgba(27,35,44,0.45)',
                    opacity: imMonat ? 1 : 0.55,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAktuellesDatum(new Date(d))
                      setAnsicht('tag')
                    }}
                    style={{
                      background: heuteKey ? '#f59e0b' : '#374151',
                      color: heuteKey ? '#111827' : '#fff',
                      padding: '6px 10px',
                      borderRadius: 10,
                      marginBottom: 8,
                      fontWeight: 900,
                    }}
                  >
                    {d.getDate()}
                  </button>

                  <div style={{ display: 'grid', gap: 6 }}>
                    {tagesTermine.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        style={{
                          border: '1px solid rgba(245,158,11,0.35)',
                          background: 'rgba(245,158,11,0.12)',
                          borderRadius: 10,
                          padding: 8,
                          fontSize: 13,
                        }}
                      >
                        <strong>{t.titel || '-'}</strong>
                        <br />
                        {t.startzeit
                          ? new Date(t.startzeit).toLocaleTimeString('de-DE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                        <div className="action-row" style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => bearbeitenStarten(t)}
                            style={{ padding: '6px 8px', fontSize: 12 }}
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() => terminLoeschen(t.id)}
                            style={{ background: '#dc2626', padding: '6px 8px', fontSize: 12 }}
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))}

                    {tagesTermine.length > 4 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAktuellesDatum(new Date(d))
                          setAnsicht('tag')
                        }}
                        style={{
                          background: '#2563eb',
                          padding: '6px 8px',
                          fontSize: 12,
                        }}
                      >
                        + {tagesTermine.length - 4} weitere
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}