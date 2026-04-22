'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BehoerdenAuditTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastLoggedRef = useRef<string>('')

  useEffect(() => {
    async function logge() {
      const fullPath = `${pathname}${
        searchParams?.toString() ? `?${searchParams.toString()}` : ''
      }`

      if (lastLoggedRef.current === fullPath) return
      lastLoggedRef.current = fullPath

      await supabase.rpc('log_behoerden_event', {
        p_event_typ: 'page_view',
        p_pfad: fullPath,
        p_details: {
          seite: pathname,
          query: searchParams?.toString() || '',
          zeitpunkt: new Date().toISOString(),
        },
      })
    }

    logge()
  }, [pathname, searchParams])

  return null
}