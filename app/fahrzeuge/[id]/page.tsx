'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import RoleGuard from '../../components/RoleGuard'
import AttachmentManager from '../../components/AttachmentManager'
import { supabase } from '@/lib/supabase'

type Fahrzeug = {
  id: string
  kunde_id: string | null
  kennzeichen: string | null
  marke: string | null
  modell: string | null
  fahrgestellnummer: string | null
  farbe: string | null
  kilometerstand: number | null
}

type Kunde = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

type Serviceauftrag = {
  id: string
  fahrzeug_id: string | null
  art: string | null
  status: string | null
  freigabe_status: string | null
}

export default function FahrzeugDetailPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Lager', 'Behördenvertreter']}>
      <FahrzeugDetailPageContent />
    </RoleGuard>
  )
}

function FahrzeugDetailPageContent() {
  const params = useParams()
  const id = String(params.id)

  const [fahrzeug, setFahrzeug] = useState<Fahrzeug | null>(null)
  const [kunde, setKunde] = useState<Kunde | null>(null)
  const [serviceauftraege, setServiceauftraege] = useState<Serviceauftrag[]>([])
  const [fehler, setFehler] = useState('')

  async function laden() {
    const fahrzeugRes = await supabase.from('fahrzeuge').select('*').eq('id', id).maybeSingle()

    if (fahrzeugRes.error) {
      setFehler(fahrzeugRes.error.message)
      return
    }

    const fahrzeugDaten = (fahrzeugRes.data as Fahrzeug | null) || null
    setFahrzeug(fahrzeugDaten)

    if (fahrzeugDaten?.kunde_id) {
      const kundeRes = await supabase.from('kunden').select('*').eq('id', fahrzeugDaten.kunde_id).maybeSingle()
      if (!kundeRes.error) {
        setKunde((kundeRes.data as Kunde | null) || null)
      }
    }

    const serviceRes = await supabase
      .from('serviceauftraege')
      .select('*')
      .eq('fahrzeug_id', id)
      .order('created_at', { ascending: false })

    if (serviceRes.error) {
      setFehler(serviceRes.error.message)
      return
    }

    setServiceauftraege((serviceRes.data || []) as Serviceauftrag[])
  }

  useEffect(() => {
    laden()
  }, [id])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Fahrzeugakte</h1>
          <div className="topbar-subtitle">
            Fahrzeugdetails, zugehörige Aufträge und fahrzeugbezogene Anhänge.
          </div>
        </div>
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Fahrzeugdaten</h2>
        {fahrzeug ? (
          <div className="list-box">
            <strong>{fahrzeug.kennzeichen || '-'}</strong>
            <br />
            Marke / Modell: {fahrzeug.marke || '-'} {fahrzeug.modell || '-'}
            <br />
            FIN: {fahrzeug.fahrgestellnummer || '-'}
            <br />
            Farbe: {fahrzeug.farbe || '-'}
            <br />
            Kilometerstand: {fahrzeug.kilometerstand ?? '-'}
            <br />
            Kunde: {kunde ? kunde.firmenname || `${kunde.vorname || ''} ${kunde.nachname || ''}`.trim() : '-'}
          </div>
        ) : (
          <div className="muted">Fahrzeug nicht gefunden.</div>
        )}
      </div>

      <div className="page-card">
        <h2 style={{ marginTop: 0 }}>Serviceaufträge</h2>
        {serviceauftraege.map((s) => (
          <div key={s.id} className="list-box">
            <strong>{s.art || '-'}</strong>
            <br />
            Status: {s.status || '-'}
            <br />
            Freigabe: {s.freigabe_status || '-'}
          </div>
        ))}
        {serviceauftraege.length === 0 && <div className="muted">Keine Serviceaufträge vorhanden.</div>}
      </div>

      <AttachmentManager
        bereich="fahrzeug"
        datensatzId={id}
        titel={fahrzeug ? `${fahrzeug.kennzeichen || '-'} ${fahrzeug.marke || ''} ${fahrzeug.modell || ''}`.trim() : 'Fahrzeugakte'}
      />

      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}