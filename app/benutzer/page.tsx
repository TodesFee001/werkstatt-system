'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '@/components/RoleGuard'

type Rolle = {
  id: string
  name: string
  beschreibung: string | null
}

type Mitarbeiter = {
  id: string
  vorname: string
  nachname: string
}

type AuthUser = {
  id: string
  email?: string
}

type Benutzerprofil = {
  id: string
  mitarbeiter_id: string | null
  rolle_id: string | null
}

function BenutzerPageContent() {
  const [rollen, setRollen] = useState<Rolle[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [profile, setProfile] = useState<Benutzerprofil[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)

  const [rolleId, setRolleId] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState('')
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: rollenData, error: rollenError } = await supabase
      .from('rollen')
      .select('*')
      .order('name', { ascending: true })

    const { data: mitarbeiterData, error: mitarbeiterError } = await supabase
      .from('mitarbeiter')
      .select('id, vorname, nachname')
      .order('vorname', { ascending: true })

    const { data: profilData, error: profilError } = await supabase
      .from('benutzerprofile')
      .select('*')

    if (rollenError || mitarbeiterError || profilError) {
      setFehler(
        rollenError?.message ||
          mitarbeiterError?.message ||
          profilError?.message ||
          'Fehler'
      )
      return
    }

    setUser(user ? { id: user.id, email: user.email } : null)
    setRollen(rollenData || [])
    setMitarbeiter(mitarbeiterData || [])
    setProfile(profilData || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function profilSpeichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!user) {
      setFehler('Kein eingeloggter Benutzer gefunden.')
      return
    }

    if (!rolleId) {
      setFehler('Bitte eine Rolle auswählen.')
      return
    }

    const bestehendesProfil = profile.find((p) => p.id === user.id)

    if (bestehendesProfil) {
      const { error } = await supabase
        .from('benutzerprofile')
        .update({
          rolle_id: rolleId,
          mitarbeiter_id: mitarbeiterId || null,
        })
        .eq('id', user.id)

      if (error) {
        setFehler(error.message)
        return
      }
    } else {
      const { error } = await supabase.from('benutzerprofile').insert({
        id: user.id,
        rolle_id: rolleId,
        mitarbeiter_id: mitarbeiterId || null,
      })

      if (error) {
        setFehler(error.message)
        return
      }
    }

    ladeAlles()
  }

  function rollenName(id: string | null) {
    if (!id) return '-'
    return rollen.find((r) => r.id === id)?.name || '-'
  }

  function mitarbeiterName(id: string | null) {
    if (!id) return '-'
    const person = mitarbeiter.find((m) => m.id === id)
    return person ? `${person.vorname} ${person.nachname}` : '-'
  }

  const eigenesProfil = user ? profile.find((p) => p.id === user.id) : null

  return (
    <div className="page-card">
      <h1>Benutzer & Rollen</h1>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <strong>Aktueller Login</strong>
        <br />
        Benutzer-ID: {user?.id || '-'}
        <br />
        E-Mail: {user?.email || '-'}
        <br />
        Aktuelle Rolle: {rollenName(eigenesProfil?.rolle_id || null)}
        <br />
        Verknüpfter Mitarbeiter: {mitarbeiterName(eigenesProfil?.mitarbeiter_id || null)}
      </div>

      <form onSubmit={profilSpeichern} style={{ marginBottom: 24 }}>
        <div className="form-row">
          <select
            value={rolleId}
            onChange={(e) => setRolleId(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Rolle auswählen</option>
            {rollen.map((rolle) => (
              <option key={rolle.id} value={rolle.id}>
                {rolle.name}
              </option>
            ))}
          </select>

          <select
            value={mitarbeiterId}
            onChange={(e) => setMitarbeiterId(e.target.value)}
            style={{ minWidth: 240 }}
          >
            <option value="">Mitarbeiter verknüpfen</option>
            {mitarbeiter.map((person) => (
              <option key={person.id} value={person.id}>
                {person.vorname} {person.nachname}
              </option>
            ))}
          </select>

          <button type="submit">Benutzerprofil speichern</button>
        </div>
      </form>

      <h2>Verfügbare Rollen</h2>
      <div>
        {rollen.map((rolle) => (
          <div key={rolle.id} className="list-box">
            <strong>{rolle.name}</strong>
            <br />
            {rolle.beschreibung || '-'}
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function BenutzerPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <BenutzerPageContent />
    </RoleGuard>
  )
}