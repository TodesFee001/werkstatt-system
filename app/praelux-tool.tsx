'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { drawPraeLuxOverview } from '@/lib/praelux-canvas'
import { parsePraeLuxInput, slugifyName } from '@/lib/praelux'

const placeholderText = `Basisdatenblatt und Finanzgutachten hier einfügen.

Beispielhafte Struktur:
Name:
Geburtsdatum:
Nettoeinkommen:
Monatlicher Überschuss:
Anlagehorizont:

Gesamtbeitrag Bestand monatlich:
Gesamtbeitrag empfohlenes Konzept monatlich:
Wesentliche Veränderungen:
Haftpflicht: alt -> neu, Ersparnis ...`

export default function PraeLuxTool() {
  const [sourceText, setSourceText] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const data = useMemo(() => parsePraeLuxInput(sourceText), [sourceText])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    const draw = () => drawPraeLuxOverview(canvas, data, window.devicePixelRatio > 1 ? 1.7 : 1.35)
    if ('fonts' in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled) draw()
      })
      return () => {
        cancelled = true
      }
    }
    draw()
    return undefined
  }, [data])

  function downloadPng() {
    const exportCanvas = document.createElement('canvas')
    drawPraeLuxOverview(exportCanvas, data, 2.4)
    const link = document.createElement('a')
    const name = slugifyName(data.clientName || 'mandant') || 'mandant'
    link.download = `praelux-entscheidungsuebersicht-${name}.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }

  const presentCount = data.qualityChecks.filter((check) => check.ok).length

  return (
    <main className="app-frame">
      <section className="toolbar" aria-label="PraeLux Generator">
        <div className="brand-lockup">
          <span className="brand-mark">PraeLux</span>
          <span className="anchor-mark" aria-hidden="true" />
          <span className="brand-subline">Entscheidungsübersicht</span>
        </div>
        <div className="toolbar-actions">
          <span className="status-pill">
            {presentCount}/{data.qualityChecks.length} Datenpunkte
          </span>
          <button type="button" className="secondary-action" onClick={() => setSourceText('')}>
            Leeren
          </button>
          <button type="button" className="primary-action" onClick={downloadPng}>
            PNG herunterladen
          </button>
        </div>
      </section>

      <section className="workspace">
        <div className="input-panel">
          <div className="panel-heading">
            <h1>Unterlagen</h1>
            <span>{sourceText.length.toLocaleString('de-DE')} Zeichen</span>
          </div>
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder={placeholderText}
            aria-label="Unterlagen-Text"
            spellCheck={false}
          />
        </div>

        <aside className="review-panel" aria-label="Datenprüfung">
          <div className="panel-heading">
            <h2>Datenprüfung</h2>
            <span>{data.clientName}</span>
          </div>
          <div className="quality-list">
            {data.qualityChecks.map((check) => (
              <div className={check.ok ? 'quality-item ok' : 'quality-item check'} key={check.label}>
                <span aria-hidden="true" />
                <strong>{check.label}</strong>
                <em>{check.ok ? 'erkannt' : 'prüfen'}</em>
              </div>
            ))}
          </div>

          <div className="facts-preview">
            {data.facts.map((fact) => (
              <div key={fact.label}>
                <span>{fact.label}</span>
                <strong className={fact.status === 'present' ? '' : 'missing'}>{fact.value}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="preview-panel" aria-label="PNG Vorschau">
          <div className="panel-heading">
            <h2>Vorschau</h2>
            <span>A4 Hochformat</span>
          </div>
          <div className="canvas-shell">
            <canvas ref={canvasRef} aria-label="PraeLux Entscheidungsübersicht" role="img" />
          </div>
        </section>
      </section>
    </main>
  )
}
