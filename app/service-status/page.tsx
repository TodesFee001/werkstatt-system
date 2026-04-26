'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Serviceauftrag = {
  id: string
  status: string | null
  freigabe_status: string | null
  fertigstellungsdatum: string | null
  art: string | null
}

function ServiceStatusPageContent() {
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeAuftraege() {
    const { data, error } = await supabase
      .from('serviceauftraege')
      .select('id, status, freigabe_status, fertigstellungsdatum, art')

    if (error) {
      setFehler(error.message)
      return
    }

    setServiceauftraege(data || [])
  }

  useEffect(() => {
    ladeAuftraege()
  }, [])

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of serviceauftraege) {
      const key = a.status || 'unbekannt'
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [serviceauftraege])

  const freigabeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of serviceauftraege) {
      const key = a.freigabe_status || 'unbekannt'
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [serviceauftraege])

  const heuteFertig = useMemo(() => {
    const heute = new Date().toISOString().slice(0, 10)
    return serviceauftraege.filter((a) => a.fertigstellungsdatum === heute).length
  }, [serviceauftraege])

  return (
    <div className="page-card">
      <h1>Serviceauftrag-Status</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="list-box">
          <strong>Gesamt</strong>
          <br />
          {serviceauftraege.length}
        </div>

        <div className="list-box">
          <strong>Heute fertig</strong>
          <br />
          {heuteFertig}
        </div>
      </div>

      <h2>Status</h2>
      <div>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="list-box">
            <strong>{status}</strong>
            <br />
            {count}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 24 }}>Freigabe-Status</h2>
      <div>
        {Object.entries(freigabeCounts).map(([status, count]) => (
          <div key={status} className="list-box">
            <strong>{status}</strong>
            <br />
            {count}
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function ServiceStatusPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme']}>
      <ServiceStatusPageContent />
    </RoleGuard>
  )
}