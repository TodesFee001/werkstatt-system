'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Rechnung = {
  id: string
  rechnungsnummer: string | null
  rechnungsadresse: string | null
  kunde_id: string | null
  serviceauftrag_id: string | null
  rechnungsdatum: string | null
  status: string | null
  brutto_summe: number | null
  netto_summe: number | null
  steuer_summe: number | null
  offener_betrag: number | null
  faellig_am: string | null
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
  ust_id: string | null
  steuernummer: string | null
  iban: string | null
  bic: string | null
  bankname: string | null
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

type Serviceauftrag = {
  id: string
  fahrzeug_id: string | null
  art: string | null
  fehlerbeschreibung: string | null
}

type Fahrzeug = {
  id: string
  kennzeichen: string | null
  marke: string | null
  modell: string | null
}

type Material = {
  id: string
  serviceauftrag_id: string
  lagerartikel_id: string
  menge: number
  einzelpreis: number | null
  gesamtpreis: number | null
}

type Arbeitszeit = {
  id: string
  serviceauftrag_id: string
  datum: string
  stunden: number
  stundensatz: number | null
  gesamtpreis: number | null
}

type Lagerartikel = {
  id: string
  name: string
}

export default function RechnungDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [rechnung, setRechnung] = useState<Rechnung | null>(null)
  const [profil, setProfil] = useState<Firmenprofil | null>(null)
  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [serviceauftrag, setServiceauftrag] = useState<Serviceauftrag | null>(null)
  const [fahrzeug, setFahrzeug] = useState<Fahrzeug | null>(null)
  const [material, setMaterial] = useState<Material[]>([])
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([])
  const [lagerartikel, setLagerartikel] = useState<Lagerartikel[]>([])
  const [fehler, setFehler] = useState('')

  async function ladeAlles() {
    const { data: rechnungData, error: rechnungError } = await supabase
      .from('rechnungen')
      .select('*')
      .eq('id', id)
      .single()

    if (rechnungError || !rechnungData) {
      setFehler(rechnungError?.message || 'Rechnung nicht gefunden')
      return
    }

    setRechnung(rechnungData)

    const [
      profilRes,
      kundenRes,
      serviceRes,
      fahrzeugeRes,
      materialRes,
      arbeitszeitRes,
      artikelRes,
    ] = await Promise.all([
      supabase.from('firmenprofil').select('*').limit(1).maybeSingle(),
      rechnungData.kunde_id
        ? supabase.from('kunden').select('*').eq('id', rechnungData.kunde_id).single()
        : Promise.resolve({ data: null, error: null } as any),
      rechnungData.serviceauftrag_id
        ? supabase.from('serviceauftraege').select('*').eq('id', rechnungData.serviceauftrag_id).single()
        : Promise.resolve({ data: null, error: null } as any),
      supabase.from('fahrzeuge').select('*'),
      rechnungData.serviceauftrag_id
        ? supabase.from('serviceauftrag_material').select('*').eq('serviceauftrag_id', rechnungData.serviceauftrag_id)
        : Promise.resolve({ data: [], error: null } as any),
      rechnungData.serviceauftrag_id
        ? supabase.from('serviceauftrag_arbeitszeiten').select('*').eq('serviceauftrag_id', rechnungData.serviceauftrag_id)
        : Promise.resolve({ data: [], error: null } as any),
      supabase.from('lagerartikel').select('id, name'),
    ])

    if (
      profilRes.error ||
      kundenRes.error ||
      serviceRes.error ||
      fahrzeugeRes.error ||
      materialRes.error ||
      arbeitszeitRes.error ||
      artikelRes.error
    ) {
      setFehler(
        profilRes.error?.message ||
          kundenRes.error?.message ||
          serviceRes.error?.message ||
          fahrzeugeRes.error?.message ||
          materialRes.error?.message ||
          arbeitszeitRes.error?.message ||
          artikelRes.error?.message ||
          'Fehler'
      )
      return
    }

    setProfil(profilRes.data || null)
    setKunde(kundenRes.data || null)
    setServiceauftrag(serviceRes.data || null)
    setMaterial(materialRes.data || [])
    setArbeitszeiten(arbeitszeitRes.data || [])
    setLagerartikel(artikelRes.data || [])

    const fahrzeugId = serviceRes.data?.fahrzeug_id
    const fahrzeugEintrag =
      (fahrzeugeRes.data || []).find((f: Fahrzeug) => f.id === fahrzeugId) || null
    setFahrzeug(fahrzeugEintrag)
  }

  useEffect(() => {
    ladeAlles()
  }, [id])

  function artikelName(lagerartikelId: string) {
    return lagerartikel.find((a) => a.id === lagerartikelId)?.name || 'Unbekannter Artikel'
  }

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
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>RECHNUNGSADRESSE</div>
            <strong>
              {rechnung?.rechnungsadresse ||
                [
                  kunde?.firmenname || `${kunde?.vorname || ''} ${kunde?.nachname || ''}`.trim(),
                  kunde?.strasse,
                  [kunde?.plz, kunde?.ort].filter(Boolean).join(' '),
                  kunde?.land,
                ]
                  .filter(Boolean)
                  .join('\n') ||
                '-'}
            </strong>
          </div>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>RECHNUNGSDATEN</div>
            <div><strong>Rechnungsnummer:</strong> {rechnung?.rechnungsnummer || rechnung?.id || '-'}</div>
            <div><strong>Rechnungsdatum:</strong> {rechnung?.rechnungsdatum || '-'}</div>
            <div><strong>Fällig am:</strong> {rechnung?.faellig_am || '-'}</div>
            <div><strong>Status:</strong> {rechnung?.status || '-'}</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Rechnung</div>
          <div style={{ color: '#4b5563', lineHeight: 1.6 }}>
            Fahrzeug:{' '}
            {fahrzeug
              ? `${fahrzeug.kennzeichen || '-'} – ${fahrzeug.marke || '-'} ${fahrzeug.modell || '-'}`
              : '-'}
            <br />
            Leistung: {serviceauftrag?.art || '-'}
            <br />
            Fehlerbeschreibung: {serviceauftrag?.fehlerbeschreibung || '-'}
          </div>
        </div>

        <div style={{ marginBottom: 26 }}>
          <h2 style={{ marginBottom: 12 }}>Material</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#eff6ff' }}>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Artikel</th>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Menge</th>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Einzelpreis</th>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {material.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                    Keine Materialpositionen vorhanden
                  </td>
                </tr>
              ) : (
                material.map((m) => (
                  <tr key={m.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{artikelName(m.lagerartikel_id)}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{m.menge}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{Number(m.einzelpreis || 0).toFixed(2)} €</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{Number(m.gesamtpreis || 0).toFixed(2)} €</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 26 }}>
          <h2 style={{ marginBottom: 12 }}>Arbeitszeit</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#eff6ff' }}>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Datum</th>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Stunden</th>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Stundensatz</th>
                <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #dbeafe' }}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {arbeitszeiten.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                    Keine Arbeitszeiten vorhanden
                  </td>
                </tr>
              ) : (
                arbeitszeiten.map((z) => (
                  <tr key={z.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{z.datum}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{z.stunden}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{Number(z.stundensatz || 0).toFixed(2)} €</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{Number(z.gesamtpreis || 0).toFixed(2)} €</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              <strong>{Number(rechnung?.netto_summe || 0).toFixed(2)} €</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Steuer</span>
              <strong>{Number(rechnung?.steuer_summe || 0).toFixed(2)} €</strong>
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
              <strong>{Number(rechnung?.brutto_summe || 0).toFixed(2)} €</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <span>Offener Betrag</span>
              <strong>{Number(rechnung?.offener_betrag || 0).toFixed(2)} €</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 36,
            paddingTop: 18,
            borderTop: '1px solid #e5e7eb',
            color: '#4b5563',
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          <strong>Bankverbindung</strong>
          <br />
          Bank: {profil?.bankname || '-'}
          <br />
          IBAN: {profil?.iban || '-'}
          <br />
          BIC: {profil?.bic || '-'}
          <br />
          USt-ID: {profil?.ust_id || '-'}
          <br />
          Steuernummer: {profil?.steuernummer || '-'}
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