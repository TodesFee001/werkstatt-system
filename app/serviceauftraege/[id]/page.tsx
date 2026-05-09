'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import AttachmentManager from '../../components/AttachmentManager'
import RoleGuard from '../../components/RoleGuard'
import StatusBadge from '../../components/StatusBadge'
import ServiceTimeline from '../../components/ServiceTimeline'
import { supabase } from '@/lib/supabase'
import { timelineEintrag } from '@/lib/timeline'
import { useRealtimeTable } from '@/lib/useRealtimeTable'
import { lagerBestandAnpassen } from '@/lib/lagerbewegung'

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  fahrzeug_id: string | null
  mitarbeiter_id: string | null
  art: string | null
  status: string | null
  fehlerbeschreibung: string | null
  interne_notiz: string | null
  freigabe_status: string | null
  kilometerstand_bei_annahme: number | null
  tankstand: string | null
  aussencheck: string | null
  innencheck: string | null
  schaeden: string | null
  zubehoer: string | null
  kundenunterschrift: string | null
  mitarbeiterunterschrift: string | null
}

type Kunde = { id: string; vorname: string | null; nachname: string | null; firmenname: string | null }
type Fahrzeug = { id: string; kennzeichen: string | null; marke: string | null; modell: string | null }
type Mitarbeiter = { id: string; vorname: string | null; nachname: string | null }

type Arbeitszeit = {
  id: string
  serviceauftrag_id: string
  beschreibung: string | null
  stunden: number | null
  stundensatz: number | null
}

type Material = {
  id: string
  serviceauftrag_id: string
  lagerartikel_id: string | null
  bezeichnung: string | null
  menge: number | null
  einzelpreis: number | null
  bestand_abgezogen: boolean | null
}

type Lagerartikel = {
  id: string
  artikelnummer: number | null
  name: string | null
  bestand: number | null
  verkaufspreis: number | null
}

const STATUS = [
  'offen',
  'angenommen',
  'in_arbeit',
  'wartet',
  'wartet_auf_freigabe',
  'fertig',
  'abgeschlossen',
  'archiviert',
]

export default function ServiceauftragDetailPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Behördenvertreter']}>
      <ServiceauftragDetailPageContent />
    </RoleGuard>
  )
}

function ServiceauftragDetailPageContent() {
  const params = useParams()
  const id = String(params.id)

  const [auftrag, setAuftrag] = useState<Serviceauftrag | null>(null)
  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [fahrzeug, setFahrzeug] = useState<Fahrzeug | null>(null)
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter | null>(null)
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([])
  const [materialien, setMaterialien] = useState<Material[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])

  const [status, setStatus] = useState('offen')
  const [fehlerbeschreibung, setFehlerbeschreibung] = useState('')
  const [interneNotiz, setInterneNotiz] = useState('')
  const [kilometerstand, setKilometerstand] = useState('')
  const [tankstand, setTankstand] = useState('voll')
  const [aussencheck, setAussencheck] = useState('')
  const [innencheck, setInnencheck] = useState('')
  const [schaeden, setSchaeden] = useState('')
  const [zubehoer, setZubehoer] = useState('')
  const [kundenunterschrift, setKundenunterschrift] = useState('')
  const [mitarbeiterunterschrift, setMitarbeiterunterschrift] = useState('')

  const [azBeschreibung, setAzBeschreibung] = useState('')
  const [azStunden, setAzStunden] = useState('')
  const [azSatz, setAzSatz] = useState('')

  const [matSuche, setMatSuche] = useState('')
  const [matLagerartikelId, setMatLagerartikelId] = useState('')
  const [matBezeichnung, setMatBezeichnung] = useState('')
  const [matMenge, setMatMenge] = useState('')
  const [matPreis, setMatPreis] = useState('')

  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [letzteAktualisierung, setLetzteAktualisierung] = useState('')

  const laden = useCallback(async () => {
    const auftragRes = await supabase.from('serviceauftraege').select('*').eq('id', id).maybeSingle()

    if (auftragRes.error) {
      setFehler(auftragRes.error.message)
      return
    }

    const a = (auftragRes.data as Serviceauftrag | null) || null
    setAuftrag(a)

    if (a) {
      setStatus(a.status || 'offen')
      setFehlerbeschreibung(a.fehlerbeschreibung || '')
      setInterneNotiz(a.interne_notiz || '')
      setKilometerstand(a.kilometerstand_bei_annahme != null ? String(a.kilometerstand_bei_annahme) : '')
      setTankstand(a.tankstand || 'voll')
      setAussencheck(a.aussencheck || '')
      setInnencheck(a.innencheck || '')
      setSchaeden(a.schaeden || '')
      setZubehoer(a.zubehoer || '')
      setKundenunterschrift(a.kundenunterschrift || '')
      setMitarbeiterunterschrift(a.mitarbeiterunterschrift || '')
    }

    if (a?.kunde_id) {
      const res = await supabase.from('kunden').select('*').eq('id', a.kunde_id).maybeSingle()
      if (!res.error) setKunde((res.data as Kunde | null) || null)
    } else {
      setKunde(null)
    }

    if (a?.fahrzeug_id) {
      const res = await supabase.from('fahrzeuge').select('*').eq('id', a.fahrzeug_id).maybeSingle()
      if (!res.error) setFahrzeug((res.data as Fahrzeug | null) || null)
    } else {
      setFahrzeug(null)
    }

    if (a?.mitarbeiter_id) {
      const res = await supabase.from('mitarbeiter').select('*').eq('id', a.mitarbeiter_id).maybeSingle()
      if (!res.error) setMitarbeiter((res.data as Mitarbeiter | null) || null)
    } else {
      setMitarbeiter(null)
    }

    const [azRes, matRes, lagerRes] = await Promise.all([
      supabase.from('serviceauftrag_arbeitszeiten').select('*').eq('serviceauftrag_id', id),
      supabase.from('serviceauftrag_material').select('*').eq('serviceauftrag_id', id),
      supabase.from('lagerartikel').select('id, artikelnummer, name, bestand, verkaufspreis').order('artikelnummer'),
    ])

    if (azRes.error || matRes.error || lagerRes.error) {
      setFehler(azRes.error?.message || matRes.error?.message || lagerRes.error?.message || '')
      return
    }

    setArbeitszeiten((azRes.data || []) as Arbeitszeit[])
    setMaterialien((matRes.data || []) as Material[])
    setLagerartikel((lagerRes.data || []) as Lagerartikel[])
    setLetzteAktualisierung(new Date().toLocaleTimeString('de-DE'))
  }, [id])

  useEffect(() => {
    laden()
  }, [laden])

  useRealtimeTable('serviceauftraege', laden)
  useRealtimeTable('serviceauftrag_material', laden)
  useRealtimeTable('serviceauftrag_arbeitszeiten', laden)
  useRealtimeTable('serviceauftrag_timeline', laden)
  useRealtimeTable('lagerartikel', laden)
  useRealtimeTable('lagerbewegungen', laden)

  const lagerGefiltert = useMemo(() => {
    const q = matSuche.trim().toLowerCase()

    return lagerartikel.filter((a) => {
      if (!q) return true

      return [a.artikelnummer, a.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [lagerartikel, matSuche])

  function lagerName(id: string | null) {
    const a = lagerartikel.find((x) => x.id === id)
    if (!a) return '-'
    return `${a.artikelnummer ?? '-'} – ${a.name || '-'}`
  }

  async function auftragSpeichern() {
    setFehler('')
    setMeldung('')

    const { error } = await supabase
      .from('serviceauftraege')
      .update({
        status,
        fehlerbeschreibung: fehlerbeschreibung || null,
        interne_notiz: interneNotiz || null,
        kilometerstand_bei_annahme: kilometerstand ? Number(kilometerstand) : null,
        tankstand,
        aussencheck: aussencheck || null,
        innencheck: innencheck || null,
        schaeden: schaeden || null,
        zubehoer: zubehoer || null,
        kundenunterschrift: kundenunterschrift || null,
        mitarbeiterunterschrift: mitarbeiterunterschrift || null,
      })
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    await timelineEintrag(
      id,
      'bearbeitung',
      'Auftrag aktualisiert',
      'Auftragsdaten, Status oder Fahrzeugannahme wurden bearbeitet.'
    )

    setMeldung('Serviceauftrag wurde gespeichert.')
    laden()
  }

  async function arbeitszeitHinzufuegen() {
    setFehler('')
    setMeldung('')

    const { error } = await supabase.from('serviceauftrag_arbeitszeiten').insert({
      serviceauftrag_id: id,
      beschreibung: azBeschreibung || null,
      stunden: Number(azStunden || 0),
      stundensatz: Number(azSatz || 0),
    })

    if (error) {
      setFehler(error.message)
      return
    }

    await timelineEintrag(
      id,
      'arbeitszeit',
      'Arbeitszeit hinzugefügt',
      `${azBeschreibung || 'Arbeitszeit'} · ${azStunden || 0} Std. · ${azSatz || 0} €/Std.`
    )

    setAzBeschreibung('')
    setAzStunden('')
    setAzSatz('')
    setMeldung('Arbeitszeit wurde hinzugefügt.')
    laden()
  }

  async function arbeitszeitLoeschen(azId: string) {
    const ok = window.confirm('Arbeitszeit wirklich löschen?')
    if (!ok) return

    const az = arbeitszeiten.find((x) => x.id === azId)

    const { error } = await supabase.from('serviceauftrag_arbeitszeiten').delete().eq('id', azId)

    if (error) {
      setFehler(error.message)
      return
    }

    await timelineEintrag(
      id,
      'arbeitszeit',
      'Arbeitszeit gelöscht',
      `${az?.beschreibung || 'Arbeitszeit'} wurde entfernt.`
    )

    setMeldung('Arbeitszeit wurde gelöscht.')
    laden()
  }

  async function materialHinzufuegen() {
    setFehler('')
    setMeldung('')

    const menge = Number(matMenge || 0)

    if (!matBezeichnung.trim()) {
      setFehler('Bitte Material auswählen oder Bezeichnung eingeben.')
      return
    }

    if (menge <= 0) {
      setFehler('Bitte gültige Menge eingeben.')
      return
    }

    if (matLagerartikelId) {
      const artikel = lagerartikel.find((a) => a.id === matLagerartikelId)

      if (!artikel) {
        setFehler('Lagerartikel nicht gefunden.')
        return
      }

      if (Number(artikel.bestand || 0) < menge) {
        setFehler('Nicht genug Bestand vorhanden.')
        return
      }

      await lagerBestandAnpassen({
        lagerartikelId: matLagerartikelId,
        menge,
        bewegung: 'entnahme',
        grund: `Material für Serviceauftrag verwendet: ${matBezeichnung}`,
        serviceauftragId: id,
      })
    }

    const { error } = await supabase.from('serviceauftrag_material').insert({
      serviceauftrag_id: id,
      lagerartikel_id: matLagerartikelId || null,
      bezeichnung: matBezeichnung || null,
      menge,
      einzelpreis: Number(matPreis || 0),
      bestand_abgezogen: Boolean(matLagerartikelId),
    })

    if (error) {
      setFehler(error.message)
      return
    }

    await timelineEintrag(
      id,
      'material',
      'Material hinzugefügt',
      `${matBezeichnung || 'Material'} · Menge ${matMenge || 0} · ${matPreis || 0} €/Stk.`
    )

    setMatSuche('')
    setMatLagerartikelId('')
    setMatBezeichnung('')
    setMatMenge('')
    setMatPreis('')
    setMeldung('Material wurde hinzugefügt und Lagerbestand wurde angepasst.')
    laden()
  }

  async function materialLoeschen(matId: string) {
    const ok = window.confirm('Material wirklich löschen? Wenn es aus dem Lager kam, wird der Bestand zurückgebucht.')
    if (!ok) return

    const mat = materialien.find((x) => x.id === matId)

    if (!mat) {
      setFehler('Material nicht gefunden.')
      return
    }

    if (mat.lagerartikel_id && mat.bestand_abgezogen) {
      await lagerBestandAnpassen({
        lagerartikelId: mat.lagerartikel_id,
        menge: Number(mat.menge || 0),
        bewegung: 'rueckbuchung',
        grund: `Material aus Serviceauftrag entfernt: ${mat.bezeichnung || 'Material'}`,
        serviceauftragId: id,
      })
    }

    const { error } = await supabase.from('serviceauftrag_material').delete().eq('id', matId)

    if (error) {
      setFehler(error.message)
      return
    }

    await timelineEintrag(
      id,
      'material',
      'Material gelöscht',
      `${mat?.bezeichnung || 'Material'} wurde entfernt.`
    )

    setMeldung('Material wurde gelöscht und ggf. zurückgebucht.')
    laden()
  }

  const arbeitskosten = useMemo(() => {
    return arbeitszeiten.reduce(
      (s, a) => s + Number(a.stunden || 0) * Number(a.stundensatz || 0),
      0
    )
  }, [arbeitszeiten])

  const materialkosten = useMemo(() => {
    return materialien.reduce(
      (s, m) => s + Number(m.menge || 0) * Number(m.einzelpreis || 0),
      0
    )
  }, [materialien])

  const gesamt = arbeitskosten + materialkosten

  async function abschliessenUndRechnungErstellen() {
    setFehler('')
    setMeldung('')

    if (!auftrag) return

    const rechnungsnummer = `RE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    const netto = gesamt
    const brutto = Number((netto * 1.19).toFixed(2))

    const { error: rError } = await supabase.from('rechnungen').insert({
      serviceauftrag_id: id,
      kunde_id: auftrag.kunde_id,
      rechnungsnummer,
      netto_summe: netto,
      brutto_summe: brutto,
      offener_betrag: brutto,
      status: 'offen',
      rechnungsdatum: new Date().toISOString().slice(0, 10),
      faellig_am: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    })

    if (rError) {
      setFehler(rError.message)
      return
    }

    const { error: sError } = await supabase
      .from('serviceauftraege')
      .update({ status: 'abgeschlossen' })
      .eq('id', id)

    if (sError) {
      setFehler(sError.message)
      return
    }

    await timelineEintrag(
      id,
      'rechnung',
      'Auftrag abgeschlossen und Rechnung erstellt',
      `Rechnung ${rechnungsnummer} wurde automatisch aus dem Serviceauftrag erstellt.`
    )

    setMeldung('Auftrag wurde abgeschlossen und Rechnung wurde erstellt.')
    laden()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Serviceauftrag bearbeiten</h1>
          <div className="topbar-subtitle">
            Live-Detailansicht mit Lagerbuchung, Arbeitszeit, Material, Timeline und Rechnungserstellung.
            {letzteAktualisierung && <> Letzte Aktualisierung: {letzteAktualisierung}</>}
          </div>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Auftragsdaten</h2>

        {auftrag && (
          <div className="list-box">
            <strong>{auftrag.art || '-'}</strong>
            <br />
            Kunde: {kunde ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim() : '-'}
            <br />
            Fahrzeug: {fahrzeug ? `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}` : '-'}
            <br />
            Mitarbeiter: {mitarbeiter ? `${mitarbeiter.vorname || ''} ${mitarbeiter.nachname || ''}`.trim() : '-'}
            <br />
            Aktueller Status: <StatusBadge status={auftrag.status || 'offen'} />
          </div>
        )}

        <div className="form-row">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            placeholder="Kilometerstand bei Annahme"
            value={kilometerstand}
            onChange={(e) => setKilometerstand(e.target.value)}
          />

          <select value={tankstand} onChange={(e) => setTankstand(e.target.value)}>
            <option value="leer">Tankfüllung: leer</option>
            <option value="1/4">Tankfüllung: 1/4</option>
            <option value="1/2">Tankfüllung: 1/2</option>
            <option value="3/4">Tankfüllung: 3/4</option>
            <option value="voll">Tankfüllung: voll</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Fehlerbeschreibung" value={fehlerbeschreibung} onChange={(e) => setFehlerbeschreibung(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Außencheck" value={aussencheck} onChange={(e) => setAussencheck(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Innencheck" value={innencheck} onChange={(e) => setInnencheck(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Schäden" value={schaeden} onChange={(e) => setSchaeden(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Zubehör" value={zubehoer} onChange={(e) => setZubehoer(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea placeholder="Interne Notiz" value={interneNotiz} onChange={(e) => setInterneNotiz(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="Kundenunterschrift" value={kundenunterschrift} onChange={(e) => setKundenunterschrift(e.target.value)} />
          <input placeholder="Mitarbeiterunterschrift" value={mitarbeiterunterschrift} onChange={(e) => setMitarbeiterunterschrift(e.target.value)} />
        </div>

        <div className="action-row">
          <button type="button" onClick={auftragSpeichern}>
            Auftrag speichern
          </button>

          <button type="button" onClick={abschliessenUndRechnungErstellen} style={{ background: '#16a34a' }}>
            Auftrag abschließen und Rechnung erstellen
          </button>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Arbeitszeit hinzufügen</h2>

        <div className="form-row">
          <input placeholder="Beschreibung" value={azBeschreibung} onChange={(e) => setAzBeschreibung(e.target.value)} />
          <input placeholder="Stunden" value={azStunden} onChange={(e) => setAzStunden(e.target.value)} />
          <input placeholder="Stundensatz" value={azSatz} onChange={(e) => setAzSatz(e.target.value)} />
        </div>

        <div className="action-row">
          <button type="button" onClick={arbeitszeitHinzufuegen}>
            Arbeitszeit hinzufügen
          </button>
        </div>

        {arbeitszeiten.map((a) => (
          <div key={a.id} className="list-box">
            <strong>{a.beschreibung || '-'}</strong>
            <br />
            {Number(a.stunden || 0).toFixed(2)} Std. × {Number(a.stundensatz || 0).toFixed(2)} €
            <br />
            Summe: {(Number(a.stunden || 0) * Number(a.stundensatz || 0)).toFixed(2)} €

            <div className="action-row">
              <button type="button" onClick={() => arbeitszeitLoeschen(a.id)} style={{ background: '#dc2626' }}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Material hinzufügen</h2>

        <div className="form-row">
          <input
            placeholder="Lagerartikel suchen"
            value={matSuche}
            onChange={(e) => {
              setMatSuche(e.target.value)
              setMatLagerartikelId('')
            }}
          />

          <input placeholder="Bezeichnung" value={matBezeichnung} onChange={(e) => setMatBezeichnung(e.target.value)} />
          <input placeholder="Menge" value={matMenge} onChange={(e) => setMatMenge(e.target.value)} />
          <input placeholder="Einzelpreis" value={matPreis} onChange={(e) => setMatPreis(e.target.value)} />
        </div>

        {matSuche && !matLagerartikelId && (
          <div className="list-box" style={{ marginTop: 12 }}>
            {lagerGefiltert.slice(0, 10).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setMatLagerartikelId(a.id)
                  setMatSuche(lagerName(a.id))
                  setMatBezeichnung(a.name || '')
                  setMatPreis(String(a.verkaufspreis || 0))
                }}
                style={{ margin: 4, background: '#374151' }}
              >
                {lagerName(a.id)} · Bestand: {Number(a.bestand || 0).toFixed(2)}
              </button>
            ))}

            {lagerGefiltert.length === 0 && <div className="muted">Kein Lagerartikel gefunden.</div>}
          </div>
        )}

        <div className="action-row">
          <button type="button" onClick={materialHinzufuegen}>
            Material hinzufügen
          </button>
        </div>

        {materialien.map((m) => (
          <div key={m.id} className="list-box">
            <strong>{m.bezeichnung || '-'}</strong>
            <br />
            Lagerartikel: {m.lagerartikel_id ? lagerName(m.lagerartikel_id) : 'Manuell'}
            <br />
            {Number(m.menge || 0).toFixed(2)} × {Number(m.einzelpreis || 0).toFixed(2)} €
            <br />
            Summe: {(Number(m.menge || 0) * Number(m.einzelpreis || 0)).toFixed(2)} €
            <br />
            Bestand gebucht: {m.bestand_abgezogen ? 'Ja' : 'Nein'}

            <div className="action-row">
              <button type="button" onClick={() => materialLoeschen(m.id)} style={{ background: '#dc2626' }}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">Arbeitskosten<strong>{arbeitskosten.toFixed(2)} €</strong></div>
        <div className="kpi-pill">Materialkosten<strong>{materialkosten.toFixed(2)} €</strong></div>
        <div className="kpi-pill">Netto Gesamt<strong>{gesamt.toFixed(2)} €</strong></div>
        <div className="kpi-pill">Brutto 19%<strong>{(gesamt * 1.19).toFixed(2)} €</strong></div>
      </div>

      <ServiceTimeline serviceauftragId={id} />

      <AttachmentManager
        bereich="serviceauftrag"
        datensatzId={id}
        titel={auftrag ? auftrag.art || auftrag.id : 'Serviceauftrag'}
      />

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}