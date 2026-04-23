import './globals.css'
import { ReactNode } from 'react'
import AppShell from './components/AppShell'

export const metadata = {
  title: 'Werkstatt CRM',
  description: 'Werkstattverwaltung',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}