'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function PasswordChangeGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [bereit, setBereit] = useState(false)

  useEffect(() => {
    if (pathname === '/login') {
      setBereit(true)
      return
    }

    const muss = localStorage.getItem('werkstatt_muss_passwort_aendern')

    if (muss === 'true' && pathname !== '/mein-konto') {
      router.push('/mein-konto')
      return
    }

    setBereit(true)
  }, [pathname, router])

  if (!bereit) return null

  return <>{children}</>
}