'use client'

import Image from 'next/image'
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { extractBasisdatenFromPdf } from '@/lib/basisdaten-pdf'
import { extractFinanzgutachtenFromPdf, type FinanzgutachtenProductImport } from '@/lib/finanzgutachten-pdf'
import { drawPraeLuxOverview } from '@/lib/praelux-canvas'
import {
  buildOverviewFromForm,
  calculatePraeLuxForm,
  calculateProductContributionTotals,
  createEmptyPraeLuxForm,
  deriveProductEffect,
  formatCurrency,
  formatOptionalCurrency,
  parseMoneyInput,
  slugifyName,
  type EditableProductChange,
  type PraeLuxFormData,
  type ProductEffectType,
} from '@/lib/praelux'

type ScalarField = {
  [Key in keyof PraeLuxFormData]: PraeLuxFormData[Key] extends string ? Key : never
}[keyof PraeLuxFormData]

type PdfImportState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

const steps = [
  {
    title: 'Mandantendaten',
    tab: 'Mandant',
    eyebrow: 'Schritt 1',
    description:
      'Erfasse die Basisdaten des Mandanten. Alter und Anlagehorizont werden aus Geburtsdatum und Zielalter automatisch abgeleitet.',
  },
  {
    title: 'Bestand & Konzept',
    tab: 'Bestand',
    eyebrow: 'Schritt 2',
    description:
      'Pflicht: Für Aktuell und Neu je einen Beitrag eintragen. Monats- oder Jahreswert reicht; der Gegenwert wird berechnet.',
  },
  {
    title: 'Veränderungen',
    tab: 'Änderungen',
    eyebrow: 'Schritt 3',
    description:
      'Trage die acht Kernkategorien mit altem und neuem Beitrag ein. Die Wirkung wird je Baustein automatisch erkannt und kann in die Gesamtbeiträge übernommen werden.',
  },
  {
    title: 'Langfristwirkung',
    tab: 'Langfrist',
    eyebrow: 'Schritt 4',
    description:
      'Monatliche Ersparnisse werden aus der direkten Veränderung übernommen. Optionaler Monatsbetrag und Zinssatz berechnen das Zusatzpotenzial automatisch.',
  },
  { title: 'Vorschau & Export', tab: 'Export', eyebrow: 'Schritt 5' },
] as const

const effectOptions: { value: ProductEffectType; label: string }[] = [
  { value: 'saving', label: 'Ersparnis' },
  { value: 'extra', label: 'Mehrbeitrag' },
  { value: 'new', label: 'Neuer Baustein' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'missing', label: 'Noch offen' },
]

const DRAFT_STORAGE_KEY = 'praelux-form-draft-v2'

export default function PraeLuxTool() {
  const [form, setForm] = useState<PraeLuxFormData>(() => createEmptyPraeLuxForm())
  const [stepIndex, setStepIndex] = useState(0)
  const [isDraftReady, setIsDraftReady] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [basisdatenImport, setBasisdatenImport] = useState<PdfImportState>({
    status: 'idle',
    message: 'PDF auswählen und Mandantendaten übernehmen',
  })
  const [finanzgutachtenImport, setFinanzgutachtenImport] = useState<PdfImportState>({
    status: 'idle',
    message: 'PDF auswählen und Bestand, Konzept sowie Kategorien übernehmen',
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const autoOptimizedSavingRef = useRef('')
  const data = useMemo(() => buildOverviewFromForm(form), [form])
  const calculated = useMemo(() => calculatePraeLuxForm(form), [form])
  const productTotals = useMemo(() => calculateProductContributionTotals(form.productChanges), [form.productChanges])
  const currentStep = steps[stepIndex]
  const presentCount = data.qualityChecks.filter((check) => check.ok).length

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY)
        if (storedDraft) {
          setForm(hydrateFormDraft(JSON.parse(storedDraft)))
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
    if (calculated.directMonthly === undefined) return

    const nextValue = formatMoneyInput(calculated.directMonthly)
    setForm((current) => {
      const currentValue = current.optimizedMonthlySaving.trim()
      const canUseAutoValue = currentValue === '' || currentValue === autoOptimizedSavingRef.current
      if (!canUseAutoValue) return current

      autoOptimizedSavingRef.current = nextValue
      return current.optimizedMonthlySaving === nextValue ? current : { ...current, optimizedMonthlySaving: nextValue }
    })
  }, [calculated.directMonthly])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    const draw = () => drawPraeLuxOverview(canvas, data, window.devicePixelRatio > 1 ? 1.65 : 1.25)
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

  function updateField(field: ScalarField, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateProduct(index: number, patch: Partial<EditableProductChange>) {
    setForm((current) => ({
      ...current,
      productChanges: current.productChanges.map((change, changeIndex) =>
        changeIndex === index ? { ...change, ...patch } : change,
      ),
    }))
  }

  function addProduct() {
    setForm((current) => ({
      ...current,
      productChanges: [
        ...current.productChanges,
        {
          id: `baustein-${current.productChanges.length + 1}-${Date.now()}`,
          title: 'Weiterer Baustein',
          oldProduct: '',
          newProduct: '',
          oldMonthly: '',
          newMonthly: '',
          monthlyEffect: '',
          effectType: 'missing',
        },
      ],
    }))
  }

  function removeProduct(index: number) {
    setForm((current) => ({
      ...current,
      productChanges:
        current.productChanges.length <= 1
          ? current.productChanges
          : current.productChanges.filter((_, changeIndex) => changeIndex !== index),
    }))
  }

  function downloadPng() {
    const exportCanvas = document.createElement('canvas')
    drawPraeLuxOverview(exportCanvas, data, 2.4)
    const link = document.createElement('a')
    const name = slugifyName(data.clientName || 'mandant') || 'mandant'
    link.download = `praelux-gesamtvorteil-${name}.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }

  function resetForm() {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setForm(createEmptyPraeLuxForm())
    setStepIndex(0)
    setDraftSavedAt(null)
  }

  function goNext() {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1))
  }

  function goBack() {
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  function applyProductTotals() {
    const oldTotal = productTotals.oldTotal
    const newTotal = productTotals.newTotal
    if (!productTotals.canApply || oldTotal === undefined || newTotal === undefined) return
    setForm((current) => ({
      ...current,
      existingMonthly: formatMoneyInput(oldTotal),
      recommendedMonthly: formatMoneyInput(newTotal),
    }))
  }

  async function handleBasisdatenUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    if (!file.name.toLocaleLowerCase('de-DE').endsWith('.pdf')) {
      setBasisdatenImport({ status: 'error', message: 'Bitte eine PDF-Datei auswählen' })
      return
    }

    setBasisdatenImport({ status: 'loading', message: 'PDF wird gelesen' })

    try {
      const result = await extractBasisdatenFromPdf(file)
      const importedCount = result.labels.length

      if (importedCount === 0) {
        setBasisdatenImport({ status: 'error', message: 'Keine Mandantendaten gefunden' })
        return
      }

      setForm((current) => ({ ...current, ...result.values }))
      setBasisdatenImport({
        status: 'success',
        message: `${importedCount} Felder übernommen`,
      })
    } catch {
      setBasisdatenImport({ status: 'error', message: 'PDF konnte nicht gelesen werden' })
    }
  }

  async function handleFinanzgutachtenUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    if (!file.name.toLocaleLowerCase('de-DE').endsWith('.pdf')) {
      setFinanzgutachtenImport({ status: 'error', message: 'Bitte eine PDF-Datei auswählen' })
      return
    }

    setFinanzgutachtenImport({ status: 'loading', message: 'PDF wird gelesen' })

    try {
      const result = await extractFinanzgutachtenFromPdf(file)
      const importedCount = result.labels.length + result.products.length

      if (importedCount === 0) {
        setFinanzgutachtenImport({ status: 'error', message: 'Keine Bestandsdaten gefunden' })
        return
      }

      const conceptValues = resolveFinanzgutachtenConceptValues(result.values, result.products)
      const conceptValueCount = countImportedConceptValues(conceptValues)

      setForm((current) => ({
        ...current,
        ...conceptValues,
        productChanges: mergeFinanzgutachtenProducts(current.productChanges, result.products),
      }))
      setFinanzgutachtenImport({
        status: 'success',
        message: `${conceptValueCount} Summenfelder, ${result.products.length} Kategorien übernommen`,
      })
    } catch {
      setFinanzgutachtenImport({ status: 'error', message: 'PDF konnte nicht gelesen werden' })
    }
  }

  function renderStep() {
    if (stepIndex === 0) {
      return (
        <>
          <div className={`basisdaten-import ${basisdatenImport.status}`}>
            <div>
              <strong>Basisdatenblatt</strong>
              <span>{basisdatenImport.message}</span>
            </div>
            <label className={`pdf-import-action secondary-action ${basisdatenImport.status === 'loading' ? 'disabled' : ''}`}>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleBasisdatenUpload}
                disabled={basisdatenImport.status === 'loading'}
              />
              {basisdatenImport.status === 'loading' ? 'Wird gelesen' : 'PDF importieren'}
            </label>
          </div>
          <div className="field-grid">
            <TextField
              label="Mandantenname"
              value={form.clientName}
              onChange={(value) => updateField('clientName', value)}
              placeholder="Max Mustermann"
            />
            <TextField
              label="Geburtsdatum"
              type="date"
              value={form.birthDate}
              onChange={(value) => updateField('birthDate', value)}
            />
            <Readout label="Alter" value={calculated.age !== undefined ? `${calculated.age} Jahre` : 'wird berechnet'} />
            <TextField
              label="Nettoeinkommen"
              value={form.netIncome}
              onChange={(value) => updateField('netIncome', value)}
              inputMode="decimal"
              placeholder="3.200 €"
            />
            <TextField
              label="Monatlicher Überschuss"
              value={form.surplus}
              onChange={(value) => updateField('surplus', value)}
              inputMode="decimal"
              placeholder="650 €"
            />
            <TextField
              label="Anlagehorizont"
              value={form.horizon}
              onChange={(value) => updateField('horizon', value)}
              placeholder={`${calculated.remainingYears ?? ''} Jahre bis ${calculated.targetAge}`.trim()}
            />
            <TextField
              label="Zielalter"
              value={form.targetAge}
              onChange={(value) => updateField('targetAge', value)}
              inputMode="numeric"
            />
            <TextField
              label="Rücklagen"
              value={form.reserves}
              onChange={(value) => updateField('reserves', value)}
              inputMode="decimal"
              placeholder="optional"
            />
            <TextField
              label="Verbindlichkeiten"
              value={form.liabilities}
              onChange={(value) => updateField('liabilities', value)}
              inputMode="decimal"
              placeholder="optional"
            />
          </div>
        </>
      )
    }

    if (stepIndex === 1) {
      return (
        <>
          <div className={`basisdaten-import ${finanzgutachtenImport.status}`}>
            <div>
              <strong>Finanzgutachten</strong>
              <span>{finanzgutachtenImport.message}</span>
            </div>
            <label
              className={`pdf-import-action secondary-action ${
                finanzgutachtenImport.status === 'loading' ? 'disabled' : ''
              }`}
            >
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFinanzgutachtenUpload}
                disabled={finanzgutachtenImport.status === 'loading'}
              />
              {finanzgutachtenImport.status === 'loading' ? 'Wird gelesen' : 'PDF importieren'}
            </label>
          </div>
          <div className="concept-groups">
            <fieldset className="concept-group">
              <legend>
                Aktuell
                <span>Bestand</span>
              </legend>
              <TextField
                label="Monatsbeitrag"
                value={form.existingMonthly}
                onChange={(value) => updateField('existingMonthly', value)}
                inputMode="decimal"
                placeholder="z.B. 245,00 €"
              />
              <TextField
                label="Jahresbeitrag"
                value={form.existingYearly}
                onChange={(value) => updateField('existingYearly', value)}
                inputMode="decimal"
                placeholder="z.B. 2.940,00 €"
              />
            </fieldset>
            <fieldset className="concept-group">
              <legend>
                Neu
                <span>Konzept</span>
              </legend>
              <TextField
                label="Monatsbeitrag"
                value={form.recommendedMonthly}
                onChange={(value) => updateField('recommendedMonthly', value)}
                inputMode="decimal"
                placeholder="z.B. 198,00 €"
              />
              <TextField
                label="Jahresbeitrag"
                value={form.recommendedYearly}
                onChange={(value) => updateField('recommendedYearly', value)}
                inputMode="decimal"
                placeholder="z.B. 2.376,00 €"
              />
            </fieldset>
          </div>
        </>
      )
    }

    if (stepIndex === 2) {
      return (
        <div className="product-list">
          <div className="product-tools">
            <Readout label="Bestand" value={formatMonthly(productTotals.oldTotal)} />
            <Readout label="Neu" value={formatMonthly(productTotals.newTotal)} />
            <Readout label="Differenz" value={formatImpact(productTotals.effect)} tone="strong" />
            <button
              type="button"
              className="secondary-action compact-action"
              onClick={applyProductTotals}
              disabled={!productTotals.canApply}
            >
              Summen übernehmen
            </button>
          </div>
          {form.productChanges.map((change, index) => {
            const preview = deriveProductEffect(change)
            const isAutoCalculated = preview.effectSource === 'calculated'
            const placeholders = getProductPlaceholders(change.title)
            return (
              <section className="product-editor" key={change.id}>
                <div className="product-editor-head">
                  <span>{index + 1}</span>
                  <input
                    aria-label={`Baustein ${index + 1}`}
                    value={change.title}
                    onChange={(event) => updateProduct(index, { title: event.target.value })}
                  />
                  <button
                    type="button"
                    className="quiet-action"
                    onClick={() => removeProduct(index)}
                    disabled={form.productChanges.length <= 1}
                  >
                    Entfernen
                  </button>
                </div>
                <div className="field-grid product-fields">
                  <TextField
                    label="Aktuell"
                    value={change.oldProduct}
                    onChange={(value) => updateProduct(index, { oldProduct: value })}
                    placeholder={placeholders.oldProduct}
                  />
                  <TextField
                    label="Neu"
                    value={change.newProduct}
                    onChange={(value) => updateProduct(index, { newProduct: value })}
                    placeholder={placeholders.newProduct}
                  />
                  <TextField
                    label="Aktueller Beitrag mtl."
                    value={change.oldMonthly}
                    onChange={(value) => updateProduct(index, { oldMonthly: value })}
                    inputMode="decimal"
                    placeholder="245,00 €"
                  />
                  <TextField
                    label="Neuer Beitrag monatlich"
                    value={change.newMonthly}
                    onChange={(value) => updateProduct(index, { newMonthly: value })}
                    inputMode="decimal"
                    placeholder="198,00 €"
                  />
                  <TextField
                    label="Manueller Effekt"
                    value={change.monthlyEffect}
                    onChange={(value) => updateProduct(index, { monthlyEffect: value })}
                    inputMode="decimal"
                    placeholder="nur wenn Beiträge fehlen"
                  />
                  <SelectField
                    label="Wirkung"
                    value={change.effectType}
                    onChange={(value) => updateProduct(index, { effectType: value as ProductEffectType })}
                    disabled={isAutoCalculated}
                  >
                    {effectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <ProductEffectPreview preview={preview} />
              </section>
            )
          })}
          <button type="button" className="secondary-action add-action" onClick={addProduct}>
            Baustein hinzufügen
          </button>
        </div>
      )
    }

    if (stepIndex === 3) {
      return (
        <>
          <div className="field-grid">
            <TextField
              label="Monatliche Ersparnisse"
              value={form.optimizedMonthlySaving}
              onChange={(value) => updateField('optimizedMonthlySaving', value)}
              inputMode="decimal"
              placeholder="automatisch aus Schritt 2"
            />
            <TextField
              label="Optionaler Monatsbetrag"
              value={form.optionalMonthlyInvestment}
              onChange={(value) => updateField('optionalMonthlyInvestment', value)}
              inputMode="decimal"
              placeholder="optional"
            />
            <TextField
              label="Allgemeiner Zinssatz p.a."
              value={form.generalInterestRate}
              onChange={(value) => updateField('generalInterestRate', value)}
              inputMode="decimal"
              placeholder="3,00 %"
            />
          </div>
          <div className="readout-grid">
            <Readout label="Anlagehorizont" value={formatHorizon(calculated.remainingYears)} />
            <Readout
              label="Reine Beitragsersparnis"
              value={formatOptionalCurrency(calculated.pureSavingUntilTarget, { plus: true })}
              tone="positive"
            />
            <Readout
              label="Optionales Potenzial"
              value={formatOptionalCurrency(calculated.optionalPotentialUntilTarget, { plus: true })}
            />
            <Readout label="Zinssatz p.a." value={formatInterestRate(calculated.generalInterestRate)} />
          </div>
          <label className="field full-field">
            <span>Fazit-Zusatz</span>
            <textarea
              value={form.conclusionNote}
              onChange={(event) => updateField('conclusionNote', event.target.value)}
              placeholder="optional: eigenes Fazit eintragen"
            />
          </label>
        </>
      )
    }

    return (
      <div className="export-grid">
        <div className="readout-grid">
          <Readout label="Veränderung mtl." value={formatImpact(calculated.directMonthly)} tone="strong" />
          <Readout
            label="Reine Beitragsersparnis"
            value={formatOptionalCurrency(calculated.pureSavingUntilTarget, { plus: true })}
            tone="positive"
          />
          <Readout
            label="Optionales Potenzial"
            value={formatOptionalCurrency(calculated.optionalPotentialUntilTarget, { plus: true })}
          />
          <Readout label="Zinssatz p.a." value={formatInterestRate(calculated.generalInterestRate)} />
        </div>
        <div className="quality-list">
          {data.qualityChecks.map((check) => (
            <div className={check.ok ? 'quality-item ok' : 'quality-item check'} key={check.label}>
              <span aria-hidden="true" />
              <strong>{check.label}</strong>
              <em>{check.ok ? 'fertig' : 'prüfen'}</em>
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
        <button type="button" className="primary-action export-action" onClick={downloadPng}>
          PNG herunterladen
        </button>
      </div>
    )
  }

  return (
    <main className="app-frame">
      <section className="toolbar" aria-label="PraeLux Generator">
        <div className="brand-lockup">
          <Image className="brand-logo" src="/praelux-logo.svg" alt="PraeLux" width={48} height={48} priority unoptimized />
          <span className="brand-subline">Gesamtvorteil</span>
        </div>
        <div className="toolbar-actions">
          <span className="status-pill">
            {presentCount}/{data.qualityChecks.length} Datenpunkte
          </span>
          {draftSavedAt && (
            <span className="status-pill subtle-status">
              Entwurf {draftSavedAt === 'geladen' ? 'geladen' : `gespeichert ${draftSavedAt}`}
            </span>
          )}
          <button type="button" className="secondary-action" onClick={resetForm}>
            Neu starten
          </button>
          <button type="button" className="primary-action" onClick={downloadPng}>
            PNG herunterladen
          </button>
        </div>
      </section>

      <section className="workspace">
        <section className="wizard-panel" aria-label="Datenabfrage">
          <nav className="stepper" aria-label="Schritte">
            {steps.map((step, index) => (
              <button
                type="button"
                className={index === stepIndex ? 'step-tab active' : 'step-tab'}
                onClick={() => setStepIndex(index)}
                aria-current={index === stepIndex ? 'step' : undefined}
                key={step.title}
              >
                <span>{index + 1}</span>
                <em>{step.tab}</em>
              </button>
            ))}
          </nav>

          <div className="step-card">
            <div className="step-heading">
              <span>{currentStep.eyebrow}</span>
              <h1>{currentStep.title}</h1>
              {'description' in currentStep && <p>{currentStep.description}</p>}
            </div>
            {renderStep()}
          </div>

          <div className="step-actions">
            <button type="button" className="secondary-action" onClick={goBack} disabled={stepIndex === 0}>
              Zurück
            </button>
            <button type="button" className="primary-action" onClick={goNext} disabled={stepIndex === steps.length - 1}>
              Weiter
            </button>
          </div>
        </section>

        <aside className="review-panel" aria-label="Automatische Berechnung">
          <div className="panel-heading">
            <h2>Automatik</h2>
            <span>{data.clientName}</span>
          </div>
          <div className="calc-stack">
            <Readout label="Bestand mtl." value={formatMonthly(calculated.existingMonthly)} />
            <Readout label="Empfehlung mtl." value={formatMonthly(calculated.recommendedMonthly)} />
            <Readout label="Direkte Veränderung" value={formatImpact(calculated.directMonthly)} tone="strong" />
            <Readout
              label="Langfristiger Vorteil"
              value={formatOptionalCurrency(calculated.pureSavingUntilTarget, { plus: true })}
              tone="positive"
            />
          </div>
          <div className="quality-list compact-list">
            {data.qualityChecks.map((check) => (
              <div className={check.ok ? 'quality-item ok' : 'quality-item check'} key={check.label}>
                <span aria-hidden="true" />
                <strong>{check.label}</strong>
                <em>{check.ok ? 'ok' : 'offen'}</em>
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
            <canvas ref={canvasRef} aria-label="PraeLux Gesamtvorteil" role="img" />
          </div>
        </section>
      </section>
    </main>
  )
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'decimal' | 'numeric'
}

function TextField({ label, value, onChange, placeholder, type = 'text', inputMode = 'text' }: TextFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </label>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

function SelectField({ label, value, onChange, disabled = false, children }: SelectFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {children}
      </select>
    </label>
  )
}

function Readout({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'strong' | 'positive'
}) {
  return (
    <div className={`readout ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ProductEffectPreview({ preview }: { preview: ReturnType<typeof deriveProductEffect> }) {
  const source =
    preview.effectSource === 'calculated'
      ? 'automatisch aus Alt-/Neu-Beitrag'
      : preview.effectSource === 'manual'
        ? 'manuelle Wirkung'
        : 'Alt- und Neu-Beitrag eintragen'

  return (
    <div className={`product-effect ${preview.effectType}`}>
      <span>{source}</span>
      <strong>{preview.effectLabel}</strong>
    </div>
  )
}

function formatMonthly(value: number | undefined) {
  return value === undefined ? 'fehlt' : `${formatCurrency(value)} mtl.`
}

function getProductPlaceholders(title: string) {
  const normalized = normalizeProductTitle(title)

  if (normalized.includes('berufsun')) {
    return {
      oldProduct: 'aktueller BU-Tarif',
      newProduct: 'neuer BU-Tarif',
    }
  }

  if (normalized.includes('haftpflicht')) {
    return {
      oldProduct: 'aktueller Haftpflicht-Tarif',
      newProduct: 'neuer Haftpflicht-Tarif',
    }
  }

  if (normalized.includes('unfall')) {
    return {
      oldProduct: 'aktuelle Unfallversicherung',
      newProduct: 'neue Unfallversicherung',
    }
  }

  if (normalized.includes('kranken') || normalized.includes('pflege') || normalized.includes('krankenkasse')) {
    return {
      oldProduct: 'aktuelle Kranken-/Pflegeversicherung',
      newProduct: 'neue Kranken-/Pflegeversicherung',
    }
  }

  if (normalized.includes('altersvorsorge')) {
    return {
      oldProduct: 'aktueller Altersvorsorge-Vertrag',
      newProduct: 'neuer Altersvorsorge-Vertrag',
    }
  }

  if (normalized.includes('hausrat')) {
    return {
      oldProduct: 'aktuelle Hausratsversicherung',
      newProduct: 'neue Hausratsversicherung',
    }
  }

  if (normalized.includes('zahn')) {
    return {
      oldProduct: 'aktueller Zahnzusatz-Tarif',
      newProduct: 'neuer Zahnzusatz-Tarif',
    }
  }

  if (normalized.includes('rechtsschutz')) {
    return {
      oldProduct: 'aktueller Rechtsschutz-Tarif',
      newProduct: 'neuer Rechtsschutz-Tarif',
    }
  }

  return {
    oldProduct: 'aktueller Anbieter / Tarif',
    newProduct: 'neuer Anbieter / Tarif',
  }
}

function normalizeProductTitle(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLocaleLowerCase('de-DE')
}

function formatImpact(value: number | undefined, yearly = false) {
  if (value === undefined) return 'wird berechnet'
  if (value >= 0) return formatCurrency(value, { plus: true, yearly })
  return `Mehrbeitrag: ${formatCurrency(Math.abs(value), { yearly })}`
}

function formatHorizon(value: number | undefined) {
  if (value === undefined) return 'offen'
  return value === 1 ? '1 Jahr' : `${value} Jahre`
}

function formatInterestRate(value: number | undefined) {
  if (value === undefined) return 'ohne Zins'
  return `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} %`
}

function formatMoneyInput(value: number) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const legacyProductAliases: Record<string, string> = {
  haftpflicht: 'dienstundprivathaftpflichtversicherung',
  privatehaftpflichtversicherung: 'dienstundprivathaftpflichtversicherung',
  dienstundprivathaftpflicht: 'dienstundprivathaftpflichtversicherung',
  krankenkasse: 'krankenundpflegeversicherung',
  krankenversicherung: 'krankenundpflegeversicherung',
  zahnzusatz: 'zahnzusatzversicherung',
  rechtsschutz: 'rechtsschutzversicherung',
}

function hydrateFormDraft(value: unknown): PraeLuxFormData {
  const empty = createEmptyPraeLuxForm()
  if (!value || typeof value !== 'object') return empty

  const draft = value as Partial<PraeLuxFormData>
  const draftProducts = Array.isArray(draft.productChanges) ? draft.productChanges : []

  return {
    ...empty,
    ...draft,
    productChanges: draftProducts.length > 0 ? migrateProductDrafts(draftProducts, empty.productChanges) : empty.productChanges,
  }
}

function migrateProductDrafts(draftProducts: unknown[], defaults: EditableProductChange[]) {
  const drafts = draftProducts.filter(isEditableProductDraft)
  const draftIndexesByKey = new Map<string, number>()
  const usedIndexes = new Set<number>()

  drafts.forEach((draft, index) => {
    const keys = [draft.id, draft.title]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .map(normalizeProductDraftKey)

    for (const key of keys) {
      draftIndexesByKey.set(legacyProductAliases[key] ?? key, index)
    }
  })

  const mergedDefaults = defaults.map((defaultProduct) => {
    const defaultKey = normalizeProductDraftKey(defaultProduct.id)
    const draftIndex = draftIndexesByKey.get(defaultKey)
    const draft = draftIndex === undefined ? undefined : drafts[draftIndex]

    if (draftIndex !== undefined) usedIndexes.add(draftIndex)

    return {
      ...defaultProduct,
      ...(draft ?? {}),
      id: defaultProduct.id,
      title: defaultProduct.title,
    }
  })

  const customDrafts = drafts
    .filter((_, index) => !usedIndexes.has(index))
    .map((draft, index) => ({
      ...defaults[0],
      ...draft,
      id: typeof draft.id === 'string' && draft.id ? draft.id : `baustein-${defaults.length + index + 1}`,
    }))

  return [...mergedDefaults, ...customDrafts]
}

function mergeFinanzgutachtenProducts(
  currentProducts: EditableProductChange[],
  importedProducts: FinanzgutachtenProductImport[],
) {
  const importedByKey = new Map(importedProducts.map((product) => [normalizeProductDraftKey(product.categoryKey), product]))

  return currentProducts.map((product) => {
    const imported = importedByKey.get(normalizeProductDraftKey(product.id)) ?? importedByKey.get(normalizeProductDraftKey(product.title))
    if (!imported) return product

    const nextProduct: EditableProductChange = {
      ...product,
      oldProduct: imported.oldProduct ?? product.oldProduct,
      oldMonthly: imported.oldMonthly ?? product.oldMonthly,
      newProduct: imported.newProduct ?? product.newProduct,
      newMonthly: imported.newMonthly ?? product.newMonthly,
      monthlyEffect: '',
    }

    return {
      ...nextProduct,
      effectType: deriveProductEffect(nextProduct).effectType,
    }
  })
}

function resolveFinanzgutachtenConceptValues(
  values: Partial<Pick<PraeLuxFormData, 'existingMonthly' | 'existingYearly' | 'recommendedMonthly' | 'recommendedYearly'>>,
  importedProducts: FinanzgutachtenProductImport[],
) {
  const totals = calculateImportedProductTotals(importedProducts)
  const next = { ...values }

  applyImportedProductTotal(next, 'existingMonthly', 'existingYearly', totals.oldTotal, totals.oldCount)
  applyImportedProductTotal(next, 'recommendedMonthly', 'recommendedYearly', totals.newTotal, totals.newCount)
  discardSingleProductTotal(next, 'existingMonthly', 'existingYearly', totals.singleOldMonthly, totals.oldCount)
  discardSingleProductTotal(next, 'recommendedMonthly', 'recommendedYearly', totals.singleNewMonthly, totals.newCount)

  return next
}

function calculateImportedProductTotals(importedProducts: FinanzgutachtenProductImport[]) {
  let oldTotal = 0
  let newTotal = 0
  let oldCount = 0
  let newCount = 0
  let singleOldMonthly: number | undefined
  let singleNewMonthly: number | undefined

  for (const product of importedProducts) {
    const oldMonthly = parseMoneyInput(product.oldMonthly)
    const newMonthly = parseMoneyInput(product.newMonthly)

    if (oldMonthly !== undefined) {
      oldTotal += oldMonthly
      oldCount += 1
      singleOldMonthly = oldMonthly
    }
    if (newMonthly !== undefined) {
      newTotal += newMonthly
      newCount += 1
      singleNewMonthly = newMonthly
    }
  }

  return {
    oldTotal: oldCount > 0 ? oldTotal : undefined,
    newTotal: newCount > 0 ? newTotal : undefined,
    oldCount,
    newCount,
    singleOldMonthly,
    singleNewMonthly,
  }
}

function applyImportedProductTotal(
  values: Partial<Pick<PraeLuxFormData, 'existingMonthly' | 'existingYearly' | 'recommendedMonthly' | 'recommendedYearly'>>,
  monthlyKey: 'existingMonthly' | 'recommendedMonthly',
  yearlyKey: 'existingYearly' | 'recommendedYearly',
  total: number | undefined,
  count: number,
) {
  if (total === undefined || count < 2) return
  const importedMonthly = parseMoneyInput(values[monthlyKey])
  const monthly = importedMonthly === undefined || total > importedMonthly + 0.01 ? total : importedMonthly
  values[monthlyKey] = formatMoneyInput(monthly)
  values[yearlyKey] = formatMoneyInput(monthly * 12)
}

function discardSingleProductTotal(
  values: Partial<Pick<PraeLuxFormData, 'existingMonthly' | 'existingYearly' | 'recommendedMonthly' | 'recommendedYearly'>>,
  monthlyKey: 'existingMonthly' | 'recommendedMonthly',
  yearlyKey: 'existingYearly' | 'recommendedYearly',
  singleMonthly: number | undefined,
  count: number,
) {
  if (count !== 1 || singleMonthly === undefined) return

  const importedMonthly = parseMoneyInput(values[monthlyKey])
  if (importedMonthly !== undefined && Math.abs(importedMonthly - singleMonthly) < 0.01) {
    delete values[monthlyKey]
    delete values[yearlyKey]
  }
}

function countImportedConceptValues(
  values: Partial<Pick<PraeLuxFormData, 'existingMonthly' | 'existingYearly' | 'recommendedMonthly' | 'recommendedYearly'>>,
) {
  return Object.values(values).filter(Boolean).length
}

function isEditableProductDraft(value: unknown): value is Partial<EditableProductChange> {
  return Boolean(value && typeof value === 'object')
}

function normalizeProductDraftKey(value: string) {
  return normalizeProductTitle(value).replace(/[^a-z0-9]+/g, '')
}
