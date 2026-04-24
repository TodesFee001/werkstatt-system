'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Log = {
  id: string
  erstellt_am: string
  benutzer_name: string | null
  aktion: string
  tabelle: string
  titel: string | null
  details: any
}

export default function AktivitaetslogPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister']}>
      <Page />
    </RoleGuard>
  )
}

function Page() {
  const [logs, setLogs] = useState<Log[]>([])
  const [suche, setSuche] = useState('')

  async function laden() {
    const { data } = await supabase
      .from('aktivitaetslog')
      .select('*')
      .order('erstellt_am', { ascending: false })

    setLogs(data || [])
  }

  useEffect(() => {
    laden()
  }, [])

  const gefiltert = logs.filter((l) =>
    JSON.stringify(l).toLowerCase().includes(suche.toLowerCase())
  )

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <h1 className="topbar-title">Aktivitätslog</h1>
      </div>

      <div className="page-card">
        <input
          placeholder="Suche"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />

        {gefiltert.map((log) => (
          <div key={log.id} className="list-box">
            <strong>{log.aktion.toUpperCase()}</strong> – {log.tabelle}
            <br />
            {log.titel}
            <br />
            Benutzer: {log.benutzer_name || '-'}
            <br />
            {new Date(log.erstellt_am).toLocaleString('de-DE')}
            <pre style={{ marginTop: 10 }}>
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}