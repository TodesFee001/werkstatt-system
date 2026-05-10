'use client'

import { useEffect, useState } from 'react'

export default function SidebarUserRole() {
  const [benutzername, setBenutzername] = useState('Unbekannt')
  const [rolle, setRolle] = useState('Unbekannt')

  useEffect(() => {
    function laden() {
      setBenutzername(localStorage.getItem('werkstatt_benutzername') || 'Unbekannt')
      setRolle(localStorage.getItem('werkstatt_rolle') || 'Unbekannt')
    }

    laden()

    window.addEventListener('storage', laden)
    window.addEventListener('focus', laden)

    return () => {
      window.removeEventListener('storage', laden)
      window.removeEventListener('focus', laden)
    }
  }, [])

  return (
    <div className="sidebar-user-card">
      <div className="sidebar-user-label">Angemeldeter Zugang</div>
      <div className="sidebar-user-name">{benutzername}</div>
      <div className="sidebar-user-role">{rolle}</div>
    </div>
  )
}