'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fehler, setFehler] = useState('')
  const [laedt, setLaedt] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setLaedt(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLaedt(false)

    if (error) {
      setFehler(error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f6f8',
        padding: 20,
      }}
    >
      <div className="page-card" style={{ width: 420 }}>
        <h1>Login</h1>

        <form onSubmit={login}>
          <div className="form-row" style={{ flexDirection: 'column' }}>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" disabled={laedt}>
              {laedt ? 'Anmeldung läuft...' : 'Einloggen'}
            </button>
          </div>
        </form>

        {fehler && <div className="error-box">Fehler: {fehler}</div>}
      </div>
    </div>
  )
}