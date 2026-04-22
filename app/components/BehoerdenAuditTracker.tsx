'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BehoerdenAuditTracker() {
  const pathname = usePathname()
  const lastLoggedRef = useRef<string>('')

  useEffect(() => {
    async function logge() {
      if (typeof window === 'undefined') return

      const fullPath = `${pathname}${window.location.search || ''}`

      if (lastLoggedRef.current === fullPath) return
      lastLoggedRef.current = fullPath

      await supabase.rpc('log_behoerden_event', {
        p_event_typ: 'page_view',
        p_pfad: fullPath,
        p_details: {
          seite: pathname,
          query: window.location.search || '',
          zeitpunkt: new Date().toISOString(),
        },
      })
    }

    logge()
  }, [pathname])

  return null
}