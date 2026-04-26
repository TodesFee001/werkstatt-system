'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logAktion } from '@/lib/activity-log'

type Notiz = {
  id: string
  erstellt_am: string | null
  aktualisiert_am: string | null
  kunde_id: string
  text: string
  erstellt_von: string | null
  erstellt_von_name: string | null
}

type Props = {
  kundeId: string
  titel?: string
  readOnly?: boolean
}

export default function NoteManager({ kundeId, titel, readOnly = false }: Props) {
  const [notizen, setNotizen] = useState<Notiz[]>([])
  const [text, setText] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenText, setBearbeitenText] = useState('')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('kunden_notizen')
      .select('*')
      .eq('kunde_id', kundeId)
      .order('erstellt_am', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setNotizen((data || []) as Notiz[])
  }

  useEffect(() => {
    laden()
  }, [kundeId])

  async function erstellen() {
    if (readOnly) return
    setFehler('')
    setMeldung('')

    if (!text.trim()) {
      setFehler('Bitte eine Notiz eingeben.')
      return
    }

    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes.data.session?.user?.id || null

    let benutzername: string | null = null
    if (userId) {
      const profilRes = await supabase
        .from('benutzerprofile')
        .select('benutzername')
        .eq('id', userId)
        .maybeSingle()

      benutzername = (profilRes.data as { benutzername?: string } | null)?.benutzername || null
    }

    const insertRes = await supabase.from('kunden_notizen').insert({
      kunde_id: kundeId,
      text: text.trim(),
      erstellt_von: userId,
      erstellt_von_name: benutzername,
    })

    if (insertRes.error) {
      setFehler(insertRes.error.message)
      return
    }

    await logAktion('kundenakte', 'notiz_erstellt', kundeId, titel || 'Kundenakte', {
      text: text.trim(),
    })

    setText('')
    setMeldung('Notiz wurde gespeichert.')
    laden()
  }

  function startBearbeiten(n: Notiz) {
    if (readOnly) return
    setBearbeitenId(n.id)
    setBearbeitenText(n.text)
  }

  function abbrechenBearbeiten() {
    setBearbeitenId(null)
    setBearbeitenText('')
  }

  async function speichernBearbeiten() {
    if (readOnly || !bearbeitenId) return
    setFehler('')
    setMeldung('')

    if (!bearbeitenText.trim()) {
      setFehler('Bitte einen Text eingeben.')
      return
    }

    const updateRes = await supabase
      .from('kunden_notizen')
      .update({
        text: bearbeitenText.trim(),
      })
      .eq('id', bearbeitenId)

    if (updateRes.error) {
      setFehler(updateRes.error.message)
      return
    }

    await logAktion('kundenakte', 'notiz_bearbeitet', kundeId, titel || 'Kundenakte', {
      notiz_id: bearbeitenId,
      text: bearbeitenText.trim(),
    })

    abbrechenBearbeiten()
    setMeldung('Notiz wurde aktualisiert.')
    laden()
  }

  async function loeschen(id: string) {
    if (readOnly) return
    setFehler('')
    setMeldung('')

    const ok = window.confirm('Notiz wirklich löschen?')
    if (!ok) return

    const deleteRes = await supabase.from('kunden_notizen').delete().eq('id', id)

    if (deleteRes.error) {
      setFehler(deleteRes.error.message)
      return
    }

    await logAktion('kundenakte', 'notiz_geloescht', kundeId, titel || 'Kundenakte', {
      notiz_id: id,
    })

    setMeldung('Notiz wurde gelöscht.')
    laden()
  }

  return (
    <div className="page-card">
      <h2 style={{ marginTop: 0 }}>Interne Notizen</h2>

      {!readOnly && (
        <>
          <div style={{ display: 'grid', gap: 12 }}>
            <textarea
              placeholder="Neue interne Notiz"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ width: '100%', minHeight: 110 }}
            />
            <div className="action-row">
              <button type="button" onClick={erstellen}>
                Notiz speichern
              </button>
            </div>
          </div>
        </>
      )}

      {meldung && <div className="badge badge-success" style={{ marginTop: 12 }}>{meldung}</div>}
      {fehler && <div className="error-box" style={{ marginTop: 12 }}>{fehler}</div>}

      <div style={{ marginTop: 16 }}>
        {notizen.map((n) => (
          <div key={n.id} className="list-box">
            {bearbeitenId === n.id && !readOnly ? (
              <>
                <textarea
                  value={bearbeitenText}
                  onChange={(e) => setBearbeitenText(e.target.value)}
                  style={{ width: '100%', minHeight: 100 }}
                />
                <div className="action-row" style={{ marginTop: 10 }}>
                  <button type="button" onClick={speichernBearbeiten}>
                    Speichern
                  </button>
                  <button type="button" onClick={abbrechenBearbeiten} style={{ background: '#6b7280' }}>
                    Abbrechen
                  </button>
                </div>
              </>
            ) : (
              <>
                <strong>{n.erstellt_von_name || 'Unbekannt'}</strong>
                <br />
                Erstellt: {n.erstellt_am ? new Date(n.erstellt_am).toLocaleString('de-DE') : '-'}
                <br />
                Aktualisiert: {n.aktualisiert_am ? new Date(n.aktualisiert_am).toLocaleString('de-DE') : '-'}
                <br />
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{n.text}</div>

                {!readOnly && (
                  <div className="action-row" style={{ marginTop: 10 }}>
                    <button type="button" onClick={() => startBearbeiten(n)}>
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => loeschen(n.id)}
                      style={{ background: '#dc2626' }}
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {notizen.length === 0 && <div className="muted">Keine internen Notizen vorhanden.</div>}
      </div>
    </div>
  )
}