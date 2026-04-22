'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RoleGuard from '../components/RoleGuard'

type Benachrichtigung = {
  id: string
  typ: string
  titel: string
  nachricht: string | null
  status: string | null
  bezug_typ: string | null
  bezug_id: string | null
  created_at: string
}

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  faellig_am: string | null
  offener_betrag: number | null
  mahnstufe: number | null
}

type Lagerartikel = {
  id: string
  name: string
  bestand: number | null
  mindestbestand: number | null
}

type Termin = {
  id: string
  titel: string
  konflikt: boolean | null
  startzeit: string
}

function BenachrichtigungenPageContent() {
  const [benachrichtigungen, setBenachrichtigungen] = useState<Benachrichtigung[]>([])
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const [benRes, rechRes, lagRes, terRes] = await Promise.all([
      supabase.from('benachrichtigungen').select('*').order('created_at', { ascending: false }),
      supabase.from('rechnungen').select('id, rechnungsnummer, faellig_am, offener_betrag, mahnstufe'),
      supabase.from('lagerartikel').select('id, name, bestand, mindestbestand'),
      supabase.from('serviceauftrag_termine').select('id, titel, konflikt, startzeit'),
    ])

    const error = benRes.error || rechRes.error || lagRes.error || terRes.error

    if (error) {
      setFehler(error.message)
      return
    }

    setBenachrichtigungen(benRes.data || [])
    setRechnungen(rechRes.data || [])
    setLagerartikel(lagRes.data || [])
    setTermine(terRes.data || [])
  }

  useEffect(() => {
    ladeAlles()
  }, [])

  const warnungen = useMemo(() => {
    const liste: {
      typ: string
      titel: string
      nachricht: string
      bezug_typ: string
      bezug_id: string
    }[] = []

    const heute = new Date(new Date().toISOString().slice(0, 10))

    for (const r of rechnungen) {
      if (Number(r.offener_betrag || 0) > 0 && r.faellig_am) {
        const faellig = new Date(r.faellig_am)
        if (faellig < heute) {
          liste.push({
            typ: 'rechnung',
            titel: 'Überfällige Rechnung',
            nachricht: `${r.rechnungsnummer || r.id} ist überfällig. Offen: ${Number(r.offener_betrag || 0).toFixed(2)} €`,
            bezug_typ: 'rechnung',
            bezug_id: r.id,
          })
        }
      }
    }

    for (const a of lagerartikel) {
      if (Number(a.bestand || 0) <= Number(a.mindestbestand || 0)) {
        liste.push({
          typ: 'lager',
          titel: 'Mindestbestand erreicht',
          nachricht: `${a.name}: Bestand ${Number(a.bestand || 0).toFixed(2)} / Mindestbestand ${Number(a.mindestbestand || 0).toFixed(2)}`,
          bezug_typ: 'lagerartikel',
          bezug_id: a.id,
        })
      }
    }

    for (const t of termine) {
      if (t.konflikt) {
        liste.push({
          typ: 'termin',
          titel: 'Termin-Konflikt',
          nachricht: `${t.titel} am ${new Date(t.startzeit).toLocaleString()} hat einen Konflikt`,
          bezug_typ: 'termin',
          bezug_id: t.id,
        })
      }
    }

    return liste
  }, [rechnungen, lagerartikel, termine])

  async function warnungenUebernehmen() {
    for (const w of warnungen) {
      const bereitsVorhanden = benachrichtigungen.some(
        (b) =>
          b.typ === w.typ &&
          b.titel === w.titel &&
          b.bezug_typ === w.bezug_typ &&
          b.bezug_id === w.bezug_id &&
          b.status === 'offen'
      )

      if (!bereitsVorhanden) {
        await supabase.from('benachrichtigungen').insert({
          typ: w.typ,
          titel: w.titel,
          nachricht: w.nachricht,
          status: 'offen',
          bezug_typ: w.bezug_typ,
          bezug_id: w.bezug_id,
        })
      }
    }

    ladeAlles()
  }

  async function alsErledigt(id: string) {
    const { error } = await supabase
      .from('benachrichtigungen')
      .update({ status: 'erledigt' })
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  async function loeschen(id: string) {
    const { error } = await supabase
      .from('benachrichtigungen')
      .delete()
      .eq('id', id)

    if (error) {
      setFehler(error.message)
      return
    }

    ladeAlles()
  }

  return (
    <div className="page-card">
      <h1>Benachrichtigungen</h1>

      <div className="list-box" style={{ marginBottom: 20 }}>
        <strong>Automatische Warnungen</strong>
        <br />
        Aktuell erkannt: {warnungen.length}
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={warnungenUebernehmen}>
            Warnungen übernehmen
          </button>
        </div>
      </div>

      <div>
        {benachrichtigungen.map((b) => (
          <div key={b.id} className="list-box">
            <strong>{b.titel}</strong>
            <br />
            Typ: {b.typ}
            <br />
            Nachricht: {b.nachricht || '-'}
            <br />
            Status: {b.status || '-'}
            <br />
            Erstellt: {new Date(b.created_at).toLocaleString()}
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => alsErledigt(b.id)}>
                Als erledigt markieren
              </button>
              <button type="button" onClick={() => loeschen(b.id)} style={{ background: '#dc2626' }}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      {fehler && <div className="error-box">Fehler: {fehler}</div>}
    </div>
  )
}

export default function BenachrichtigungenPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Buchhaltung', 'Werkstatt', 'Serviceannahme', 'Lager']}>
      <BenachrichtigungenPageContent />
    </RoleGuard>
  )
}