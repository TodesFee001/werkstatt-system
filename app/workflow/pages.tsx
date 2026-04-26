'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type WorkflowLog = {
  id: string
  bereich: string
  bezug_id: string | null
  aktion: string
  details: string | null
  created_at: string
}

export default function WorkflowPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung']}>
      <WorkflowPageContent />
    </RoleGuard>
  )
}

function WorkflowPageContent() {
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeLogs() {
    const { data, error } = await supabase
      .from('workflow_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setLogs(data || [])
  }

  useEffect(() => {
    ladeLogs()
  }, [])

  return (
    <div className="page-card">
      <h1>Workflow-Log</h1>

      {logs.map((log) => (
        <div key={log.id} className="list-box">
          <strong>{log.aktion}</strong>
          <br />
          Bereich: {log.bereich}
          <br />
          Bezug: {log.bezug_id || '-'}
          <br />
          Details: {log.details || '-'}
          <br />
          Zeit: {new Date(log.created_at).toLocaleString()}
        </div>
      ))}

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}