'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Anhang = {
  id: string
  erstellt_am: string | null
  bereich: string
  datensatz_id: string
  dateiname: string
  bucket: string
  pfad: string
  public_url: string | null
  bemerkung: string | null
}

type Props = {
  bereich: string
  datensatzId: string
  titel?: string
}

const BUCKET_NAME = 'werkstatt-anhaenge'

export default function AttachmentManager({ bereich, datensatzId }: Props) {
  const [anhaenge, setAnhaenge] = useState<Anhang[]>([])
  const [bemerkung, setBemerkung] = useState('')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')
  const [uploadLaedt, setUploadLaedt] = useState(false)

  async function laden() {
    const { data, error } = await supabase
      .from('anhaenge')
      .select('*')
      .eq('bereich', bereich)
      .eq('datensatz_id', datensatzId)
      .order('erstellt_am', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setAnhaenge((data || []) as Anhang[])
  }

  useEffect(() => {
    laden()
  }, [bereich, datensatzId])

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFehler('')
    setMeldung('')
    setUploadLaedt(true)

    const safeName = `${Date.now()}-${file.name
      .normalize('NFKD')
      .replace(/[^\w.\-]/g, '_')
      .replace(/_+/g, '_')}`

    const pfad = `${bereich}/${datensatzId}/${safeName}`

    const uploadRes = await supabase.storage
      .from(BUCKET_NAME)
      .upload(pfad, file, {
        upsert: false,
      })

    if (uploadRes.error) {
      setFehler(uploadRes.error.message)
      setUploadLaedt(false)
      return
    }

    const publicUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(pfad).data.publicUrl

    const insertRes = await supabase.from('anhaenge').insert({
      bereich,
      datensatz_id: datensatzId,
      dateiname: file.name,
      bucket: BUCKET_NAME,
      pfad,
      public_url: publicUrl,
      bemerkung: bemerkung || null,
    })

    if (insertRes.error) {
      setFehler(insertRes.error.message)
      setUploadLaedt(false)
      return
    }

    setBemerkung('')
    setMeldung('Datei wurde hochgeladen.')
    setUploadLaedt(false)
    e.target.value = ''
    laden()
  }

  async function loeschen(anhang: Anhang) {
    const ok = window.confirm('Anhang wirklich löschen?')
    if (!ok) return

    await supabase.storage.from(anhang.bucket || BUCKET_NAME).remove([anhang.pfad])

    const { error } = await supabase.from('anhaenge').delete().eq('id', anhang.id)

    if (error) {
      setFehler(error.message)
      return
    }

    setMeldung('Anhang wurde gelöscht.')
    laden()
  }

  return (
    <div className="page-card">
      <h2 style={{ marginTop: 0 }}>Anhänge</h2>

      <div className="form-row">
        <input
          placeholder="Bemerkung"
          value={bemerkung}
          onChange={(e) => setBemerkung(e.target.value)}
        />
        <input type="file" onChange={upload} />
      </div>

      {uploadLaedt && <div className="muted" style={{ marginTop: 10 }}>Upload läuft ...</div>}
      {meldung && <div className="badge badge-success" style={{ marginTop: 10 }}>{meldung}</div>}
      {fehler && <div className="error-box" style={{ marginTop: 10 }}>{fehler}</div>}

      <div style={{ marginTop: 16 }}>
        {anhaenge.map((a) => (
          <div key={a.id} className="list-box">
            <strong>{a.dateiname}</strong>
            <br />
            Bemerkung: {a.bemerkung || '-'}
            <br />
            Hochgeladen: {a.erstellt_am ? new Date(a.erstellt_am).toLocaleString('de-DE') : '-'}

            <div className="action-row">
              {a.public_url && (
                <a
                  href={a.public_url}
                  target="_blank"
                  rel="noreferrer"
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
                </a>
              )}

              <button
                type="button"
                onClick={() => loeschen(a)}
                style={{ background: '#dc2626' }}
              >
                Löschen
              </button>
            </div>
          </div>
        ))}

        {anhaenge.length === 0 && <div className="muted">Keine Anhänge vorhanden.</div>}
      </div>
    </div>
  )
}