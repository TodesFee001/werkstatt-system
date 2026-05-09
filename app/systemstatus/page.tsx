'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'
import StatusBadge from '../components/StatusBadge'

type Modus = {
  id: string
  aktiv: boolean
}

export default function SystemstatusPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister']}>
      <SystemstatusContent />
    </RoleGuard>
  )
}

function SystemstatusContent() {
  const [dbOk, setDbOk] = useState(false)
  const [storageOk, setStorageOk] = useState(false)
  const [lockdown, setLockdown] = useState<Modus | null>(null)
  const [wartung, setWartung] = useState<Modus | null>(null)
  const [logs, setLogs] = useState<number>(0)
  const [fehler, setFehler] = useState('')

  async function pruefen() {
    setFehler('')

    const dbRes = await supabase.from('benutzerprofile').select('id').limit(1)
    setDbOk(!dbRes.error)

    const storageRes = await supabase.storage.listBuckets()
    setStorageOk(!storageRes.error)

    const modusRes = await supabase
      .from('system_modus')
      .select('*')
      .in('id', ['lockdown', 'wartung'])

    if (!modusRes.error) {
      const rows = (modusRes.data || []) as Modus[]
      setLockdown(rows.find((r) => r.id === 'lockdown') || null)
      setWartung(rows.find((r) => r.id === 'wartung') || null)
    }

    const logRes = await supabase
      .from('aktivitaetslog')
      .select('id', { count: 'exact', head: true })

    if (!logRes.error) {
      setLogs(logRes.count || 0)
    }

    if (dbRes.error || storageRes.error) {
      setFehler(dbRes.error?.message || storageRes.error?.message || '')
    }
  }

  useEffect(() => {
    pruefen()
  }, [])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Systemstatus</h1>
          <div className="topbar-subtitle">
            Technischer Health-Monitor für Datenbank, Storage, Logs und Systemmodi.
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-pill">
          Datenbank
          <strong>
            <StatusBadge status={dbOk ? 'fertig' : 'kritisch'} />
          </strong>
        </div>

        <div className="kpi-pill">
          Storage
          <strong>
            <StatusBadge status={storageOk ? 'fertig' : 'kritisch'} />
          </strong>
        </div>

        <div className="kpi-pill">
          Lockdown
          <strong>
            <StatusBadge status={lockdown?.aktiv ? 'kritisch' : 'fertig'} />
          </strong>
        </div>

        <div className="kpi-pill">
          Wartung
          <strong>
            <StatusBadge status={wartung?.aktiv ? 'wartet' : 'fertig'} />
          </strong>
        </div>

        <div className="kpi-pill">
          Logeinträge
          <strong>{logs}</strong>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Systemprüfung</h2>
        <p>
          Diese Seite zeigt dir sofort, ob grundlegende Dienste erreichbar sind.
        </p>

        <div className="action-row">
          <button type="button" onClick={pruefen}>
            Neu prüfen
          </button>
        </div>
      </div>

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}