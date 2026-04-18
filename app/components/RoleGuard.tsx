'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { holeAktuelleRolle } from '@/lib/auth'

type RoleGuardProps = {
  allowedRoles: string[]
  children: ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    async function pruefen() {
      const rolle = await holeAktuelleRolle()

      if (!rolle || !allowedRoles.includes(rolle)) {
        setStatus('denied')
        router.push('/kein-zugriff')
        return
      }

      setStatus('allowed')
    }

    pruefen()
  }, [allowedRoles, router])

  if (status === 'loading') {
    return <div className="page-card">Prüfe Zugriff...</div>
  }

  if (status === 'denied') {
    return <div className="page-card">Leite weiter...</div>
  }

  return <>{children}</>
}