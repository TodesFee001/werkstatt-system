'use client'

import { type InputHTMLAttributes, useEffect, useMemo, useRef, useState } from 'react'
import { drawInvestmentConcept } from '@/lib/investment-concept-canvas'
import {
  buildInvestmentConcept,
  createEmptyInvestmentConceptForm,
  formatInvestmentCurrency,
  formatInvestmentPercent,
  slugifyInvestmentName,
  type InvestmentConceptForm,
} from '@/lib/investment-concept'

type InvestmentField = keyof InvestmentConceptForm

const DRAFT_STORAGE_KEY = 'praelux-investment-concept-draft-v1'

export default function InvestmentConceptTool() {
  const [form, setForm] = useState<InvestmentConceptForm>(() => createEmptyInvestmentConceptForm())
  const [isDraftReady, setIsDraftReady] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const data = useMemo(() => buildInvestmentConcept(form), [form])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY)
        if (storedDraft) {
          setForm({ ...createEmptyInvestmentConceptForm(), ...JSON.parse(storedDraft) })
          setDraftSavedAt('geladen')
        }
      } catch {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      } finally {
        setIsDraftReady(true)
      }
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isDraftReady) return undefined
    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))
      setDraftSavedAt(
        new Intl.DateTimeFormat('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      )
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [form, isDraftReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    const draw = () => drawInvestmentConcept(canvas, data, window.devicePixelRatio > 1 ? 1.65 : 1.25)
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

  function updateField(field: InvestmentField, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setForm(createEmptyInvestmentConceptForm())
    setDraftSavedAt(null)
  }

  function downloadPng() {
    const exportCanvas = document.createElement('canvas')
    drawInvestmentConcept(exportCanvas, data, 2.4)
    const link = document.createElement('a')
    const name = slugifyInvestmentName(data.clientName || 'investmentkonzept') || 'investmentkonzept'
    link.download = `praelux-investmentkonzept-${name}.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }

  return (
    <main className="app-frame">
      <section className="toolbar" aria-label="Investmentkonzept Generator">
        <div className="brand-lockup">
          <span className="brand-mark">PraeLux</span>
          <span className="anchor-mark" aria-hidden="true" />
          <span className="brand-subline">Investmentkonzept</span>
        </div>
        <div className="toolbar-actions">
          <span className="status-pill">{data.horizonYears === undefined ? 'Anlagehorizont offen' : `${data.horizonYears} Jahre`}</span>
          {draftSavedAt ? <span className="subtle-status">Entwurf gespeichert {draftSavedAt}</span> : null}
          <button type="button" className="secondary-action" onClick={resetForm}>
            Neu starten
          </button>
          <button type="button" className="primary-action" onClick={downloadPng}>
            PNG herunterladen
          </button>
        </div>
      </section>

      <section className="workspace investment-workspace">
        <section className="wizard-panel investment-panel">
          <div className="step-heading">
            <span>Investmentkonzept</span>
            <h1>Monatliche Struktur erfassen</h1>
            <p>
              Erfasse die vier Bausteine aus Depot, Altersvorsorge, Reserve/Fixkosten und Versicherungen. Die Vorschau
              erzeugt daraus die Kreisaufteilung und die Kapitalentwicklung.
            </p>
          </div>

          <div className="field-grid">
            <InvestmentTextField
              label="Mandant"
              value={form.clientName}
              onChange={(value) => updateField('clientName', value)}
              placeholder="Name optional"
            />
            <InvestmentTextField
              label="Aktuelles Alter"
              value={form.age}
              onChange={(value) => updateField('age', value)}
              inputMode="numeric"
              placeholder="z.B. 30"
            />
            <InvestmentTextField
              label="Zielalter"
              value={form.targetAge}
              onChange={(value) => updateField('targetAge', value)}
              inputMode="numeric"
              placeholder="67"
            />
            <InvestmentTextField
              label="Depot mtl."
              value={form.depotMonthly}
              onChange={(value) => updateField('depotMonthly', value)}
              inputMode="decimal"
              placeholder="z.B. 250,00 €"
            />
            <InvestmentTextField
              label="Depot Zinssatz p.a."
              value={form.depotRate}
              onChange={(value) => updateField('depotRate', value)}
              inputMode="decimal"
              placeholder="z.B. 7,00 %"
            />
            <InvestmentTextField
              label="Altersvorsorge mtl."
              value={form.retirementMonthly}
              onChange={(value) => updateField('retirementMonthly', value)}
              inputMode="decimal"
              placeholder="z.B. 150,00 €"
            />
            <InvestmentTextField
              label="Altersvorsorge Zins p.a."
              value={form.retirementRate}
              onChange={(value) => updateField('retirementRate', value)}
              inputMode="decimal"
              placeholder="z.B. 4,00 %"
            />
            <InvestmentTextField
              label="Reserve / Fixkosten mtl."
              value={form.reserveMonthly}
              onChange={(value) => updateField('reserveMonthly', value)}
              inputMode="decimal"
              placeholder="z.B. 300,00 €"
            />
            <InvestmentTextField
              label="Versicherung / Krankenkasse mtl."
              value={form.insuranceMonthly}
              onChange={(value) => updateField('insuranceMonthly', value)}
              inputMode="decimal"
              placeholder="z.B. 420,00 €"
            />
          </div>
        </section>

        <aside className="review-panel investment-summary">
          <h2>Ergebnis</h2>
          <div className="readout-grid investment-readouts">
            <InvestmentReadout label="Gesamt mtl." value={data.totalMonthlyLabel} />
            <InvestmentReadout
              label="Anlagehorizont"
              value={data.horizonYears === undefined ? 'offen' : `${data.horizonYears} Jahre`}
            />
            <InvestmentReadout label="Depot Endwert" value={formatInvestmentCurrency(data.depotFuture)} />
            <InvestmentReadout label="Altersvorsorge" value={formatInvestmentCurrency(data.retirementFuture)} />
            <InvestmentReadout label="Gesamt Endwert" value={formatInvestmentCurrency(data.totalFuture)} tone="positive" />
            <InvestmentReadout
              label="Zinssätze"
              value={`${formatInvestmentPercent(data.depotRate)} / ${formatInvestmentPercent(data.retirementRate)}`}
            />
          </div>
        </aside>

        <section className="preview-panel investment-preview">
          <div className="preview-heading">
            <span>Vorschau</span>
            <strong>A4 Hochformat</strong>
          </div>
          <div className="canvas-shell">
            <canvas ref={canvasRef} aria-label="Investmentkonzept Vorschau" />
          </div>
        </section>
      </section>
    </main>
  )
}

function InvestmentTextField({
  label,
  value,
  onChange,
  inputMode = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} placeholder={placeholder} />
    </label>
  )
}

function InvestmentReadout({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'positive'
}) {
  return (
    <div className={`readout ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
