'use client'

import { useEffect, useMemo, useState } from 'react'
import RoleGuard from '../components/RoleGuard'
import { supabase } from '@/lib/supabase'

type Anhang = {
  id: string
  erstellt_am: string | null
  bereich: string
  datensatz_id: string
  dateiname: string
  public_url: string | null
  hochgeladen_von_name: string | null
  bemerkung: string | null
}

export default function DokumentePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Behördenvertreter']}>
      <DokumentePageContent />
    </RoleGuard>
  )
}

function DokumentePageContent() {
  const [dokumente, setDokumente] = useState<Anhang[]>([])
  const [suche, setSuche] = useState('')
  const [bereich, setBereich] = useState('alle')
  const [fehler, setFehler] = useState('')

  async function laden() {
    const { data, error } = await supabase
      .from('anhaenge')
      .select('*')
      .order('erstellt_am', { ascending: false })

    if (error) {
      setFehler(error.message)
      return
    }

    setDokumente((data || []) as Anhang[])
  }

  useEffect(() => {
    laden()
  }, [])

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()

    return dokumente.filter((d) => {
      if (bereich !== 'alle' && d.bereich !== bereich) return false
      if (!q) return true

      return [
        d.dateiname,
        d.bereich,
        d.datensatz_id,
        d.hochgeladen_von_name,
        d.bemerkung,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [dokumente, suche, bereich])

  return (
    <div className="page-card">
      <h1>Dokumentenmodul</h1>
      <p>Gesamtübersicht aller hochgeladenen Dateien und Dokumente im System.</p>

      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          placeholder="Dokumente durchsuchen"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
        <select value={bereich} onChange={(e) => setBereich(e.target.value)}>
          <option value="alle">Alle Bereiche</option>
          <option value="kunde">Kunde</option>
          <option value="fahrzeug">Fahrzeug</option>
          <option value="serviceauftrag">Serviceauftrag</option>
          <option value="rechnung">Rechnung</option>
        </select>
      </div>

      {gefiltert.map((d) => (
        <div key={d.id} className="list-box">
          <strong>{d.dateiname}</strong>
          <br />
          Bereich: {d.bereich}
          <br />
          Datensatz: {d.datensatz_id}
          <br />
          Hochgeladen: {d.erstellt_am ? new Date(d.erstellt_am).toLocaleString('de-DE') : '-'}
          <br />
          Von: {d.hochgeladen_von_name || '-'}
          <br />
          Bemerkung: {d.bemerkung || '-'}
          <div className="action-row" style={{ marginTop: 10 }}>
            {d.public_url && (
              <a
                href={d.public_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Öffnen
              </a>
            )}
          </div>
        </div>
      ))}

      {gefiltert.length === 0 && <div className="muted">Keine Dokumente vorhanden.</div>}
      {fehler && <div className="error-box">{fehler}</div>}
    </div>
  )
}