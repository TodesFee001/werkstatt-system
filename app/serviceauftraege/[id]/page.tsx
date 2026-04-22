'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
}

type Material = {
  id: string
  serviceauftrag_id: string
  lagerartikel_id: string
  menge: number
  einzelpreis: number | null
  gesamtpreis: number | null
  notiz: string | null
}

type Arbeitszeit = {
  id: string
  serviceauftrag_id: string
  mitarbeiter_id: string | null
  datum: string
  stunden: number
  stundensatz: number | null
  gesamtpreis: number | null
  notiz: string | null
}

type Lagerartikel = {
  id: string
  name: string
}

type Mitarbeiter = {
  id: string
  vorname: string
  nachname: string
}

type Termin = {
  id: string
  serviceauftrag_id: string
  titel: string
  startzeit: string
  endzeit: string
  status: string | null
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

type Fahrzeugcheck = {
  id: string
  serviceauftrag_id: string
  kilometerstand: number | null
  tankstand: string | null
  aussencheck: string | null
  innencheck: string | null
  schaeden: string | null
  zubehoer: string | null
  notiz: string | null
  kundenunterschrift: string | null
  mitarbeiterunterschrift: string | null
}

type Zusatzfreigabe = {
  id: string
  serviceauftrag_id: string
  titel: string
  beschreibung: string | null
  betrag: number | null
  status: string | null
  kundenname: string | null
  kundenunterschrift: string | null
  freigegeben_am: string | null
}

export default function ServiceauftragDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [auftrag, setAuftrag] = useState<Serviceauftrag | null>(null)
  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [fahrzeug, setFahrzeug] = useState<Fahrzeug | null>(null)
  const [material, setMaterial] = useState<Material[]>([])
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [anhaenge, setAnhaenge] = useState<Anhang[]>([])
  const [fahrzeugchecks, setFahrzeugchecks] = useState<Fahrzeugcheck[]>([])
  const [zusatzfreigaben, setZusatzfreigaben] = useState<Zusatzfreigabe[]>([])

  const [anhangTitel, setAnhangTitel] = useState('')
  const [anhangDatei, setAnhangDatei] = useState<File | null>(null)

  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function ladeAlles() {
    const { data: auftragData, error: auftragError } = await supabase
      .from('serviceauftraege')
      .select('*')
      .eq('id', id)
      .single()

    if (auftragError || !auftragData) {
      setFehler(auftragError?.message || 'Serviceauftrag nicht gefunden')
      return
    }

    setAuftrag(auftragData)

    const [
      kundeRes,
      fahrzeugRes,
      materialRes,
      arbeitszeitRes,
      lagerRes,
      mitarbeiterRes,
      termineRes,
      anhaengeRes,
      checksRes,
      freigabenRes,
    ] = await Promise.all([
      auftragData.kunde_id
        ? supabase.from('kunden').select('*').eq('id', auftragData.kunde_id).single()
        : Promise.resolve({ data: null, error: null } as any),
      auftragData.fahrzeug_id
        ? supabase.from('fahrzeuge').select('*').eq('id', auftragData.fahrzeug_id).single()
        : Promise.resolve({ data: null, error: null } as any),
      supabase.from('serviceauftrag_material').select('*').eq('serviceauftrag_id', id),
      supabase.from('serviceauftrag_arbeitszeiten').select('*').eq('serviceauftrag_id', id),
      supabase.from('lagerartikel').select('id, name'),
      supabase.from('mitarbeiter').select('id, vorname, nachname'),
      supabase.from('serviceauftrag_termine').select('*').eq('serviceauftrag_id', id),
      supabase.from('anhaenge').select('*').eq('bezug_typ', 'serviceauftrag').eq('bezug_id', id),
      supabase.from('fahrzeugchecks').select('*').eq('serviceauftrag_id', id).order('erstellt_am', { ascending: false }),
      supabase.from('zusatzfreigaben').select('*').eq('serviceauftrag_id', id).order('erstellt_am', { ascending: false }),
    ])

    const error =
      kundeRes.error ||
      fahrzeugRes.error ||
      materialRes.error ||
      arbeitszeitRes.error ||
      lagerRes.error ||
      mitarbeiterRes.error ||
      termineRes.error ||
      anhaengeRes.error ||
      checksRes.error ||
      freigabenRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setKunde(kundeRes.data || null)
    setFahrzeug(fahrzeugRes.data || null)
    setMaterial(materialRes.data || [])
    setArbeitszeiten(arbeitszeitRes.data || [])
    setLagerartikel(lagerRes.data || [])
    setMitarbeiter(mitarbeiterRes.data || [])
    setTermine(termineRes.data || [])
    setAnhaenge(anhaengeRes.data || [])
    setFahrzeugchecks(checksRes.data || [])
    setZusatzfreigaben(freigabenRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [id])

  function artikelName(lagerartikelId: string) {
    return lagerartikel.find((a) => a.id === lagerartikelId)?.name || 'Unbekannter Artikel'
  }

  function mitarbeiterName(mitarbeiterId: string | null) {
    if (!mitarbeiterId) return '-'
    const person = mitarbeiter.find((m) => m.id === mitarbeiterId)
    return person ? `${person.vorname} ${person.nachname}` : '-'
  }

  function dateiUrl(dateipfad: string) {
    return supabase.storage.from('anhaenge').getPublicUrl(dateipfad).data.publicUrl
  }

  async function anhangHochladen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

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
      bezug_id: id,
      titel: anhangTitel || null,
      dateiname: anhangDatei.name,
      dateipfad: dateiname,
      dateityp: anhangDatei.type || null,
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setAnhangTitel('')
    setAnhangDatei(null)
    setMeldung('Foto / Datei hochgeladen.')
    ladeAlles()
  }

  const materialsumme = material.reduce((sum, m) => sum + Number(m.gesamtpreis || 0), 0)
  const arbeitszeitsumme = arbeitszeiten.reduce((sum, z) => sum + Number(z.gesamtpreis || 0), 0)

  return (
    <div className="page-card">
      <h1>Serviceauftragdetail</h1>

      {auftrag && (
        <div className="list-box">
          <strong>{auftrag.art || '-'}</strong>
          <br />
          Status: {auftrag.status || '-'}
          <br />
          Freigabe: {auftrag.freigabe_status || '-'}
          <br />
          Fehlerbeschreibung: {auftrag.fehlerbeschreibung || '-'}
          <br />
          Interne Notiz: {auftrag.interne_notiz || '-'}
          <br />
          Kilometerstand: {auftrag.kilometerstand_bei_annahme ?? '-'}
          <br />
          Fertigstellung: {auftrag.fertigstellungsdatum || '-'}
          <br />
          Kunde:{' '}
          {kunde
            ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
            : '-'}
          <br />
          Fahrzeug:{' '}
          {fahrzeug
            ? `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}`
            : '-'}
          <br />
          {kunde && <Link href={`/kunden/${kunde.id}`}>Zur Kundendetailseite</Link>}
          <br />
          {fahrzeug && <Link href={`/fahrzeuge/${fahrzeug.id}`}>Zur Fahrzeugdetailseite</Link>}
        </div>
      )}

      <h2>Fahrzeugcheck / Annahme</h2>
      {fahrzeugchecks.length === 0 ? (
        <div className="list-box">Kein Fahrzeugcheck vorhanden.</div>
      ) : (
        fahrzeugchecks.map((c) => (
          <div key={c.id} className="list-box">
            Kilometerstand: {c.kilometerstand ?? '-'}
            <br />
            Tankstand: {c.tankstand || '-'}
            <br />
            Außencheck: {c.aussencheck || '-'}
            <br />
            Innencheck: {c.innencheck || '-'}
            <br />
            Schäden: {c.schaeden || '-'}
            <br />
            Zubehör: {c.zubehoer || '-'}
            <br />
            Notiz: {c.notiz || '-'}
            <br />
            Kundenunterschrift: {c.kundenunterschrift || '-'}
            <br />
            Mitarbeiterunterschrift: {c.mitarbeiterunterschrift || '-'}
          </div>
        ))
      )}

      <h2>Zusatzfreigaben</h2>
      {zusatzfreigaben.length === 0 ? (
        <div className="list-box">Keine Zusatzfreigaben vorhanden.</div>
      ) : (
        zusatzfreigaben.map((f) => (
          <div key={f.id} className="list-box">
            <strong>{f.titel}</strong>
            <br />
            Beschreibung: {f.beschreibung || '-'}
            <br />
            Betrag: {Number(f.betrag || 0).toFixed(2)} €
            <br />
            Status: {f.status || '-'}
            <br />
            Kunde: {f.kundenname || '-'}
            <br />
            Unterschrift: {f.kundenunterschrift || '-'}
            <br />
            Freigegeben am: {f.freigegeben_am ? new Date(f.freigegeben_am).toLocaleString('de-DE') : '-'}
          </div>
        ))
      )}

      <h2>Material</h2>
      {material.map((m) => (
        <div key={m.id} className="list-box">
          <strong>{artikelName(m.lagerartikel_id)}</strong>
          <br />
          Menge: {m.menge}
          <br />
          Einzelpreis: {Number(m.einzelpreis || 0).toFixed(2)} €
          <br />
          Gesamt: {Number(m.gesamtpreis || 0).toFixed(2)} €
          <br />
          Notiz: {m.notiz || '-'}
        </div>
      ))}
      <div className="list-box">
        <strong>Materialsumme</strong>
        <br />
        {materialsumme.toFixed(2)} €
      </div>

      <h2>Arbeitszeiten</h2>
      {arbeitszeiten.map((z) => (
        <div key={z.id} className="list-box">
          <strong>{z.datum}</strong>
          <br />
          Mitarbeiter: {mitarbeiterName(z.mitarbeiter_id)}
          <br />
          Stunden: {z.stunden}
          <br />
          Stundensatz: {Number(z.stundensatz || 0).toFixed(2)} €
          <br />
          Gesamt: {Number(z.gesamtpreis || 0).toFixed(2)} €
          <br />
          Notiz: {z.notiz || '-'}
        </div>
      ))}
      <div className="list-box">
        <strong>Arbeitssumme</strong>
        <br />
        {arbeitszeitsumme.toFixed(2)} €
      </div>

      <h2>Termine</h2>
      {termine.map((t) => (
        <div key={t.id} className="list-box">
          <strong>{t.titel}</strong>
          <br />
          Start: {new Date(t.startzeit).toLocaleString('de-DE')}
          <br />
          Ende: {new Date(t.endzeit).toLocaleString('de-DE')}
          <br />
          Status: {t.status || '-'}
        </div>
      ))}

      <h2>Fotos / Anhänge</h2>

      <form onSubmit={anhangHochladen} className="list-box" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            placeholder="Titel"
            value={anhangTitel}
            onChange={(e) => setAnhangTitel(e.target.value)}
          />
          <input type="file" onChange={(e) => setAnhangDatei(e.target.files?.[0] || null)} />
        </div>

        <div className="action-row">
          <button type="submit">Foto / Datei hochladen</button>
        </div>
      </form>

      {anhaenge.length === 0 ? (
        <div className="list-box">Keine Anhänge vorhanden.</div>
      ) : (
        anhaenge.map((a) => (
          <div key={a.id} className="list-box">
            <a href={dateiUrl(a.dateipfad)} target="_blank" rel="noreferrer">
              {a.titel || a.dateiname}
            </a>
            <br />
            Typ: {a.dateityp || '-'}
          </div>
        ))
      )}

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}