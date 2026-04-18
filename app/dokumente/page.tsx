'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '@/components/RoleGuard'

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

type Mitarbeiter = {
  id: string
  vorname: string
  nachname: string
}

type Dokument = {
  id: string
  titel: string
  dateiname: string
  dateipfad: string
  dateityp: string | null
  bezug_typ: string | null
  bezug_id: string | null
  created_at: string
}

function DokumentePageContent() {
  const [kunden, setKunden] = useState<Kunde[]>([])
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [dokumente, setDokumente] = useState<Dokument[]>([])

  const [titel, setTitel] = useState('')
  const [bezugTyp, setBezugTyp] = useState('kunde')
  const [bezugId, setBezugId] = useState('')
  const [datei, setDatei] = useState<File | null>(null)

  const [fehler, setFehler] = useState('')
  const [laedt, setLaedt] = useState(false)

  async function ladeAlles() {
    const { data: kData, error: kError } = await supabase
      .from('kunden')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: fData, error: fError } = await supabase
      .from('fahrzeuge')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: mData, error: mError } = await supabase
      .from('mitarbeiter')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: dData, error: dError } = await supabase
      .from('dokumente')
      .select('*')
      .order('created_at', { ascending: false })

    if (kError || fError || mError || dError) {
      setFehler(kError?.message || fError?.message || mError?.message || dError?.message || 'Fehler')
      return
    }

    setKunden(kData || [])
    setFahrzeuge(fData || [])
    setMitarbeiter(mData || [])
    setDokumente(dData || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function dokumentAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!titel) {
      setFehler('Bitte einen Titel eingeben.')
      return
    }

    if (!datei) {
      setFehler('Bitte eine Datei auswählen.')
      return
    }

    if (!bezugId) {
      setFehler('Bitte einen Bezug auswählen.')
      return
    }

    setLaedt(true)

    const dateiname = `${Date.now()}-${datei.name}`

    const { error: uploadError } = await supabase.storage
      .from('dokumente')
      .upload(dateiname, datei)

    if (uploadError) {
      setLaedt(false)
      setFehler(uploadError.message)
      return
    }

    const { error: insertError } = await supabase.from('dokumente').insert({
      titel,
      dateiname: datei.name,
      dateipfad: dateiname,
      dateityp: datei.type || null,
      bezug_typ: bezugTyp,
      bezug_id: bezugId,
    })

    setLaedt(false)

    if (insertError) {
      setFehler(insertError.message)
      return
    }

    setTitel('')
    setBezugTyp('kunde')
    setBezugId('')
    setDatei(null)

    ladeAlles()
  }

  function bezugAnzeigen(dokument: Dokument) {
    if (dokument.bezug_typ === 'kunde') {
      const kunde = kunden.find((k) => k.id === dokument.bezug_id)
      return kunde
        ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()
        : 'Unbekannter Kunde'
    }

    if (dokument.bezug_typ === 'fahrzeug') {
      const fahrzeug = fahrzeuge.find((f) => f.id === dokument.bezug_id)
      return fahrzeug
        ? `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}`
        : 'Unbekanntes Fahrzeug'
    }

    if (dokument.bezug_typ === 'mitarbeiter') {
      const person = mitarbeiter.find((m) => m.id === dokument.bezug_id)
      return person
        ? `${person.vorname} ${person.nachname}`
        : 'Unbekannter Mitarbeiter'
    }

    return '-'
  }

  function dateiUrl(dateipfad: string) {
    const { data } = supabase.storage.from('dokumente').getPublicUrl(dateipfad)
    return data.publicUrl
  }

  return (
    <div className="page-card">
      <h1>Dokumente</h1>

      <form onSubmit={dokumentAnlegen} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <input
            placeholder="Titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            style={{ minWidth: 220 }}
          />

          <select
            value={bezugTyp}
            onChange={(e) => {
              setBezugTyp(e.target.value)
              setBezugId('')
            }}
            style={{ minWidth: 180 }}
          >
            <option value="kunde">Kunde</option>
            <option value="fahrzeug">Fahrzeug</option>
            <option value="mitarbeiter">Mitarbeiter</option>
          </select>

          <select
            value={bezugId}
            onChange={(e) => setBezugId(e.target.value)}
            style={{ minWidth: 260 }}
          >
            <option value="">Bezug auswählen</option>

            {bezugTyp === 'kunde' &&
              kunden.map((kunde) => (
                <option key={kunde.id} value={kunde.id}>
                  {kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim()}
                </option>
              ))}

            {bezugTyp === 'fahrzeug' &&
              fahrzeuge.map((fahrzeug) => (
                <option key={fahrzeug.id} value={fahrzeug.id}>
                  {fahrzeug.kennzeichen || '-'} – {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
                </option>
              ))}

            {bezugTyp === 'mitarbeiter' &&
              mitarbeiter.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.vorname} {person.nachname}
                </option>
              ))}
          </select>

          <input
            type="file"
            onChange={(e) => setDatei(e.target.files?.[0] || null)}
            style={{ minWidth: 260 }}
          />

          <button type="submit" disabled={laedt}>
            {laedt ? 'Lädt hoch...' : 'Dokument hochladen'}
          </button>
        </div>
      </form>

      <div>
        {dokumente.map((dokument) => (
          <div key={dokument.id} className="list-box">
            <strong>{dokument.titel}</strong>
            <br />
            Datei: {dokument.dateiname}
            <br />
            Typ: {dokument.dateityp || '-'}
            <br />
            Bezug: {dokument.bezug_typ || '-'} – {bezugAnzeigen(dokument)}
            <br />
            <a
              href={dateiUrl(dokument.dateipfad)}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2563eb', fontWeight: 600 }}
            >
              Dokument öffnen
            </a>
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function DokumentePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme']}>
      <DokumentePageContent />
    </RoleGuard>
  )
}