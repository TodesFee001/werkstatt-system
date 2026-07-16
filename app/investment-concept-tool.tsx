'use client'

import Image from 'next/image'
import { type ChangeEvent, type InputHTMLAttributes, useEffect, useMemo, useRef, useState } from 'react'
import { drawInvestmentConcept } from '@/lib/investment-concept-canvas'
import {
  buildInvestmentConcept,
  createEmptyInvestmentConceptForm,
  formatInvestmentCurrency,
  formatInvestmentPercent,
  slugifyInvestmentName,
  type InvestmentConceptForm,
} from '@/lib/investment-concept'
import { extractInvestmentConceptImport, type InvestmentImportTarget } from '@/lib/investment-concept-import'

type InvestmentField = keyof InvestmentConceptForm
type ImportState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

const DRAFT_STORAGE_KEY = 'praelux-investment-concept-draft-v1'
const importDefaults: Record<InvestmentImportTarget, string> = {
  depot: 'Depotstrategie als PDF übernehmen',
  retirement: 'ALVO-/Altersvorsorge-Strategie als PDF übernehmen',
  funds: 'Fonds-Factsheets als PDF übernehmen',
  insurance: 'BU, Versicherung oder Krankenkasse übernehmen',
}

export default function InvestmentConceptTool() {
  const [form, setForm] = useState<InvestmentConceptForm>(() => createEmptyInvestmentConceptForm())
  const [isDraftReady, setIsDraftReady] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [importStates, setImportStates] = useState<Record<InvestmentImportTarget, ImportState>>({
    depot: { status: 'idle', message: importDefaults.depot },
    retirement: { status: 'idle', message: importDefaults.retirement },
    funds: { status: 'idle', message: importDefaults.funds },
    insurance: { status: 'idle', message: importDefaults.insurance },
  })
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
    setImportStates({
      depot: { status: 'idle', message: importDefaults.depot },
      retirement: { status: 'idle', message: importDefaults.retirement },
      funds: { status: 'idle', message: importDefaults.funds },
      insurance: { status: 'idle', message: importDefaults.insurance },
    })
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

  async function handleDocumentUpload(target: InvestmentImportTarget, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (files.length === 0) return

    setImportStates((current) => ({ ...current, [target]: { status: 'loading', message: 'Datei wird gelesen' } }))

    try {
      const result = await extractInvestmentConceptImport(files, target)
      if (result.labels.length === 0) {
        setImportStates((current) => ({
          ...current,
          [target]: { status: 'error', message: 'Keine passenden Daten erkannt' },
        }))
        return
      }

      setForm((current) => mergeInvestmentImport(current, result.values))
      const successMessage =
        target === 'funds'
          ? `${result.labels.length} Factsheets übernommen`
          : `${Array.from(new Set(result.labels)).join(', ')} übernommen`
      setImportStates((current) => ({
        ...current,
        [target]: { status: 'success', message: successMessage },
      }))
    } catch {
      setImportStates((current) => ({
        ...current,
        [target]: { status: 'error', message: 'Datei konnte nicht gelesen werden' },
      }))
    }
  }

  return (
    <main className="app-frame">
      <section className="toolbar" aria-label="Investmentkonzept Generator">
        <div className="brand-lockup">
          <Image className="brand-logo" src="/praelux-logo.svg" alt="PraeLux" width={48} height={48} priority unoptimized />
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

          <div className="investment-imports">
            <InvestmentImportField
              title="Depotstrategie"
              state={importStates.depot}
              accept="application/pdf,.pdf"
              onChange={(event) => handleDocumentUpload('depot', event)}
            />
            <InvestmentImportField
              title="ALVO"
              state={importStates.retirement}
              accept="application/pdf,.pdf"
              onChange={(event) => handleDocumentUpload('retirement', event)}
            />
            <InvestmentImportField
              title="Factsheets"
              state={importStates.funds}
              accept="application/pdf,.pdf"
              multiple
              onChange={(event) => handleDocumentUpload('funds', event)}
            />
            <InvestmentImportField
              title="Versicherung / Kasse"
              state={importStates.insurance}
              accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg"
              multiple
              onChange={(event) => handleDocumentUpload('insurance', event)}
            />
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

          <div className="investment-detail-grid">
            <InvestmentTextArea
              label="Depotstrategie"
              value={form.depotStrategy}
              onChange={(value) => updateField('depotStrategy', value)}
              placeholder="wird aus Anlagestrategie Langfristig DEPOT übernommen"
            />
            <InvestmentTextArea
              label="Altersvorsorge-Strategie"
              value={form.retirementStrategy}
              onChange={(value) => updateField('retirementStrategy', value)}
              placeholder="wird aus Anlagestrategie ALVO übernommen"
            />
            <InvestmentTextArea
              label="Fonds-Factsheets"
              value={form.fundFacts}
              onChange={(value) => updateField('fundFacts', value)}
              placeholder="Factsheets werden hier zusammengefasst"
            />
            <InvestmentTextArea
              label="Versicherung / Krankenkasse"
              value={[form.insuranceConcept, form.healthConcept].filter(Boolean).join('\n')}
              onChange={(value) => {
                const [insuranceConcept = '', ...healthParts] = value.split('\n')
                updateField('insuranceConcept', insuranceConcept)
                updateField('healthConcept', healthParts.join('\n'))
              }}
              placeholder="BU und Krankenkasse werden hier zusammengefasst"
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

function InvestmentTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function InvestmentImportField({
  title,
  state,
  accept,
  multiple = false,
  onChange,
}: {
  title: string
  state: ImportState
  accept: string
  multiple?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className={`investment-import ${state.status}`}>
      <strong>{title}</strong>
      <span>{state.message}</span>
      <label className={`pdf-import-action${state.status === 'loading' ? ' disabled' : ''}`}>
        {state.status === 'loading' ? 'Liest...' : 'Importieren'}
        <input type="file" accept={accept} multiple={multiple} onChange={onChange} disabled={state.status === 'loading'} />
      </label>
    </div>
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

function mergeInvestmentImport(current: InvestmentConceptForm, values: Partial<InvestmentConceptForm>) {
  const next = { ...current, ...values }
  if (values.insuranceMonthly && current.insuranceMonthly) {
    next.insuranceMonthly = formatGermanNumber(
      parseGermanNumber(current.insuranceMonthly) + parseGermanNumber(values.insuranceMonthly),
    )
  }

  return {
    ...next,
    fundFacts:
      values.fundFacts && current.fundFacts
        ? `${current.fundFacts}\n${values.fundFacts}`
        : next.fundFacts,
    insuranceConcept:
      values.insuranceConcept && current.insuranceConcept
        ? `${current.insuranceConcept}\n${values.insuranceConcept}`
        : next.insuranceConcept,
    healthConcept:
      values.healthConcept && current.healthConcept ? `${current.healthConcept}\n${values.healthConcept}` : next.healthConcept,
  }
}

function parseGermanNumber(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const number = Number.parseFloat(normalized)
  return Number.isFinite(number) ? number : 0
}

function formatGermanNumber(value: number) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
