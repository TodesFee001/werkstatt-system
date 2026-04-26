'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Angebot = {
  id: string
  angebotsnummer: string | null
  kunde_id: string | null
  serviceauftrag_id: string | null
  angebotsdatum: string | null
  status: string | null
  netto_summe: number | null
  steuer_summe: number | null
  brutto_summe: number | null
  gueltig_bis: string | null
  bemerkung: string | null
}

type Firmenprofil = {
  name: string
  strasse: string | null
  plz: string | null
  ort: string | null
  land: string | null
  telefon: string | null
  email: string | null
  website: string | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  land: string | null
}

export default function AngebotDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [angebot, setAngebot] = useState<Angebot | null>(null)
  const [profil, setProfil] = useState<Firmenprofil | null>(null)
  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: angebotData, error: angebotError } = await supabase
      .from('angebote')
      .select('*')
      .eq('id', id)
      .single()

    if (angebotError || !angebotData) {
      setFehler(angebotError?.message || 'Angebot nicht gefunden')
      return
    }

    setAngebot(angebotData)

    const [profilRes, kundeRes] = await Promise.all([
      supabase.from('firmenprofil').select('*').limit(1).maybeSingle(),
      angebotData.kunde_id
        ? supabase.from('kunden').select('*').eq('id', angebotData.kunde_id).single()
        : Promise.resolve({ data: null, error: null } as any),
    ])

    if (profilRes.error || kundeRes.error) {
      setFehler(profilRes.error?.message || kundeRes.error?.message || 'Fehler')
      return
    }

    setProfil(profilRes.data || null)
    setKunde(kundeRes.data || null)
  }

  useEffect(() => {
    ladeAlles()
  }, [id])

  return (
    <div
      style={{
        background: '#f3f4f6',
        minHeight: '100vh',
        padding: 24,
      }}
    >
      <style>{`
        @media print {
          button { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          background: 'white',
          padding: 40,
          color: '#111827',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          borderRadius: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{profil?.name || 'Werkstatt'}</div>
            <div style={{ marginTop: 10, lineHeight: 1.5, color: '#4b5563' }}>
              {profil?.strasse || ''}
              <br />
              {[profil?.plz, profil?.ort].filter(Boolean).join(' ')}
              <br />
              {profil?.land || ''}
              <br />
              {profil?.telefon || ''}
              <br />
              {profil?.email || ''}
              <br />
              {profil?.website || ''}
            </div>
          </div>

          <div>
            <button onClick={() => window.print()}>Drucken / als PDF speichern</button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: 18,
              whiteSpace: 'pre-line',
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>KUNDE</div>
            <strong>
              {kunde
                ? [
                    kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim(),
                    kunde.strasse,
                    [kunde.plz, kunde.ort].filter(Boolean).join(' '),
                    kunde.land,
                  ]
                    .filter(Boolean)
                    .join('\n')
                : '-'}
            </strong>
          </div>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>ANGEBOTSDATEN</div>
            <div><strong>Angebotsnummer:</strong> {angebot?.angebotsnummer || angebot?.id || '-'}</div>
            <div><strong>Angebotsdatum:</strong> {angebot?.angebotsdatum || '-'}</div>
            <div><strong>Gültig bis:</strong> {angebot?.gueltig_bis || '-'}</div>
            <div><strong>Status:</strong> {angebot?.status || '-'}</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Angebot</div>
          <div style={{ color: '#4b5563', lineHeight: 1.6 }}>
            {angebot?.bemerkung || 'Kein weiterer Bemerkungstext vorhanden.'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 30,
          }}
        >
          <div
            style={{
              minWidth: 320,
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: 18,
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Netto</span>
              <strong>{Number(angebot?.netto_summe || 0).toFixed(2)} €</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Steuer</span>
              <strong>{Number(angebot?.steuer_summe || 0).toFixed(2)} €</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 10,
                marginTop: 10,
                borderTop: '1px solid #d1d5db',
                fontSize: 20,
              }}
            >
              <span><strong>Brutto</strong></span>
              <strong>{Number(angebot?.brutto_summe || 0).toFixed(2)} €</strong>
            </div>
          </div>
        </div>

        {fehler && (
          <div style={{ marginTop: 20, color: 'red' }}>
            Fehler: {fehler}
          </div>
        )}
      </div>
    </div>
  )
}