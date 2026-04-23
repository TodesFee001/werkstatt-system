'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RoleGuard from '../components/RoleGuard'
import StatusBadge from '../components/StatusBadge'
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
}

type Mitarbeiter = {
  id: string
  vorname: string | null
  nachname: string | null
  rolle: string | null
}

type Benutzerprofil = {
  id: string
  rolle: string | null
  mitarbeiter_id: string | null
}

type Lagerartikel = {
  id: string
  artikelnummer: number | null
  name: string | null
  bestand: number | null
  verkaufspreis: number | null
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  fahrzeug_id: string | null
  mitarbeiter_id: string | null
  art: string | null
  status: string | null
  fehlerbeschreibung: string | null
  kilometerstand_bei_annahme: number | null
  interne_notiz: string | null
  freigabe_status: string | null
}

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
}

const GESPERRTE_STATUS = ['abgeschlossen', 'archiviert']
const VORGESETZTEN_ROLLEN = ['Admin', 'Serviceannahme', 'Buchhaltung']
const AUFTRAGSARTEN = [
  'Inspektion',
  'Wartung',
  'Reparatur',
  'Diagnose',
  'TÜV',
  'Reifenservice',
  'Ölwechsel',
  'Bremsenservice',
  'Unfallinstandsetzung',
  'Elektrik',
  'Klimaservice',
  'Sonstiges',
]

export default function ServiceauftraegePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Buchhaltung']}>
      <ServiceauftraegePageContent />
    </RoleGuard>
  )
}

function ServiceauftraegePageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([])
  const [materialien, setMaterialien] = useState<Material[]>([])
  const [aktuellesProfil, setAktuellesProfil] = useState<Benutzerprofil | null>(null)

  const [sucheKundeFahrzeug, setSucheKundeFahrzeug] = useState('')
  const [kundeId, setKundeId] = useState('')
  const [fahrzeugId, setFahrzeugId] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [art, setArt] = useState(AUFTRAGSARTEN[0])
  const [status, setStatus] = useState('offen')
  const [fehlerbeschreibung, setFehlerbeschreibung] = useState('')
  const [kilometerstand, setKilometerstand] = useState('')
  const [interneNotiz, setInterneNotiz] = useState('')
  const [freigabeStatus, setFreigabeStatus] = useState('offen')

  const [arbeitszeitBeschreibung, setArbeitszeitBeschreibung] = useState('')
  const [arbeitszeitStunden, setArbeitszeitStunden] = useState('')
  const [arbeitszeitStundensatz, setArbeitszeitStundensatz] = useState('')

  const [materialLagerartikelId, setMaterialLagerartikelId] = useState('')
  const [materialMenge, setMaterialMenge] = useState('')
  const [materialEinzelpreis, setMaterialEinzelpreis] = useState('')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenSucheKundeFahrzeug, setBearbeitenSucheKundeFahrzeug] = useState('')
  const [bearbeitenKundeId, setBearbeitenKundeId] = useState('')
  const [bearbeitenFahrzeugId, setBearbeitenFahrzeugId] = useState('')
  const [bearbeitenMitarbeiterId, setBearbeitenMitarbeiterId] = useState('')
  const [bearbeitenArt, setBearbeitenArt] = useState(AUFTRAGSARTEN[0])
  const [bearbeitenStatus, setBearbeitenStatus] = useState('offen')
  const [bearbeitenFehlerbeschreibung, setBearbeitenFehlerbeschreibung] = useState('')
  const [bearbeitenKilometerstand, setBearbeitenKilometerstand] = useState('')
  const [bearbeitenInterneNotiz, setBearbeitenInterneNotiz] = useState('')
  const [bearbeitenFreigabeStatus, setBearbeitenFreigabeStatus] = useState('offen')

  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    setFehler('')

    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes.data.session?.user?.id || null

    const [kRes, fRes, mRes, sRes, aRes, matRes, lRes, profilRes] = await Promise.all([
      supabase.from('kunden').select('*').order('created_at', { ascending: false }),
      supabase.from('fahrzeuge').select('*').order('kennzeichen'),
      supabase.from('mitarbeiter').select('*').order('vorname'),
      supabase.from('serviceauftraege').select('*').order('created_at', { ascending: false }),
      supabase.from('serviceauftrag_arbeitszeiten').select('*'),
      supabase.from('serviceauftrag_material').select('*'),
      supabase.from('lagerartikel').select('id, artikelnummer, name, bestand, verkaufspreis'),
      userId
        ? supabase
            .from('benutzerprofile')
            .select('id, rolle, mitarbeiter_id')
            .eq('id', userId)
            .single()
        : Promise.resolve({ data: null, error: null } as any),
    ])

    if (
      kRes.error ||
      fRes.error ||
      mRes.error ||
      sRes.error ||
      aRes.error ||
      matRes.error ||
      lRes.error ||
      profilRes.error
    ) {
      setFehler(
        kRes.error?.message ||
          fRes.error?.message ||
          mRes.error?.message ||
          sRes.error?.message ||
          aRes.error?.message ||
          matRes.error?.message ||
          lRes.error?.message ||
          profilRes.error?.message ||
          ''
      )
      return
    }

    setKunden((kRes.data || []) as Kunde[])
    setFahrzeuge((fRes.data || []) as Fahrzeug[])
    setMitarbeiter((mRes.data || []) as Mitarbeiter[])
    setServiceauftraege((sRes.data || []) as Serviceauftrag[])
    setArbeitszeiten((aRes.data || []) as Arbeitszeit[])
    setMaterialien((matRes.data || []) as Material[])
    setLagerartikel((lRes.data || []) as Lagerartikel[])
    setAktuellesProfil((profilRes.data as Benutzerprofil | null) || null)

    if (!mitarbeiterId && (profilRes.data as Benutzerprofil | null)?.mitarbeiter_id) {
      setMitarbeiterId((profilRes.data as Benutzerprofil).mitarbeiter_id || '')
    }
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  function istGesperrt(statusValue: string | null) {
    return GESPERRTE_STATUS.includes(String(statusValue || '').toLowerCase())
  }

  function istVorgesetzter() {
    return VORGESETZTEN_ROLLEN.includes(String(aktuellesProfil?.rolle || ''))
  }

  function kundeName(id: string | null) {
    const kunde = kunden.find((k) => k.id === id)
    return kunde
      ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
      : '-'
  }

  function fahrzeugName(id: string | null) {
    const f = fahrzeuge.find((x) => x.id === id)
    return f ? `${f.kennzeichen || '-'} – ${f.marke || '-'} ${f.modell || '-'}` : '-'
  }

  function mitarbeiterName(id: string | null) {
    const m = mitarbeiter.find((x) => x.id === id)
    return m ? `${m.vorname || ''} ${m.nachname || ''}`.trim() : '-'
  }

  const kundenFahrzeugTreffer = useMemo(() => {
    const q = sucheKundeFahrzeug.trim().toLowerCase()

    return fahrzeuge.filter((f) => {
      const kunde = kunden.find((k) => k.id === f.kunde_id)
      const kundeText = kunde
        ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
        : ''

      if (!q) return true

      return [kundeText, f.kennzeichen, f.marke, f.modell, f.fahrgestellnummer]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [fahrzeuge, kunden, sucheKundeFahrzeug])

  const bearbeitenKundenFahrzeugTreffer = useMemo(() => {
    const q = bearbeitenSucheKundeFahrzeug.trim().toLowerCase()

    return fahrzeuge.filter((f) => {
      const kunde = kunden.find((k) => k.id === f.kunde_id)
      const kundeText = kunde
        ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
        : ''

      if (!q) return true

      return [kundeText, f.kennzeichen, f.marke, f.modell, f.fahrgestellnummer]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [fahrzeuge, kunden, bearbeitenSucheKundeFahrzeug])

  async function erstellen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!kundeId || !fahrzeugId) {
      setFehler('Bitte Kunde/Fahrzeug direkt in der gemeinsamen Suche auswählen.')
      return
    }

    if (!mitarbeiterId) {
      setFehler('Bitte einen Mitarbeiter zuweisen.')
      return
    }

    if (!art.trim()) {
      setFehler('Bitte eine Auftragsart auswählen.')
      return
    }

    const insertRes = await supabase
      .from('serviceauftraege')
      .insert({
        kunde_id: kundeId,
        fahrzeug_id: fahrzeugId,
        mitarbeiter_id: mitarbeiterId,
        art,
        status,
        fehlerbeschreibung: fehlerbeschreibung || null,
        kilometerstand_bei_annahme: kilometerstand ? Number(kilometerstand) : null,
        interne_notiz: interneNotiz || null,
        freigabe_status: freigabeStatus || 'offen',
      })
      .select()
      .single()

    if (insertRes.error || !insertRes.data) {
      setFehler(insertRes.error?.message || 'Serviceauftrag konnte nicht erstellt werden.')
      return
    }

    const neuerAuftragId = insertRes.data.id

    if (
      arbeitszeitBeschreibung.trim() ||
      arbeitszeitStunden.trim() ||
      arbeitszeitStundensatz.trim()
    ) {
      const arbeitszeitError = await supabase.from('serviceauftrag_arbeitszeiten').insert({
        serviceauftrag_id: neuerAuftragId,
        beschreibung: arbeitszeitBeschreibung || null,
        stunden: arbeitszeitStunden ? Number(arbeitszeitStunden) : 0,
        stundensatz: arbeitszeitStundensatz ? Number(arbeitszeitStundensatz) : 0,
      })

      if (arbeitszeitError.error) {
        setFehler(arbeitszeitError.error.message)
        return
      }
    }

    if (materialLagerartikelId && materialMenge) {
      const lagerArtikel = lagerartikel.find((l) => l.id === materialLagerartikelId)
      const mengeNum = Number(materialMenge)
      const einzelpreisNum = materialEinzelpreis
        ? Number(materialEinzelpreis)
        : Number(lagerArtikel?.verkaufspreis || 0)

      const materialError = await supabase.from('serviceauftrag_material').insert({
        serviceauftrag_id: neuerAuftragId,
        lagerartikel_id: materialLagerartikelId,
        bezeichnung: lagerArtikel?.name || null,
        menge: mengeNum,
        einzelpreis: einzelpreisNum,
      })

      if (materialError.error) {
        setFehler(materialError.error.message)
        return
      }

      const artikelBestand = Number(lagerArtikel?.bestand || 0)
      await supabase
        .from('lagerartikel')
        .update({ bestand: artikelBestand - mengeNum })
        .eq('id', materialLagerartikelId)

      await supabase.from('lagerbewegungen').insert({
        lagerartikel_id: materialLagerartikelId,
        bewegungsart: 'entnahme',
        menge: mengeNum,
        notiz: 'Automatisch aus Serviceauftrag entnommen',
        referenz_typ: 'serviceauftrag',
        referenz_id: neuerAuftragId,
      })
    }

    setSucheKundeFahrzeug('')
    setKundeId('')
    setFahrzeugId('')
    setArt(AUFTRAGSARTEN[0])
    setStatus('offen')
    setFehlerbeschreibung('')
    setKilometerstand('')
    setInterneNotiz('')
    setFreigabeStatus('offen')
    setArbeitszeitBeschreibung('')
    setArbeitszeitStunden('')
    setArbeitszeitStundensatz('')
    setMaterialLagerartikelId('')
    setMaterialMenge('')
    setMaterialEinzelpreis('')
    if (aktuellesProfil?.mitarbeiter_id) {
      setMitarbeiterId(aktuellesProfil.mitarbeiter_id)
    } else {
      setMitarbeiterId('')
    }
    setMeldung('Serviceauftrag wurde erstellt.')
    ladeAlles()
  }

  function bearbeitenStarten(s: Serviceauftrag) {
    if (istGesperrt(s.status)) return

    setBearbeitenId(s.id)
    setBearbeitenKundeId(s.kunde_id || '')
    setBearbeitenFahrzeugId(s.fahrzeug_id || '')
    setBearbeitenMitarbeiterId(s.mitarbeiter_id || '')
    setBearbeitenArt(s.art || AUFTRAGSARTEN[0])
    setBearbeitenStatus(s.status || 'offen')
    setBearbeitenFehlerbeschreibung(s.fehlerbeschreibung || '')
    setBearbeitenKilometerstand(
      s.kilometerstand_bei_annahme !== null && s.kilometerstand_bei_annahme !== undefined
        ? String(s.kilometerstand_bei_annahme)
        : ''
    )
    setBearbeitenInterneNotiz(s.interne_notiz || '')
    setBearbeitenFreigabeStatus(s.freigabe_status || 'offen')
    setBearbeitenSucheKundeFahrzeug('')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenKundeId('')
    setBearbeitenFahrzeugId('')
    setBearbeitenMitarbeiterId('')
    setBearbeitenArt(AUFTRAGSARTEN[0])
    setBearbeitenStatus('offen')
    setBearbeitenFehlerbeschreibung('')
    setBearbeitenKilometerstand('')
    setBearbeitenInterneNotiz('')
    setBearbeitenFreigabeStatus('offen')
    setBearbeitenSucheKundeFahrzeug('')
  }

  async function bearbeitenSpeichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    if (!bearbeitenId) return

    const alterAuftrag = serviceauftraege.find((s) => s.id === bearbeitenId) || null

    if (!bearbeitenKundeId || !bearbeitenFahrzeugId) {
      setFehler('Bitte Kunde/Fahrzeug direkt in der gemeinsamen Suche auswählen.')
      return
    }

    if (!bearbeitenMitarbeiterId) {
      setFehler('Bitte einen Mitarbeiter zuweisen.')
      return
    }

    if (
      alterAuftrag &&
      alterAuftrag.mitarbeiter_id !== bearbeitenMitarbeiterId &&
      !istVorgesetzter()
    ) {
      setFehler('Die Änderung der Mitarbeiter-Zuweisung ist nur durch Vorgesetzte erlaubt.')
      return
    }

    if (!bearbeitenArt.trim()) {
      setFehler('Bitte eine Auftragsart auswählen.')
      return
    }

    const { error } = await supabase
      .from('serviceauftraege')
      .update({
        kunde_id: bearbeitenKundeId,
        fahrzeug_id: bearbeitenFahrzeugId,
        mitarbeiter_id: bearbeitenMitarbeiterId,
        art: bearbeitenArt,
        status: bearbeitenStatus,
        fehlerbeschreibung: bearbeitenFehlerbeschreibung || null,
        kilometerstand_bei_annahme: bearbeitenKilometerstand
          ? Number(bearbeitenKilometerstand)
          : null,
        interne_notiz: bearbeitenInterneNotiz || null,
        freigabe_status: bearbeitenFreigabeStatus || 'offen',
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    setMeldung('Serviceauftrag wurde gespeichert.')
    ladeAlles()
  }

  async function loeschen(id: string, statusValue: string | null) {
    setFehler('')
    setMeldung('')

    if (istGesperrt(statusValue)) {
      setFehler('Abgeschlossene oder archivierte Serviceaufträge dürfen nicht gelöscht werden.')
      return
    }

    const ok = window.confirm('Serviceauftrag wirklich löschen?')
    if (!ok) return

    const arbeitszeitenZuAuftrag = arbeitszeiten.filter((a) => a.serviceauftrag_id === id)
    const materialienZuAuftrag = materialien.filter((m) => m.serviceauftrag_id === id)

    for (const mat of materialienZuAuftrag) {
      if (mat.lagerartikel_id && mat.menge) {
        const lagerArtikel = lagerartikel.find((l) => l.id === mat.lagerartikel_id)
        const neuerBestand = Number(lagerArtikel?.bestand || 0) + Number(mat.menge || 0)

        await supabase
          .from('lagerartikel')
          .update({ bestand: neuerBestand })
          .eq('id', mat.lagerartikel_id)

        await supabase.from('lagerbewegungen').insert({
          lagerartikel_id: mat.lagerartikel_id,
          bewegungsart: 'rueckbuchung',
          menge: Number(mat.menge || 0),
          notiz: 'Rückbuchung nach Löschen des Serviceauftrags',
          referenz_typ: 'serviceauftrag',
          referenz_id: id,
        })
      }
    }

    if (arbeitszeitenZuAuftrag.length > 0) {
      await supabase.from('serviceauftrag_arbeitszeiten').delete().eq('serviceauftrag_id', id)
    }

    if (materialienZuAuftrag.length > 0) {
      await supabase.from('serviceauftrag_material').delete().eq('serviceauftrag_id', id)
    }

    const { error } = await supabase.from('serviceauftraege').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Serviceauftrag wurde gelöscht.')
    ladeAlles()
  }

  function auftragArbeitskosten(auftragId: string) {
    return arbeitszeiten
      .filter((a) => a.serviceauftrag_id === auftragId)
      .reduce((sum, a) => sum + Number(a.stunden || 0) * Number(a.stundensatz || 0), 0)
  }

  function auftragMaterialkosten(auftragId: string) {
    return materialien
      .filter((m) => m.serviceauftrag_id === auftragId)
      .reduce((sum, m) => sum + Number(m.menge || 0) * Number(m.einzelpreis || 0), 0)
  }

  function auftragArbeitszeiten(auftragId: string) {
    return arbeitszeiten.filter((a) => a.serviceauftrag_id === auftragId)
  }

  function auftragMaterialien(auftragId: string) {
    return materialien.filter((m) => m.serviceauftrag_id === auftragId)
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Serviceaufträge</h1>
          <div className="topbar-subtitle">
            Feste Auftragsarten passend zur Datenbank und Mitarbeiter-Zuweisung mit Rollenlogik.
          </div>
        </div>
      </div>

      <form onSubmit={erstellen} className="page-card">
        <h2 style={{ marginTop: 0 }}>Neuen Serviceauftrag anlegen</h2>

        <div className="form-row">
          <input
            list="kunde-fahrzeug-liste"
            placeholder="Kunde oder Fahrzeug suchen und direkt auswählen"
            value={sucheKundeFahrzeug}
            onChange={(e) => {
              const value = e.target.value
              setSucheKundeFahrzeug(value)
              const match = kundenFahrzeugTreffer.find((f) => {
                const label = `${kundeName(f.kunde_id)} – ${f.kennzeichen || '-'} – ${f.marke || '-'} ${f.modell || '-'}`
                return label === value
              })
              if (match) {
                setFahrzeugId(match.id)
                setKundeId(match.kunde_id || '')
              }
            }}
          />
          <datalist id="kunde-fahrzeug-liste">
            {kundenFahrzeugTreffer.map((f) => (
              <option
                key={f.id}
                value={`${kundeName(f.kunde_id)} – ${f.kennzeichen || '-'} – ${f.marke || '-'} ${f.modell || '-'}`}
              />
            ))}
          </datalist>

          <select
            value={mitarbeiterId}
            onChange={(e) => setMitarbeiterId(e.target.value)}
          >
            <option value="">Mitarbeiter zuweisen</option>
            {mitarbeiter.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <select value={art} onChange={(e) => setArt(e.target.value)}>
            {AUFTRAGSARTEN.map((eintrag) => (
              <option key={eintrag} value={eintrag}>
                {eintrag}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="offen">offen</option>
            <option value="in_arbeit">in_arbeit</option>
            <option value="wartet">wartet</option>
            <option value="abgeschlossen">abgeschlossen</option>
            <option value="archiviert">archiviert</option>
          </select>

          <select
            value={freigabeStatus}
            onChange={(e) => setFreigabeStatus(e.target.value)}
          >
            <option value="offen">Freigabe offen</option>
            <option value="freigegeben">freigegeben</option>
            <option value="abgelehnt">abgelehnt</option>
          </select>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input
            placeholder="Kilometerstand"
            value={kilometerstand}
            onChange={(e) => setKilometerstand(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Fehlerbeschreibung"
            value={fehlerbeschreibung}
            onChange={(e) => setFehlerbeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 100 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Interne Notiz"
            value={interneNotiz}
            onChange={(e) => setInterneNotiz(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
          />
        </div>

        <div className="list-box" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Arbeitszeit für diesen Auftrag</h3>
          <div className="form-row">
            <input
              placeholder="Beschreibung"
              value={arbeitszeitBeschreibung}
              onChange={(e) => setArbeitszeitBeschreibung(e.target.value)}
            />
            <input
              placeholder="Stunden"
              value={arbeitszeitStunden}
              onChange={(e) => setArbeitszeitStunden(e.target.value)}
            />
            <input
              placeholder="Stundensatz"
              value={arbeitszeitStundensatz}
              onChange={(e) => setArbeitszeitStundensatz(e.target.value)}
            />
          </div>
        </div>

        <div className="list-box" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Material für diesen Auftrag</h3>
          <div className="form-row">
            <select
              value={materialLagerartikelId}
              onChange={(e) => {
                setMaterialLagerartikelId(e.target.value)
                const lagerArtikel = lagerartikel.find((l) => l.id === e.target.value)
                setMaterialEinzelpreis(
                  lagerArtikel?.verkaufspreis !== null && lagerArtikel?.verkaufspreis !== undefined
                    ? String(lagerArtikel.verkaufspreis)
                    : ''
                )
              }}
            >
              <option value="">Material auswählen</option>
              {lagerartikel
                .sort((a, b) => Number(a.artikelnummer || 0) - Number(b.artikelnummer || 0))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.artikelnummer || '-'} – {l.name || '-'} – Bestand {Number(l.bestand || 0).toFixed(2)}
                  </option>
                ))}
            </select>
            <input
              placeholder="Menge"
              value={materialMenge}
              onChange={(e) => setMaterialMenge(e.target.value)}
            />
            <input
              placeholder="Einzelpreis"
              value={materialEinzelpreis}
              onChange={(e) => setMaterialEinzelpreis(e.target.value)}
            />
          </div>
        </div>

        <div className="action-row">
          <button type="submit">Serviceauftrag erstellen</button>
        </div>
      </form>

      {bearbeitenId && (
        <form onSubmit={bearbeitenSpeichern} className="page-card">
          <h2 style={{ marginTop: 0 }}>Serviceauftrag bearbeiten</h2>

          <div className="form-row">
            <input
              list="bearbeiten-kunde-fahrzeug-liste"
              placeholder="Kunde oder Fahrzeug suchen und direkt auswählen"
              value={bearbeitenSucheKundeFahrzeug}
              onChange={(e) => {
                const value = e.target.value
                setBearbeitenSucheKundeFahrzeug(value)
                const match = bearbeitenKundenFahrzeugTreffer.find((f) => {
                  const label = `${kundeName(f.kunde_id)} – ${f.kennzeichen || '-'} – ${f.marke || '-'} ${f.modell || '-'}`
                  return label === value
                })
                if (match) {
                  setBearbeitenFahrzeugId(match.id)
                  setBearbeitenKundeId(match.kunde_id || '')
                }
              }}
            />
            <datalist id="bearbeiten-kunde-fahrzeug-liste">
              {bearbeitenKundenFahrzeugTreffer.map((f) => (
                <option
                  key={f.id}
                  value={`${kundeName(f.kunde_id)} – ${f.kennzeichen || '-'} – ${f.marke || '-'} ${f.modell || '-'}`}
                />
              ))}
            </datalist>

            <select
              value={bearbeitenMitarbeiterId}
              onChange={(e) => setBearbeitenMitarbeiterId(e.target.value)}
              disabled={
                !istVorgesetzter() &&
                !!serviceauftraege.find((s) => s.id === bearbeitenId)?.mitarbeiter_id &&
                serviceauftraege.find((s) => s.id === bearbeitenId)?.mitarbeiter_id !== aktuellesProfil?.mitarbeiter_id
              }
            >
              <option value="">Mitarbeiter zuweisen</option>
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {`${m.vorname || ''} ${m.nachname || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <select value={bearbeitenArt} onChange={(e) => setBearbeitenArt(e.target.value)}>
              {AUFTRAGSARTEN.map((eintrag) => (
                <option key={eintrag} value={eintrag}>
                  {eintrag}
                </option>
              ))}
            </select>

            <select
              value={bearbeitenStatus}
              onChange={(e) => setBearbeitenStatus(e.target.value)}
            >
              <option value="offen">offen</option>
              <option value="in_arbeit">in_arbeit</option>
              <option value="wartet">wartet</option>
              <option value="abgeschlossen">abgeschlossen</option>
              <option value="archiviert">archiviert</option>
            </select>

            <select
              value={bearbeitenFreigabeStatus}
              onChange={(e) => setBearbeitenFreigabeStatus(e.target.value)}
            >
              <option value="offen">Freigabe offen</option>
              <option value="freigegeben">freigegeben</option>
              <option value="abgelehnt">abgelehnt</option>
            </select>
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <input
              placeholder="Kilometerstand"
              value={bearbeitenKilometerstand}
              onChange={(e) => setBearbeitenKilometerstand(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Fehlerbeschreibung"
              value={bearbeitenFehlerbeschreibung}
              onChange={(e) => setBearbeitenFehlerbeschreibung(e.target.value)}
              style={{ width: '100%', minHeight: 100 }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Interne Notiz"
              value={bearbeitenInterneNotiz}
              onChange={(e) => setBearbeitenInterneNotiz(e.target.value)}
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
        <h2 style={{ marginTop: 0 }}>Bestehende Serviceaufträge</h2>

        {serviceauftraege.map((s) => {
          const arbeitskosten = auftragArbeitskosten(s.id)
          const materialkosten = auftragMaterialkosten(s.id)
          const gesamt = arbeitskosten + materialkosten

          return (
            <div key={s.id} className="list-box">
              <strong>{s.art || '-'}</strong>
              <br />
              Kunde: {kundeName(s.kunde_id)}
              <br />
              Fahrzeug: {fahrzeugName(s.fahrzeug_id)}
              <br />
              Mitarbeiter: {mitarbeiterName(s.mitarbeiter_id)}
              <br />
              Status: <StatusBadge status={s.status} />
              <br />
              Freigabe: <StatusBadge status={s.freigabe_status || 'offen'} />
              <br />
              Fehlerbeschreibung: {s.fehlerbeschreibung || '-'}
              <br />
              Arbeitskosten: {arbeitskosten.toFixed(2)} €
              <br />
              Materialkosten: {materialkosten.toFixed(2)} €
              <br />
              Gesamt: {gesamt.toFixed(2)} €

              <div style={{ marginTop: 12 }}>
                <strong>Arbeitszeiten</strong>
                {auftragArbeitszeiten(s.id).length === 0 && <div>-</div>}
                {auftragArbeitszeiten(s.id).map((a) => (
                  <div key={a.id}>
                    {a.beschreibung || '-'} – {Number(a.stunden || 0).toFixed(2)} h ×{' '}
                    {Number(a.stundensatz || 0).toFixed(2)} €
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Materialien</strong>
                {auftragMaterialien(s.id).length === 0 && <div>-</div>}
                {auftragMaterialien(s.id).map((m) => (
                  <div key={m.id}>
                    {m.bezeichnung || '-'} – {Number(m.menge || 0).toFixed(2)} ×{' '}
                    {Number(m.einzelpreis || 0).toFixed(2)} €
                  </div>
                ))}
              </div>

              <div className="action-row" style={{ marginTop: 10 }}>
                <Link
                  href={`/serviceauftraege/${s.id}`}
                  style={{
                    display: 'inline-block',
                    padding: '10px 16px',
                    background: '#2563eb',
                    color: 'white',
                    borderRadius: 12,
                    textDecoration: 'none',
                  }}
                >
                  Öffnen
                </Link>

                {!istGesperrt(s.status) && (
                  <>
                    <button type="button" onClick={() => bearbeitenStarten(s)}>
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => loeschen(s.id, s.status)}
                      style={{ background: '#dc2626' }}
                    >
                      Löschen
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {serviceauftraege.length === 0 && (
          <div className="muted">Noch keine Serviceaufträge vorhanden.</div>
        )}
      </div>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}