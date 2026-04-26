'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hatRolle, AppRole } from '@/lib/roles'

type RoleGuardProps = {
  allowedRoles: AppRole[]
  children: ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')
  const [debugText, setDebugText] = useState('')

  useEffect(() => {
    async function pruefen() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        setDebugText(`Session-Fehler: ${sessionError.message}`)
        setStatus('denied')
        router.push('/login')
        return
      }

      if (!session?.user) {
        setDebugText('Kein eingeloggter Benutzer gefunden')
        setStatus('denied')
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('benutzerprofile')
        .select('rolle, aktiv')
        .eq('id', session.user.id)
        .single()

      if (error || !data) {
        setDebugText(error?.message || 'Kein Benutzerprofil gefunden')
        setStatus('denied')
        router.push('/kein-zugriff')
        return
      }

      if (!data.aktiv) {
        setDebugText('Benutzer ist deaktiviert')
        setStatus('denied')
        router.push('/kein-zugriff')
        return
      }

      if (!hatRolle(data.rolle, allowedRoles)) {
        setDebugText(`Rolle "${data.rolle}" ist nicht erlaubt`)
        setStatus('denied')
        router.push('/kein-zugriff')
        return
      }

      setStatus('allowed')
    }

    pruefen()
  }, [allowedRoles, router])

  if (status === 'loading') {
    return <div className="page-card">Prüfe Zugriff…</div>
  }

  if (status === 'denied') {
    return (
      <div className="page-card">
        Kein Zugriff…
        {debugText ? (
          <div style={{ marginTop: 10, fontSize: 14, color: '#991b1b' }}>
            {debugText}
          </div>
        ) : null}
      </div>
    )
  }

  return <>{children}</>
}