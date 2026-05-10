'use client'

import { ReactNode } from 'react'

export default function SessionGuard({ children }: { children: ReactNode }) {
  return <>{children}</>
}