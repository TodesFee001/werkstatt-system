'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Logeintrag = {
  id: string
  erstellt_am: string | null
  benutzer_id: string | null
  benutzername: string | null
  rolle: string | null
  bereich: string
  aktion: string
  datensatz_id: string | null
  titel: string | null
  details: Record<string, unknown> | null
}

export default function LogsPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <LogsPageContent />
    </RoleGuard>
  )
}

function LogsPageContent() {
  const [logs, setLogs] = useState<Logeintrag[]>([])
  const [suche, setSuche] = useState('')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('aktivitaetslog')
      .select('*')
      .order('erstellt_am', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setLogs((data || []) as Logeintrag[])
  }

  useEffect(() => {
    laden()
  }, [])

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return logs.filter((l) => {
      if (!q) return true

      return [
        l.benutzername,
        l.rolle,
        l.bereich,
        l.aktion,
        l.datensatz_id,
        l.titel,
        JSON.stringify(l.details || {}),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [logs, suche])

  return (
    <div className="page-card">
      <h1>Aktivitätslog</h1>
      <p>Hier werden Änderungen, Uploads und wichtige Aktionen systemweit protokolliert.</p>

      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          placeholder="Logs durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
      </div>

      {gefiltert.map((l) => (
        <div key={l.id} className="list-box">
          <strong>{l.bereich} · {l.aktion}</strong>
          <br />
          Zeit: {l.erstellt_am ? new Date(l.erstellt_am).toLocaleString('de-DE') : '-'}
          <br />
          Benutzer: {l.benutzername || '-'} ({l.rolle || '-'})
          <br />
          Titel: {l.titel || '-'}
          <br />
          Datensatz: {l.datensatz_id || '-'}
          <br />
          Details:
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#10171d',
              border: '1px solid #36414d',
              borderRadius: 12,
              padding: 12,
              marginTop: 8,
              color: '#c7d0d9',
            }}
          >
            {JSON.stringify(l.details || {}, null, 2)}
          </pre>
        </div>
      ))}

      {gefiltert.length === 0 && <div className="muted">Keine Logeinträge vorhanden.</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}