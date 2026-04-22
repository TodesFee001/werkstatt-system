'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 🔴 WICHTIG: weil dein components-Ordner in app liegt
import RoleGuard from '../components/RoleGuard'

type Dokument = {
  id: string
  titel: string | null
  beschreibung: string | null
  dateipfad: string | null
  erstellt_am: string | null
}

export default function DokumentePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme']}>
      <DokumenteContent />
    </RoleGuard>
  )
}

function DokumenteContent() {
  const [dokumente, setDokumente] = useState<Dokument[]>([])

  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [datei, setDatei] = useState<File | null>(null)

  const [fehler, setFehler] = useState('')

  async function ladeDokumente() {
    const { data, error } = await supabase
      .from('dokumente')
      .select('*')
      .order('erstellt_am', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setDokumente(data || [])
  }

  useEffect(() => {
    ladeDokumente()
  }, [])

  async function dokumentAnlegen(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!titel) {
      setFehler('Bitte Titel eingeben')
      return
    }

    let dateipfad = null

    // 🔹 Datei hochladen (optional)
    if (datei) {
      const dateiname = `${Date.now()}-${datei.name}`

      const { error: uploadError } = await supabase.storage
        .from('dokumente')
        .upload(dateiname, datei)

      if (uploadError) {
        setFehler(uploadError.message)
        return
      }

      dateipfad = dateiname
    }

    const { error } = await supabase.from('dokumente').insert({
      titel,
      beschreibung: beschreibung || null,
      dateipfad,
      erstellt_am: new Date().toISOString(),
    })

    if (error) {
      setFehler(error.message)
      return
    }

    setTitel('')
    setBeschreibung('')
    setDatei(null)

    ladeDokumente()
  }

  async function dokumentLoeschen(id: string, pfad: string | null) {
    const ok = confirm('Dokument wirklich löschen?')
    if (!ok) return

    // 🔹 Datei aus Storage löschen
    if (pfad) {
      await supabase.storage.from('dokumente').remove([pfad])
    }

    const { error } = await supabase
      .from('dokumente')
      .delete()
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeDokumente()
  }

  function getDownloadUrl(pfad: string | null) {
    if (!pfad) return null

    const { data } = supabase.storage
      .from('dokumente')
      .getPublicUrl(pfad)

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
            style={{ minWidth: 200 }}
          />

          <input
            placeholder="Beschreibung"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            style={{ minWidth: 250 }}
          />

          <input
            type="file"
            onChange={(e) => setDatei(e.target.files?.[0] || null)}
          />

          <button type="submit">Dokument anlegen</button>
        </div>
      </form>

      <div>
        {dokumente.map((d) => {
          const url = getDownloadUrl(d.dateipfad)

          return (
            <div key={d.id} className="list-box">
              <strong>{d.titel}</strong>
              <br />
              {d.beschreibung || '-'}
              <br />

              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  📄 Öffnen / Download
                </a>
              )}

              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => dokumentLoeschen(d.id, d.dateipfad)}
                  style={{ background: 'red' }}
                >
                  Löschen
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}