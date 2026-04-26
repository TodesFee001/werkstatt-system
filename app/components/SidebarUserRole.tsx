'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Benutzerprofil = {
  id: string
  rolle: string | null
  aktiv: boolean | null
  benutzername: string | null
}

export default function SidebarUserRole() {
  const [profil, setProfil] = useState<Benutzerprofil | null>(null)

  useEffect(() => {
    async function laden() {
      const sessionRes = await supabase.auth.getSession()
      const userId = sessionRes.data.session?.user?.id

      if (!userId) {
        setProfil(null)
        return
      }

      const { data } = await supabase
        .from('benutzerprofile')
        .select('id, rolle, aktiv, benutzername')
        .eq('id', userId)
        .maybeSingle()

      setProfil((data as Benutzerprofil | null) || null)
    }

    laden()
  }, [])

  return (
    <div className="sidebar-user-card">
      <div className="sidebar-user-label">Angemeldeter Zugang</div>
      <div className="sidebar-user-name">{profil?.benutzername || 'Unbekannt'}</div>
      <div className="sidebar-user-role-row">
        <span className="sidebar-user-role">{profil?.rolle || 'Unbekannt'}</span>
        <span className={`sidebar-user-status ${profil?.aktiv === false ? 'off' : 'on'}`}>
          {profil?.aktiv === false ? 'Inaktiv' : 'Aktiv'}
        </span>
      </div>
    </div>
  )
}