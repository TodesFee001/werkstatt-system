'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Fahrzeug = {
  id: string
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  kunde_id: string | null
}

type Mitarbeiter = {
  id: string
  vorname: string
  nachname: string
}

type Serviceauftrag = {
  id: string
  kunde_id: string | null
  fahrzeug_id: string | null
  status: string | null
  art: string | null
  fehlerbeschreibung: string | null
  kilometerstand_bei_annahme: number | null
  interne_notiz: string | null
  freigabe_status: string | null
  fertigstellungsdatum: string | null
}

type Lagerartikel = {
  id: string
  name: string
  bestand: number | null
  verkaufspreis: number | null
  einheit: string | null
}

type ServiceauftragMaterial = {
  id: string
  serviceauftrag_id: string
  lagerartikel_id: string
  menge: number
  einzelpreis: number | null
  gesamtpreis: number | null
  notiz: string | null
}

type ServiceauftragArbeitszeit = {
  id: string
  serviceauftrag_id: string
  mitarbeiter_id: string | null
  datum: string
  stunden: number
  stundensatz: number | null
  gesamtpreis: number | null
  notiz: string | null
}

type Anhang = {
  id: string
  bezug_typ: string
  bezug_id: string
  titel: string | null
  dateiname: string
  dateipfad: string
  dateityp: string | null
}

function ServiceauftraegePageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [materialPositionen, setMaterialPositionen] = useState<ServiceauftragMaterial[]>([])
  const [arbeitszeiten, setArbeitszeiten] = useState<ServiceauftragArbeitszeit[]>([])
  const [anhaenge, setAnhaenge] = useState<Anhang[]>([])

  const [auftragKundeId, setAuftragKundeId] = useState('')
  const [auftragFahrzeugId, setAuftragFahrzeugId] = useState('')
  const [auftragArt, setAuftragArt] = useState('reparatur')
  const [auftragStatus, setAuftragStatus] = useState('offen')
  const [fehlerbeschreibung, setFehlerbeschreibung] = useState('')
  const [kilometerstand, setKilometerstand] = useState('')
  const [interneNotiz, setInterneNotiz] = useState('')
  const [freigabeStatus, setFreigabeStatus] = useState('offen')

  const [suche, setSuche] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenKundeId, setBearbeitenKundeId] = useState('')
  const [bearbeitenFahrzeugId, setBearbeitenFahrzeugId] = useState('')
  const [bearbeitenArt, setBearbeitenArt] = useState('reparatur')
  const [bearbeitenStatus, setBearbeitenStatus] = useState('offen')
  const [bearbeitenFehlerbeschreibung, setBearbeitenFehlerbeschreibung] = useState('')
  const [bearbeitenKilometerstand, setBearbeitenKilometerstand] = useState('')
  const [bearbeitenInterneNotiz, setBearbeitenInterneNotiz] = useState('')
  const [bearbeitenFreigabeStatus, setBearbeitenFreigabeStatus] = useState('offen')
  const [bearbeitenFertigstellungsdatum, setBearbeitenFertigstellungsdatum] = useState('')

  const [materialAuftragId, setMaterialAuftragId] = useState('')
  const [materialArtikelId, setMaterialArtikelId] = useState('')
  const [materialMenge, setMaterialMenge] = useState('')
  const [materialNotiz, setMaterialNotiz] = useState('')

  const [zeitAuftragId, setZeitAuftragId] = useState('')
  const [zeitMitarbeiterId, setZeitMitarbeiterId] = useState('')
  const [zeitDatum, setZeitDatum] = useState(new Date().toISOString().slice(0, 10))
  const [zeitStunden, setZeitStunden] = useState('')
  const [zeitStundensatz, setZeitStundensatz] = useState('')
  const [zeitNotiz, setZeitNotiz] = useState('')

  const [anhangAuftragId, setAnhangAuftragId] = useState('')
  const [anhangTitel, setAnhangTitel] = useState('')
  const [anhangDatei, setAnhangDatei] = useState<File | null>(null)

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [
      kundenRes,
      fahrzeugeRes,
      mitarbeiterRes,
      serviceauftraegeRes,
      lagerartikelRes,
      materialRes,
      arbeitszeitRes,
      anhaengeRes,
    ] = await Promise.all([
      supabase.from('kunden').select('*'),
      supabase.from('fahrzeuge').select('*'),
      supabase.from('mitarbeiter').select('id, vorname, nachname'),
      supabase.from('serviceauftraege').select('*').order('created_at', { ascending: false }),
      supabase.from('lagerartikel').select('*').order('name', { ascending: true }),
      supabase.from('serviceauftrag_material').select('*').order('created_at', { ascending: false }),
      supabase.from('serviceauftrag_arbeitszeiten').select('*').order('created_at', { ascending: false }),
      supabase.from('anhaenge').select('*').eq('bezug_typ', 'serviceauftrag').order('created_at', { ascending: false }),
    ])

    const error =
      kundenRes.error ||
      fahrzeugeRes.error ||
      mitarbeiterRes.error ||
      serviceauftraegeRes.error ||
      lagerartikelRes.error ||
      materialRes.error ||
      arbeitszeitRes.error ||
      anhaengeRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunden(kundenRes.data || [])
    setFahrzeuge(fahrzeugeRes.data || [])
    setMitarbeiter(mitarbeiterRes.data || [])
    setServiceauftraege(serviceauftraegeRes.data || [])
    setLagerartikel(lagerartikelRes.data || [])
    setMaterialPositionen(materialRes.data || [])
    setArbeitszeiten(arbeitszeitRes.data || [])
    setAnhaenge(anhaengeRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function serviceauftragAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!auftragKundeId) return setFehler('Bitte einen Kunden auswählen.')
    if (!auftragFahrzeugId) return setFehler('Bitte ein Fahrzeug auswählen.')

    const { error } = await supabase.from('serviceauftraege').insert({
      kunde_id: auftragKundeId,
      fahrzeug_id: auftragFahrzeugId,
      status: auftragStatus,
      art: auftragArt,
      fehlerbeschreibung: fehlerbeschreibung || null,
      kilometerstand_bei_annahme: kilometerstand ? Number(kilometerstand) : null,
      annahme_datum: new Date().toISOString().slice(0, 10),
      interne_notiz: interneNotiz || null,
      freigabe_status: freigabeStatus,
    })

    if (error) return setFehler(error.message)

    setAuftragKundeId('')
    setAuftragFahrzeugId('')
    setAuftragArt('reparatur')
    setAuftragStatus('offen')
    setFehlerbeschreibung('')
    setKilometerstand('')
    setInterneNotiz('')
    setFreigabeStatus('offen')
    ladeAlles()
  }

  function bearbeitenStarten(auftrag: Serviceauftrag) {
    setBearbeitenId(auftrag.id)
    setBearbeitenKundeId(auftrag.kunde_id || '')
    setBearbeitenFahrzeugId(auftrag.fahrzeug_id || '')
    setBearbeitenArt(auftrag.art || 'reparatur')
    setBearbeitenStatus(auftrag.status || 'offen')
    setBearbeitenFehlerbeschreibung(auftrag.fehlerbeschreibung || '')
    setBearbeitenKilometerstand(String(auftrag.kilometerstand_bei_annahme ?? ''))
    setBearbeitenInterneNotiz(auftrag.interne_notiz || '')
    setBearbeitenFreigabeStatus(auftrag.freigabe_status || 'offen')
    setBearbeitenFertigstellungsdatum(auftrag.fertigstellungsdatum || '')
  }

  function bearbeitenAbbrechen() {
    setBearbeitenId(null)
    setBearbeitenKundeId('')
    setBearbeitenFahrzeugId('')
    setBearbeitenArt('reparatur')
    setBearbeitenStatus('offen')
    setBearbeitenFehlerbeschreibung('')
    setBearbeitenKilometerstand('')
    setBearbeitenInterneNotiz('')
    setBearbeitenFreigabeStatus('offen')
    setBearbeitenFertigstellungsdatum('')
  }

  async function serviceauftragSpeichern(e: React.FormEvent) {
    e.preventDefault()
    if (!bearbeitenId) return

    if (!bearbeitenKundeId) return setFehler('Bitte einen Kunden auswählen.')
    if (!bearbeitenFahrzeugId) return setFehler('Bitte ein Fahrzeug auswählen.')

    const { error } = await supabase
      .from('serviceauftraege')
      .update({
        kunde_id: bearbeitenKundeId,
        fahrzeug_id: bearbeitenFahrzeugId,
        status: bearbeitenStatus,
        art: bearbeitenArt,
        fehlerbeschreibung: bearbeitenFehlerbeschreibung || null,
        kilometerstand_bei_annahme: bearbeitenKilometerstand ? Number(bearbeitenKilometerstand) : null,
        interne_notiz: bearbeitenInterneNotiz || null,
        freigabe_status: bearbeitenFreigabeStatus,
        fertigstellungsdatum: bearbeitenFertigstellungsdatum || null,
      })
      .eq('id', bearbeitenId)

    if (error) {
      setFehler(error.message)
      return
    }

    bearbeitenAbbrechen()
    ladeAlles()
  }

  async function serviceauftragLoeschen(id: string) {
    const bestaetigt = window.confirm('Serviceauftrag wirklich löschen?')
    if (!bestaetigt) return

    const materialZuAuftrag = materialPositionen.filter((m) => m.serviceauftrag_id === id)

    for (const position of materialZuAuftrag) {
      const artikel = lagerartikel.find((a) => a.id === position.lagerartikel_id)
      if (artikel) {
        const neuerBestand = Number(artikel.bestand || 0) + Number(position.menge || 0)

        await supabase
          .from('lagerartikel')
          .update({ bestand: neuerBestand })
          .eq('id', position.lagerartikel_id)

        await supabase
          .from('lagerbewegungen')
          .insert({
            lagerartikel_id: position.lagerartikel_id,
            bewegungstyp: 'zugang',
            menge: position.menge,
            notiz: `Rückbuchung durch Löschen von Serviceauftrag ${id}`,
          })
      }
    }

    await supabase.from('serviceauftrag_material').delete().eq('serviceauftrag_id', id)
    await supabase.from('serviceauftrag_arbeitszeiten').delete().eq('serviceauftrag_id', id)
    await supabase.from('anhaenge').delete().eq('bezug_typ', 'serviceauftrag').eq('bezug_id', id)

    const { error } = await supabase.from('serviceauftraege').delete().eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    if (bearbeitenId === id) {
      bearbeitenAbbrechen()
    }

    ladeAlles()
  }

  async function materialBuchen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!materialAuftragId) return setFehler('Bitte einen Serviceauftrag auswählen.')
    if (!materialArtikelId) return setFehler('Bitte einen Lagerartikel auswählen.')
    if (!materialMenge) return setFehler('Bitte eine Menge eingeben.')

    const menge = Number(materialMenge)
    const artikel = lagerartikel.find((a) => a.id === materialArtikelId)

    if (!artikel) return setFehler('Artikel nicht gefunden.')
    if (menge <= 0) return setFehler('Menge muss größer als 0 sein.')

    const aktuellerBestand = Number(artikel.bestand || 0)
    if (aktuellerBestand < menge) return setFehler('Nicht genügend Bestand im Lager.')

    const einzelpreis = Number(artikel.verkaufspreis || 0)
    const gesamtpreis = menge * einzelpreis

    const { error: materialError } = await supabase
      .from('serviceauftrag_material')
      .insert({
        serviceauftrag_id: materialAuftragId,
        lagerartikel_id: materialArtikelId,
        menge,
        einzelpreis,
        gesamtpreis,
        notiz: materialNotiz || null,
      })

    if (materialError) return setFehler(materialError.message)

    const { error: lagerError } = await supabase
      .from('lagerartikel')
      .update({
        bestand: aktuellerBestand - menge,
      })
      .eq('id', materialArtikelId)

    if (lagerError) return setFehler(lagerError.message)

    const { error: bewegungError } = await supabase
      .from('lagerbewegungen')
      .insert({
        lagerartikel_id: materialArtikelId,
        bewegungstyp: 'abgang',
        menge,
        notiz: `Verbrauch für Serviceauftrag ${materialAuftragId}${materialNotiz ? ' - ' + materialNotiz : ''}`,
      })

    if (bewegungError) return setFehler(bewegungError.message)

    setMaterialAuftragId('')
    setMaterialArtikelId('')
    setMaterialMenge('')
    setMaterialNotiz('')
    ladeAlles()
  }

  async function materialLoeschen(position: ServiceauftragMaterial) {
    const bestaetigt = window.confirm('Materialposition wirklich löschen?')
    if (!bestaetigt) return

    const artikel = lagerartikel.find((a) => a.id === position.lagerartikel_id)

    if (artikel) {
      const neuerBestand = Number(artikel.bestand || 0) + Number(position.menge || 0)

      await supabase
        .from('lagerartikel')
        .update({ bestand: neuerBestand })
        .eq('id', position.lagerartikel_id)

      await supabase
        .from('lagerbewegungen')
        .insert({
          lagerartikel_id: position.lagerartikel_id,
          bewegungstyp: 'zugang',
          menge: position.menge,
          notiz: `Rückbuchung Materialposition ${position.id}`,
        })
    }

    const { error } = await supabase
      .from('serviceauftrag_material')
      .delete()
      .eq('id', position.id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  async function arbeitszeitBuchen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!zeitAuftragId) return setFehler('Bitte einen Serviceauftrag auswählen.')
    if (!zeitStunden) return setFehler('Bitte Stunden eingeben.')

    const stunden = Number(zeitStunden)
    const stundensatz = Number(zeitStundensatz || 0)

    if (stunden <= 0) return setFehler('Stunden müssen größer als 0 sein.')

    const { error } = await supabase
      .from('serviceauftrag_arbeitszeiten')
      .insert({
        serviceauftrag_id: zeitAuftragId,
        mitarbeiter_id: zeitMitarbeiterId || null,
        datum: zeitDatum,
        stunden,
        stundensatz,
        gesamtpreis: stunden * stundensatz,
        notiz: zeitNotiz || null,
      })

    if (error) return setFehler(error.message)

    setZeitAuftragId('')
    setZeitMitarbeiterId('')
    setZeitDatum(new Date().toISOString().slice(0, 10))
    setZeitStunden('')
    setZeitStundensatz('')
    setZeitNotiz('')
    ladeAlles()
  }

  async function arbeitszeitLoeschen(id: string) {
    const bestaetigt = window.confirm('Arbeitszeit wirklich löschen?')
    if (!bestaetigt) return

    const { error } = await supabase
      .from('serviceauftrag_arbeitszeiten')
      .delete()
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  async function anhangHochladen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!anhangAuftragId) {
      setFehler('Bitte einen Serviceauftrag auswählen.')
      return
    }

    if (!anhangDatei) {
      setFehler('Bitte eine Datei auswählen.')
      return
    }

    const dateiname = `${Date.now()}-${anhangDatei.name}`

    const { error: uploadError } = await supabase.storage
      .from('anhaenge')
      .upload(dateiname, anhangDatei)

    if (uploadError) {
      setFehler(uploadError.message)
      return
    }

    const { error } = await supabase.from('anhaenge').insert({
      bezug_typ: 'serviceauftrag',
      bezug_id: anhangAuftragId,
      titel: anhangTitel || null,
      dateiname: anhangDatei.name,
      dateipfad: dateiname,
      dateityp: anhangDatei.type || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setAnhangAuftragId('')
    setAnhangTitel('')
    setAnhangDatei(null)
    ladeAlles()
  }

  function anhaengeVonAuftrag(auftragId: string) {
    return anhaenge.filter((a) => a.bezug_id === auftragId)
  }

  function dateiUrl(dateipfad: string) {
    return supabase.storage.from('anhaenge').getPublicUrl(dateipfad).data.publicUrl
  }

  const fahrzeugeZumGewaehltenKunden = fahrzeuge.filter((f) => f.kunde_id === auftragKundeId)
  const fahrzeugeZumBearbeitenKunden = fahrzeuge.filter((f) => f.kunde_id === bearbeitenKundeId)

  function kundeName(id: string | null) {
    if (!id) return 'Unbekannter Kunde'
    const kunde = kunden.find((k) => k.id === id)
    if (!kunde) return 'Unbekannter Kunde'
    return kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
  }

  function fahrzeugName(id: string | null) {
    if (!id) return 'Unbekanntes Fahrzeug'
    const fahrzeug = fahrzeuge.find((f) => f.id === id)
    if (!fahrzeug) return 'Unbekanntes Fahrzeug'
    return `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}`
  }

  function mitarbeiterName(id: string | null) {
    if (!id) return '-'
    const person = mitarbeiter.find((m) => m.id === id)
    return person ? `${person.vorname} ${person.nachname}` : '-'
  }

  function artikelName(id: string) {
    return lagerartikel.find((a) => a.id === id)?.name || 'Unbekannter Artikel'
  }

  function materialVonAuftrag(auftragId: string) {
    return materialPositionen.filter((m) => m.serviceauftrag_id === auftragId)
  }

  function arbeitszeitenVonAuftrag(auftragId: string) {
    return arbeitszeiten.filter((z) => z.serviceauftrag_id === auftragId)
  }

  function materialSummeVonAuftrag(auftragId: string) {
    return materialVonAuftrag(auftragId).reduce((sum, p) => sum + Number(p.gesamtpreis || 0), 0)
  }

  function arbeitszeitSummeVonAuftrag(auftragId: string) {
    return arbeitszeitenVonAuftrag(auftragId).reduce((sum, z) => sum + Number(z.gesamtpreis || 0), 0)
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return serviceauftraege.filter((auftrag) => {
      const statusOk = statusFilter === 'alle' || (auftrag.status || '') === statusFilter
      if (!statusOk) return false

      if (!q) return true

      return [
        auftrag.id,
        auftrag.art,
        auftrag.status,
        auftrag.fehlerbeschreibung,
        auftrag.freigabe_status,
        kundeName(auftrag.kunde_id),
        fahrzeugName(auftrag.fahrzeug_id),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [serviceauftraege, suche, statusFilter, kunden, fahrzeuge])

  return (
    <div className="page-card">
      <h1>Serviceaufträge</h1>

      <form onSubmit={serviceauftragAnlegen} className="list-box" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Serviceauftrag anlegen</h3>

        <div className="form-row">
          <select value={auftragKundeId} onChange={(e) => { setAuftragKundeId(e.target.value); setAuftragFahrzeugId('') }}>
            <option value="">Kunde auswählen</option>
            {kunden.map((kunde) => (
              <option key={kunde.id} value={kunde.id}>
                {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
              </option>
            ))}
          </select>

          <select value={auftragFahrzeugId} onChange={(e) => setAuftragFahrzeugId(e.target.value)}>
            <option value="">Fahrzeug auswählen</option>
            {fahrzeugeZumGewaehltenKunden.map((fahrzeug) => (
              <option key={fahrzeug.id} value={fahrzeug.id}>
                {fahrzeug.kennzeichen || '-'} – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
              </option>
            ))}
          </select>

          <select value={auftragArt} onChange={(e) => setAuftragArt(e.target.value)}>
            <option value="reparatur">Reparatur</option>
            <option value="wartung">Wartung</option>
            <option value="diagnose">Diagnose</option>
            <option value="service">Service</option>
            <option value="garantie">Garantie</option>
            <option value="reklamation">Reklamation</option>
          </select>

          <select value={auftragStatus} onChange={(e) => setAuftragStatus(e.target.value)}>
            <option value="offen">offen</option>
            <option value="eingeplant">eingeplant</option>
            <option value="in_arbeit">in_arbeit</option>
            <option value="wartet_auf_teile">wartet_auf_teile</option>
            <option value="wartet_auf_freigabe">wartet_auf_freigabe</option>
            <option value="abgeschlossen">abgeschlossen</option>
            <option value="abgerechnet">abgerechnet</option>
            <option value="storniert">storniert</option>
          </select>

          <select value={freigabeStatus} onChange={(e) => setFreigabeStatus(e.target.value)}>
            <option value="offen">freigabe offen</option>
            <option value="angefragt">freigabe angefragt</option>
            <option value="freigegeben">freigegeben</option>
            <option value="abgelehnt">freigabe abgelehnt</option>
          </select>

          <input placeholder="Kilometerstand" value={kilometerstand} onChange={(e) => setKilometerstand(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Fehlerbeschreibung"
            value={fehlerbeschreibung}
            onChange={(e) => setFehlerbeschreibung(e.target.value)}
            style={{ width: '100%', minHeight: 90 }}
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

        <div style={{ marginTop: 12 }}>
          <button type="submit">Serviceauftrag anlegen</button>
        </div>
      </form>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            placeholder="Serviceaufträge suchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="alle">Alle Status</option>
            <option value="offen">offen</option>
            <option value="eingeplant">eingeplant</option>
            <option value="in_arbeit">in_arbeit</option>
            <option value="wartet_auf_teile">wartet_auf_teile</option>
            <option value="wartet_auf_freigabe">wartet_auf_freigabe</option>
            <option value="abgeschlossen">abgeschlossen</option>
            <option value="abgerechnet">abgerechnet</option>
            <option value="storniert">storniert</option>
          </select>
        </div>
      </div>

      {bearbeitenId && (
        <form onSubmit={serviceauftragSpeichern} className="list-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Serviceauftrag bearbeiten</h3>

          <div className="form-row">
            <select value={bearbeitenKundeId} onChange={(e) => { setBearbeitenKundeId(e.target.value); setBearbeitenFahrzeugId('') }}>
              <option value="">Kunde auswählen</option>
              {kunden.map((kunde) => (
                <option key={kunde.id} value={kunde.id}>
                  {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
                </option>
              ))}
            </select>

            <select value={bearbeitenFahrzeugId} onChange={(e) => setBearbeitenFahrzeugId(e.target.value)}>
              <option value="">Fahrzeug auswählen</option>
              {fahrzeugeZumBearbeitenKunden.map((fahrzeug) => (
                <option key={fahrzeug.id} value={fahrzeug.id}>
                  {fahrzeug.kennzeichen || '-'} – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
                </option>
              ))}
            </select>

            <select value={bearbeitenArt} onChange={(e) => setBearbeitenArt(e.target.value)}>
              <option value="reparatur">Reparatur</option>
              <option value="wartung">Wartung</option>
              <option value="diagnose">Diagnose</option>
              <option value="service">Service</option>
              <option value="garantie">Garantie</option>
              <option value="reklamation">Reklamation</option>
            </select>

            <select value={bearbeitenStatus} onChange={(e) => setBearbeitenStatus(e.target.value)}>
              <option value="offen">offen</option>
              <option value="eingeplant">eingeplant</option>
              <option value="in_arbeit">in_arbeit</option>
              <option value="wartet_auf_teile">wartet_auf_teile</option>
              <option value="wartet_auf_freigabe">wartet_auf_freigabe</option>
              <option value="abgeschlossen">abgeschlossen</option>
              <option value="abgerechnet">abgerechnet</option>
              <option value="storniert">storniert</option>
            </select>

            <select value={bearbeitenFreigabeStatus} onChange={(e) => setBearbeitenFreigabeStatus(e.target.value)}>
              <option value="offen">freigabe offen</option>
              <option value="angefragt">freigabe angefragt</option>
              <option value="freigegeben">freigegeben</option>
              <option value="abgelehnt">freigabe abgelehnt</option>
            </select>

            <input placeholder="Kilometerstand" value={bearbeitenKilometerstand} onChange={(e) => setBearbeitenKilometerstand(e.target.value)} />
            <input type="date" value={bearbeitenFertigstellungsdatum} onChange={(e) => setBearbeitenFertigstellungsdatum(e.target.value)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Fehlerbeschreibung"
              value={bearbeitenFehlerbeschreibung}
              onChange={(e) => setBearbeitenFehlerbeschreibung(e.target.value)}
              style={{ width: '100%', minHeight: 90 }}
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

          <div className="form-row" style={{ marginTop: 12 }}>
            <button type="submit">Speichern</button>
            <button type="button" onClick={bearbeitenAbbrechen} style={{ background: '#6b7280' }}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <form onSubmit={materialBuchen} className="list-box" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Material auf Serviceauftrag buchen</h3>

        <div className="form-row">
          <select value={materialAuftragId} onChange={(e) => setMaterialAuftragId(e.target.value)}>
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraege.map((auftrag) => (
              <option key={auftrag.id} value={auftrag.id}>
                {kundeName(auftrag.kunde_id)} – {fahrzeugName(auftrag.fahrzeug_id)} – {auftrag.art || '-'}
              </option>
            ))}
          </select>

          <select value={materialArtikelId} onChange={(e) => setMaterialArtikelId(e.target.value)}>
            <option value="">Lagerartikel auswählen</option>
            {lagerartikel.map((artikel) => (
              <option key={artikel.id} value={artikel.id}>
                {artikel.name} ({artikel.bestand ?? 0} {artikel.einheit || 'Stk'})
              </option>
            ))}
          </select>

          <input placeholder="Menge" value={materialMenge} onChange={(e) => setMaterialMenge(e.target.value)} />
          <input placeholder="Notiz" value={materialNotiz} onChange={(e) => setMaterialNotiz(e.target.value)} />
          <button type="submit">Material buchen</button>
        </div>
      </form>

      <form onSubmit={arbeitszeitBuchen} className="list-box" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Arbeitszeit auf Serviceauftrag buchen</h3>

        <div className="form-row">
          <select value={zeitAuftragId} onChange={(e) => setZeitAuftragId(e.target.value)}>
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraege.map((auftrag) => (
              <option key={auftrag.id} value={auftrag.id}>
                {kundeName(auftrag.kunde_id)} – {fahrzeugName(auftrag.fahrzeug_id)} – {auftrag.art || '-'}
              </option>
            ))}
          </select>

          <select value={zeitMitarbeiterId} onChange={(e) => setZeitMitarbeiterId(e.target.value)}>
            <option value="">Mitarbeiter auswählen</option>
            {mitarbeiter.map((person) => (
              <option key={person.id} value={person.id}>
                {person.vorname} {person.nachname}
              </option>
            ))}
          </select>

          <input type="date" value={zeitDatum} onChange={(e) => setZeitDatum(e.target.value)} />
          <input placeholder="Stunden" value={zeitStunden} onChange={(e) => setZeitStunden(e.target.value)} />
          <input placeholder="Stundensatz" value={zeitStundensatz} onChange={(e) => setZeitStundensatz(e.target.value)} />
          <input placeholder="Notiz" value={zeitNotiz} onChange={(e) => setZeitNotiz(e.target.value)} />
          <button type="submit">Arbeitszeit buchen</button>
        </div>
      </form>

      <form onSubmit={anhangHochladen} className="list-box" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Anhang zu Serviceauftrag hochladen</h3>

        <div className="form-row">
          <select value={anhangAuftragId} onChange={(e) => setAnhangAuftragId(e.target.value)}>
            <option value="">Serviceauftrag auswählen</option>
            {serviceauftraege.map((auftrag) => (
              <option key={auftrag.id} value={auftrag.id}>
                {kundeName(auftrag.kunde_id)} – {fahrzeugName(auftrag.fahrzeug_id)} – {auftrag.art || '-'}
              </option>
            ))}
          </select>

          <input placeholder="Titel" value={anhangTitel} onChange={(e) => setAnhangTitel(e.target.value)} />
          <input type="file" onChange={(e) => setAnhangDatei(e.target.files?.[0] || null)} />
          <button type="submit">Anhang hochladen</button>
        </div>
      </form>

      <div>
        {gefiltert.map((auftrag) => {
          const material = materialVonAuftrag(auftrag.id)
          const zeiten = arbeitszeitenVonAuftrag(auftrag.id)
          const materialsumme = materialSummeVonAuftrag(auftrag.id)
          const arbeitszeitsumme = arbeitszeitSummeVonAuftrag(auftrag.id)
          const gesamtsumme = materialsumme + arbeitszeitsumme

          return (
            <div key={auftrag.id} className="list-box">
              <strong>{kundeName(auftrag.kunde_id)}</strong>
              <br />
              Fahrzeug: {fahrzeugName(auftrag.fahrzeug_id)}
              <br />
              Art: {auftrag.art || '-'}
              <br />
              Status: {auftrag.status || '-'}
              <br />
              Freigabe: {auftrag.freigabe_status || '-'}
              <br />
              Fehler: {auftrag.fehlerbeschreibung || '-'}
              <br />
              Interne Notiz: {auftrag.interne_notiz || '-'}
              <br />
              Kilometerstand: {auftrag.kilometerstand_bei_annahme ?? '-'}
              <br />
              Fertigstellung: {auftrag.fertigstellungsdatum || '-'}
              <br />
              Materialsumme: {materialsumme.toFixed(2)} €
              <br />
              Arbeitssumme: {arbeitszeitsumme.toFixed(2)} €
              <br />
              Auftragssumme: {gesamtsumme.toFixed(2)} €
              <br />
              <Link href={`/serviceauftraege/${auftrag.id}`}>Zur Auftragsdetailseite</Link>

              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => bearbeitenStarten(auftrag)}>
                  Bearbeiten
                </button>
                <button type="button" onClick={() => serviceauftragLoeschen(auftrag.id)} style={{ background: '#dc2626' }}>
                  Löschen
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Gebuchtes Material</strong>
                {material.length === 0 ? (
                  <div style={{ marginTop: 8 }}>Kein Material gebucht</div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    {material.map((m) => (
                      <div key={m.id} style={{ marginBottom: 8 }}>
                        {artikelName(m.lagerartikel_id)} – {m.menge} – Einzelpreis {Number(m.einzelpreis || 0).toFixed(2)} € – Gesamt {Number(m.gesamtpreis || 0).toFixed(2)} €
                        {m.notiz ? ` – ${m.notiz}` : ''}
                        <div style={{ marginTop: 6 }}>
                          <button type="button" onClick={() => materialLoeschen(m)} style={{ background: '#dc2626' }}>
                            Material löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Gebuchte Arbeitszeiten</strong>
                {zeiten.length === 0 ? (
                  <div style={{ marginTop: 8 }}>Keine Arbeitszeit gebucht</div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    {zeiten.map((z) => (
                      <div key={z.id} style={{ marginBottom: 8 }}>
                        {z.datum} – {mitarbeiterName(z.mitarbeiter_id)} – {z.stunden} Std – Stundensatz {Number(z.stundensatz || 0).toFixed(2)} € – Gesamt {Number(z.gesamtpreis || 0).toFixed(2)} €
                        {z.notiz ? ` – ${z.notiz}` : ''}
                        <div style={{ marginTop: 6 }}>
                          <button type="button" onClick={() => arbeitszeitLoeschen(z.id)} style={{ background: '#dc2626' }}>
                            Arbeitszeit löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Anhänge</strong>
                {anhaengeVonAuftrag(auftrag.id).length === 0 ? (
                  <div style={{ marginTop: 8 }}>Keine Anhänge</div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    {anhaengeVonAuftrag(auftrag.id).map((anhang) => (
                      <div key={anhang.id}>
                        <a href={dateiUrl(anhang.dateipfad)} target="_blank" rel="noreferrer">
                          {anhang.titel || anhang.dateiname}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function ServiceauftraegePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme']}>
      <ServiceauftraegePageContent />
    </RoleGuard>
  )
}