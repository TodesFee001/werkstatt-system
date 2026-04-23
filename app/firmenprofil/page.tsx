'use client'

import { useEffect, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Firmenprofil = {
  id: string
  firmenname: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  telefon: string | null
  email: string | null
  ust_id: string | null
  iban: string | null
  bic: string | null
  bank: string | null
}

export default function FirmenprofilPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Serviceannahme']}>
      <FirmenprofilPageContent />
    </RoleGuard>
  )
}

function FirmenprofilPageContent() {
  const [profilId, setProfilId] = useState('')
  const [firmenname, setFirmenname] = useState('')
  const [strasse, setStrasse] = useState('')
  const [plz, setPlz] = useState('')
  const [ort, setOrt] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [ustId, setUstId] = useState('')
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [bank, setBank] = useState('')
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  async function laden() {
    const { data, error } = await supabase.from('firmenprofil').select('*').limit(1).maybeSingle()

    if (error) {
      setFehler(error.message)
      return
    }

    if (!data) return

    const profil = data as Firmenprofil
    setProfilId(profil.id)
    setFirmenname(profil.firmenname || '')
    setStrasse(profil.strasse || '')
    setPlz(profil.plz || '')
    setOrt(profil.ort || '')
    setTelefon(profil.telefon || '')
    setEmail(profil.email || '')
    setUstId(profil.ust_id || '')
    setIban(profil.iban || '')
    setBic(profil.bic || '')
    setBank(profil.bank || '')
  }

  useEffect(() => {
    laden()
  }, [])

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')
    setMeldung('')

    const payload = {
      firmenname: firmenname || null,
      strasse: strasse || null,
      plz: plz || null,
      ort: ort || null,
      telefon: telefon || null,
      email: email || null,
      ust_id: ustId || null,
      iban: iban || null,
      bic: bic || null,
      bank: bank || null,
    }

    if (profilId) {
      const { error } = await supabase.from('firmenprofil').update(payload).eq('id', profilId)
      if (error) {
        setFehler(error.message)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('firmenprofil')
        .insert(payload)
        .select()
        .single()

      if (error) {
        setFehler(error.message)
        return
      }

      setProfilId(data.id)
    }

    setMeldung('Firmenprofil gespeichert.')
  }

  return (
    <div className="page-card">
      <h1>Firmenprofil</h1>

      <form onSubmit={speichern}>
        <div className="form-row">
          <input placeholder="Firmenname" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} />
          <input placeholder="Straße" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} />
          <input placeholder="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          <input placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="USt-ID" value={ustId} onChange={(e) => setUstId(e.target.value)} />
          <input placeholder="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <input placeholder="BIC" value={bic} onChange={(e) => setBic(e.target.value)} />
          <input placeholder="Bank" value={bank} onChange={(e) => setBank(e.target.value)} />
        </div>

        <div className="action-row" style={{ marginTop: 16 }}>
          <button type="submit">Firmenprofil speichern</button>
        </div>
      </form>

      {meldung && <div className="badge badge-success">{meldung}</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}