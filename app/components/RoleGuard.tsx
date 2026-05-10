'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  children: ReactNode
  allowedRoles: string[]
}

export default function RoleGuard({ children, allowedRoles }: Props) {
  const router = useRouter()
  const [bereit, setBereit] = useState(false)
  const [erlaubt, setErlaubt] = useState(false)

  useEffect(() => {
    const benutzerId = localStorage.getItem('werkstatt_benutzer_id')
    const rolle = localStorage.getItem('werkstatt_rolle')
    const aktiv = localStorage.getItem('werkstatt_aktiv')

    if (!benutzerId) {
      router.push('/login')
      return
    }

    if (aktiv === 'false') {
      localStorage.clear()
      router.push('/login')
      return
    }

    if (!rolle || !allowedRoles.includes(rolle)) {
      setErlaubt(false)
      setBereit(true)
      return
    }

    setErlaubt(true)
    setBereit(true)
  }, [allowedRoles, router])

  if (!bereit) return null

  if (!erlaubt) {
    return (
      <div className="page-card">
        <h1>Zugriff verweigert</h1>
        <p>Deine Rolle hat keine Berechtigung für diese Seite.</p>
      </div>
    )
  }

  return <>{children}</>
}