'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '@/components/RoleGuard'

type Rang = {
  id: string
  name: string
}

type Qualifikation = {
  id: string
  name: string
}

function EinstellungenPageContent() {
  const [raenge, setRaenge] = useState<Rang[]>([])
  const [qualifikationen, setQualifikationen] = useState<Qualifikation[]>([])

  const [rangName, setRangName] = useState('')
  const [qualiName, setQualiName] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: r } = await supabase.from('raenge').select('*')
    const { data: q } = await supabase.from('qualifikationen').select('*')

    setRaenge(r || [])
    setQualifikationen(q || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  async function rangAnlegen(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase.from('raenge').insert({
      name: rangName,
    })

    if (error) return setFehler(error.message)

    setRangName('')
    ladeAlles()
  }

  async function qualiAnlegen(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase.from('qualifikationen').insert({
      name: qualiName,
    })

    if (error) return setFehler(error.message)

    setQualiName('')
    ladeAlles()
  }

  return (
    <div className="page-card">
      <h1>Einstellungen</h1>

      <h2>Ränge</h2>
      <form onSubmit={rangAnlegen} className="form-row">
        <input
          placeholder="Rang (z.B. Meister)"
          value={rangName}
          onChange={(e) => setRangName(e.target.value)}
        />
        <button>Hinzufügen</button>
      </form>

      {raenge.map((r) => (
        <div key={r.id} className="list-box">
          {r.name}
        </div>
      ))}

      <h2 style={{ marginTop: 40 }}>Qualifikationen</h2>
      <form onSubmit={qualiAnlegen} className="form-row">
        <input
          placeholder="Qualifikation (z.B. TÜV)"
          value={qualiName}
          onChange={(e) => setQualiName(e.target.value)}
        />
        <button>Hinzufügen</button>
      </form>

      {qualifikationen.map((q) => (
        <div key={q.id} className="list-box">
          {q.name}
        </div>
      ))}

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}

export default function EinstellungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <EinstellungenPageContent />
    </RoleGuard>
  )
}