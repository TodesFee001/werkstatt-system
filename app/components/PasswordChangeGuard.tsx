'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function PasswordChangeGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [geprueft, setGeprueft] = useState(false)

  useEffect(() => {
    const istLogin = pathname === '/login'
    const istMeinKonto = pathname === '/mein-konto'

    if (istLogin) {
      setGeprueft(true)
      return
    }

    const benutzerId = localStorage.getItem('werkstatt_benutzer_id')
    const aktiv = localStorage.getItem('werkstatt_aktiv')
    const mussPasswortAendern = localStorage.getItem('werkstatt_muss_passwort_aendern')

    if (!benutzerId) {
      router.push('/login')
      return
    }

    if (aktiv === 'false') {
      localStorage.clear()
      router.push('/login')
      return
    }

    if (mussPasswortAendern === 'true' && !istMeinKonto) {
      router.push('/mein-konto')
      return
    }

    setGeprueft(true)
  }, [pathname, router])

  if (!geprueft) {
    return null
  }

  return <>{children}</>
}