'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Modus = {
  id: string
  aktiv: boolean
}

type StatusBoxProps = {
  titel: string
  status: 'ok' | 'wartung' | 'lockdown' | 'fehler'
  label: string
}

function StatusBox({ titel, status, label }: StatusBoxProps) {
  const farben = {
    ok: {
      background: 'rgba(22, 163, 74, 0.18)',
      border: 'rgba(22, 163, 74, 0.65)',
      color: '#bbf7d0',
      badge: '#16a34a',
    },
    wartung: {
      background: 'rgba(245, 158, 11, 0.18)',
      border: 'rgba(245, 158, 11, 0.75)',
      color: '#fde68a',
      badge: '#f59e0b',
    },
    lockdown: {
      background: 'rgba(220, 38, 38, 0.2)',
      border: 'rgba(220, 38, 38, 0.8)',
      color: '#fecaca',
      badge: '#dc2626',
    },
    fehler: {
      background: 'rgba(127, 29, 29, 0.35)',
      border: 'rgba(127, 29, 29, 0.95)',
      color: '#fecaca',
      badge: '#7f1d1d',
    },
  }

  const f = farben[status]

  return (
    <div
      style={{
        padding: 18,
        borderRadius: 18,
        background: f.background,
        border: `1px solid ${f.border}`,
        boxShadow: `0 0 22px ${f.background}`,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: 18,
          color: '#e5e7eb',
          marginBottom: 12,
        }}
      >
        {titel}
      </div>

      <span
        style={{
          display: 'inline-block',
          padding: '7px 12px',
          borderRadius: 999,
          background: f.badge,
          color: status === 'wartung' ? '#111827' : 'white',
          fontWeight: 1000,
          fontSize: 13,
          border: `1px solid ${f.border}`,
        }}
      >
        {label}
      </span>
    </div>
  )
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <StatusBox
          titel="Datenbank"
          status={dbOk ? 'ok' : 'fehler'}
          label={dbOk ? 'OK' : 'FEHLER'}
        />

        <StatusBox
          titel="Storage"
          status={storageOk ? 'ok' : 'fehler'}
          label={storageOk ? 'OK' : 'FEHLER'}
        />

        <StatusBox
          titel="Lockdown"
          status={lockdown?.aktiv ? 'lockdown' : 'ok'}
          label={lockdown?.aktiv ? 'AKTIV' : 'OK'}
        />

        <StatusBox
          titel="Wartung"
          status={wartung?.aktiv ? 'wartung' : 'ok'}
          label={wartung?.aktiv ? 'AKTIV' : 'OK'}
        />

        <div
          style={{
            padding: 18,
            borderRadius: 18,
            background: 'rgba(31, 41, 55, 0.7)',
            border: '1px solid rgba(75, 85, 99, 0.7)',
          }}
        >
          <div
            style={{
              fontWeight: 900,
              fontSize: 18,
              color: '#e5e7eb',
              marginBottom: 12,
            }}
          >
            Logeinträge
          </div>

          <strong
            style={{
              fontSize: 24,
              color: '#f59e0b',
            }}
          >
            {logs}
          </strong>
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

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Farblegende</h2>

        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <strong style={{ color: '#22c55e' }}>Grün:</strong> OK / System läuft normal
          </div>
          <div>
            <strong style={{ color: '#f59e0b' }}>Orange:</strong> Wartungsmodus aktiv
          </div>
          <div>
            <strong style={{ color: '#ef4444' }}>Rot:</strong> Lockdown aktiv
          </div>
          <div>
            <strong style={{ color: '#7f1d1d' }}>Dunkelrot:</strong> Fehler / Dienst nicht erreichbar
          </div>
        </div>
      </div>

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}