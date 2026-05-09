'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Timeline = {
  id: string
  erstellt_am: string
  serviceauftrag_id: string
  typ: string
  titel: string
  beschreibung: string | null
  benutzername: string | null
}

type Props = {
  serviceauftragId: string
}

export default function ServiceTimeline({ serviceauftragId }: Props) {
  const [timeline, setTimeline] = useState<Timeline[]>([])
  const [fehler, setFehler] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('serviceauftrag_timeline')
      .select('*')
      .eq('serviceauftrag_id', serviceauftragId)
      .order('erstellt_am', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setTimeline((data || []) as Timeline[])
  }

  useEffect(() => {
    laden()
  }, [serviceauftragId])

  return (
    <div className="page-card">
      <h2 style={{ marginTop: 0 }}>Auftrags-Timeline</h2>

      {timeline.map((t) => (
        <div
          key={t.id}
          className="list-box"
          style={{
            borderLeft: '5px solid #f59e0b',
          }}
        >
          <strong>{t.titel}</strong>
          <br />
          Typ: {t.typ}
          <br />
          Zeit: {new Date(t.erstellt_am).toLocaleString('de-DE')}
          <br />
          Benutzer: {t.benutzername || '-'}
          {t.beschreibung && (
            <>
              <br />
              Beschreibung: {t.beschreibung}
            </>
          )}
        </div>
      ))}

      {timeline.length === 0 && <div className="muted">Noch keine Timeline-Einträge vorhanden.</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}