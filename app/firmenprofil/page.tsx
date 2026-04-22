'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Firmenprofil = {
  id: string
  name: string
  strasse: string | null
  plz: string | null
  ort: string | null
  land: string | null
  telefon: string | null
  email: string | null
  website: string | null
  ust_id: string | null
  steuernummer: string | null
  iban: string | null
  bic: string | null
  bankname: string | null
}

function FirmenprofilPageContent() {
  const [profil, setProfil] = useState<Firmenprofil | null>(null)

  const [name, setName] = useState('')
  const [strasse, setStrasse] = useState('')
  const [plz, setPlz] = useState('')
  const [ort, setOrt] = useState('')
  const [land, setLand] = useState('Deutschland')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [ustId, setUstId] = useState('')
  const [steuernummer, setSteuernummer] = useState('')
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [bankname, setBankname] = useState('')

  const [fehler, setFehler] = useState('')

  async function ladeProfil() {
    const { data, error } = await supabase
      .from('firmenprofil')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      setFehler(error.message)
      return
    }

    setProfil(data || null)

    if (data) {
      setName(data.name || '')
      setStrasse(data.strasse || '')
      setPlz(data.plz || '')
      setOrt(data.ort || '')
      setLand(data.land || 'Deutschland')
      setTelefon(data.telefon || '')
      setEmail(data.email || '')
      setWebsite(data.website || '')
      setUstId(data.ust_id || '')
      setSteuernummer(data.steuernummer || '')
      setIban(data.iban || '')
      setBic(data.bic || '')
      setBankname(data.bankname || '')
    }
  }

  useEffect(() => {
    ladeProfil()
  }, [])

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (!name.trim()) {
      setFehler('Bitte Firmennamen eingeben.')
      return
    }

    if (profil) {
      const { error } = await supabase
        .from('firmenprofil')
        .update({
          name: name.trim(),
          strasse: strasse || null,
          plz: plz || null,
          ort: ort || null,
          land: land || null,
          telefon: telefon || null,
          email: email || null,
          website: website || null,
          ust_id: ustId || null,
          steuernummer: steuernummer || null,
          iban: iban || null,
          bic: bic || null,
          bankname: bankname || null,
        })
        .eq('id', profil.id)

      if (error) {
        setFehler(error.message)
        return
      }
    } else {
      const { error } = await supabase.from('firmenprofil').insert({
        name: name.trim(),
        strasse: strasse || null,
        plz: plz || null,
        ort: ort || null,
        land: land || null,
        telefon: telefon || null,
        email: email || null,
        website: website || null,
        ust_id: ustId || null,
        steuernummer: steuernummer || null,
        iban: iban || null,
        bic: bic || null,
        bankname: bankname || null,
      })

      if (error) {
        setFehler(error.message)
        return
      }
    }

    ladeProfil()
  }

  return (
    <div className="page-card">
      <h1>Firmenprofil</h1>

      <form onSubmit={speichern}>
        <div className="form-row">
          <input placeholder="Firmenname" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Straße" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
          <input placeholder="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} />
          <input placeholder="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
          <input placeholder="Land" value={land} onChange={(e) => setLand(e.target.value)} />
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          <input placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <input placeholder="USt-ID" value={ustId} onChange={(e) => setUstId(e.target.value)} />
          <input placeholder="Steuernummer" value={steuernummer} onChange={(e) => setSteuernummer(e.target.value)} />
          <input placeholder="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
          <input placeholder="BIC" value={bic} onChange={(e) => setBic(e.target.value)} />
          <input placeholder="Bankname" value={bankname} onChange={(e) => setBankname(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Firmenprofil speichern</button>
        </div>
      </form>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function FirmenprofilPage() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <FirmenprofilPageContent />
    </RoleGuard>
  )
}