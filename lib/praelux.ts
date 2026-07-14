export type FieldStatus = 'present' | 'missing' | 'check'

export type FactField = {
  label: string
  value: string
  status: FieldStatus
}

export type ConceptTotals = {
  monthly?: number
  yearly?: number
  monthlyLabel: string
  yearlyLabel: string
  note: string
}

export type ProductEffectType = 'saving' | 'extra' | 'new' | 'neutral' | 'missing'

export type ProductChange = {
  title: string
  oldProduct: string
  newProduct: string
  oldMonthly?: number
  newMonthly?: number
  oldMonthlyLabel: string
  newMonthlyLabel: string
  effect?: number
  effectLabel: string
  effectType: ProductEffectType
  effectSource: 'calculated' | 'manual' | 'missing'
}

export type EditableProductChange = {
  id: string
  title: string
  oldProduct: string
  newProduct: string
  oldMonthly: string
  newMonthly: string
  monthlyEffect: string
  effectType: ProductEffectType
}

export type Mandantenwirkung = {
  monthly?: number
  yearly?: number
  monthlyLabel: string
  yearlyLabel: string
  type: 'saving' | 'extra' | 'missing'
  explanation: string
}

export type LongTermSaving = {
  value?: number
  label: string
  status: FieldStatus
  note: string
}

export type QualityCheck = {
  label: string
  ok: boolean
}

export type OverviewData = {
  clientName: string
  targetAge: number
  subtitle: string
  intro: string
  facts: FactField[]
  existing: ConceptTotals
  recommended: ConceptTotals
  impact: Mandantenwirkung
  changes: ProductChange[]
  longTermSaving: LongTermSaving
  optionalPotential: string
  conclusion: string
  notices: string[]
  qualityChecks: QualityCheck[]
}

export type PraeLuxFormData = {
  clientName: string
  birthDate: string
  netIncome: string
  surplus: string
  horizon: string
  targetAge: string
  reserves: string
  liabilities: string
  existingMonthly: string
  existingYearly: string
  recommendedMonthly: string
  recommendedYearly: string
  productChanges: EditableProductChange[]
  optimizedMonthlySaving: string
  pureSavingUntilTarget: string
  optionalMonthlyInvestment: string
  optionalPotentialUntilTarget: string
  generalInterestRate: string
  conclusionNote: string
}

export type PraeLuxCalculatedValues = {
  age?: number
  targetAge: number
  remainingYears?: number
  birthDateLabel: string
  existingMonthly?: number
  existingYearly?: number
  recommendedMonthly?: number
  recommendedYearly?: number
  directMonthly?: number
  directYearly?: number
  optimizedMonthlySaving?: number
  pureSavingUntilTarget?: number
  optionalMonthlyInvestment?: number
  optionalPotentialUntilTarget?: number
  generalInterestRate?: number
}

const MISSING = 'fehlt'
const CHECK = 'muss geprüft werden'
const NOT_GIVEN = 'nicht angegeben'
const DEFAULT_TARGET_AGE = 67

const DEFAULT_PRODUCT_CHANGES: EditableProductChange[] = [
  {
    id: 'berufsunfaehigkeitsversicherung',
    title: 'Berufsunfähigkeitsversicherung',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
  {
    id: 'dienst-und-privathaftpflichtversicherung',
    title: 'Dienst- und Privathaftpflichtversicherung',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
  {
    id: 'unfallversicherung',
    title: 'Unfallversicherung',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
  {
    id: 'kranken-und-pflegeversicherung',
    title: 'Kranken- und Pflegeversicherung',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
  {
    id: 'altersvorsorge',
    title: 'Altersvorsorge',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
  {
    id: 'hausratsversicherung',
    title: 'Hausratsversicherung',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
  {
    id: 'zahnzusatzversicherung',
    title: 'Zahnzusatzversicherung',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
  {
    id: 'rechtsschutzversicherung',
    title: 'Rechtsschutzversicherung',
    oldProduct: '',
    newProduct: '',
    oldMonthly: '',
    newMonthly: '',
    monthlyEffect: '',
    effectType: 'missing',
  },
]

export function createEmptyPraeLuxForm(): PraeLuxFormData {
  return {
    clientName: '',
    birthDate: '',
    netIncome: '',
    surplus: '',
    horizon: '',
    targetAge: String(DEFAULT_TARGET_AGE),
    reserves: '',
    liabilities: '',
    existingMonthly: '',
    existingYearly: '',
    recommendedMonthly: '',
    recommendedYearly: '',
    productChanges: DEFAULT_PRODUCT_CHANGES.map((change) => ({ ...change })),
    optimizedMonthlySaving: '',
    pureSavingUntilTarget: '',
    optionalMonthlyInvestment: '',
    optionalPotentialUntilTarget: '',
    generalInterestRate: '',
    conclusionNote: '',
  }
}

export function calculatePraeLuxForm(form: PraeLuxFormData): PraeLuxCalculatedValues {
  const age = calculateAgeFromIsoDate(form.birthDate)
  const targetAge = parseInteger(form.targetAge) ?? DEFAULT_TARGET_AGE
  const derivedRemainingYears = age !== undefined ? Math.max(0, targetAge - age) : undefined
  const remainingYears = parseHorizonYears(form.horizon, age) ?? derivedRemainingYears

  const existing = calculateConcept(form.existingMonthly, form.existingYearly)
  const recommended = calculateConcept(form.recommendedMonthly, form.recommendedYearly)
  const directMonthly =
    existing.monthly !== undefined && recommended.monthly !== undefined
      ? existing.monthly - recommended.monthly
      : undefined
  const directYearly =
    existing.yearly !== undefined && recommended.yearly !== undefined
      ? existing.yearly - recommended.yearly
      : directMonthly !== undefined
        ? directMonthly * 12
        : undefined

  const optimizedMonthlySaving = parseMoneyInput(form.optimizedMonthlySaving) ?? directMonthly
  const pureSavingUntilTarget =
    optimizedMonthlySaving !== undefined && remainingYears !== undefined
      ? optimizedMonthlySaving * 12 * remainingYears
      : undefined

  const optionalMonthlyInvestment = parseMoneyInput(form.optionalMonthlyInvestment)
  const generalInterestRate = parsePercentInput(form.generalInterestRate)
  const optionalPotentialUntilTarget =
    optionalMonthlyInvestment !== undefined && remainingYears !== undefined
      ? calculateMonthlySavingsPotential(optionalMonthlyInvestment, remainingYears, generalInterestRate)
      : undefined

  return {
    age,
    targetAge,
    remainingYears,
    birthDateLabel: formatIsoDate(form.birthDate) ?? MISSING,
    existingMonthly: existing.monthly,
    existingYearly: existing.yearly,
    recommendedMonthly: recommended.monthly,
    recommendedYearly: recommended.yearly,
    directMonthly,
    directYearly,
    optimizedMonthlySaving,
    pureSavingUntilTarget,
    optionalMonthlyInvestment,
    optionalPotentialUntilTarget,
    generalInterestRate,
  }
}

export function buildOverviewFromForm(form: PraeLuxFormData): OverviewData {
  const calculated = calculatePraeLuxForm(form)
  const clientName = cleanText(form.clientName) || NOT_GIVEN
  const existing = buildConceptTotals(
    calculated.existingMonthly,
    calculated.existingYearly,
    form.existingMonthly,
    form.existingYearly,
    'existing',
  )
  const recommended = buildConceptTotals(
    calculated.recommendedMonthly,
    calculated.recommendedYearly,
    form.recommendedMonthly,
    form.recommendedYearly,
    'recommended',
  )
  const impact = buildImpact(calculated.directMonthly, calculated.directYearly)
  const changes = buildProductChanges(form.productChanges)
  const longTermSaving = buildLongTermSaving(calculated)
  const optionalPotential = buildOptionalPotential(calculated)
  const conclusion = buildConclusion(form, impact, longTermSaving)
  const horizonValue = cleanText(form.horizon) || buildHorizonLabel(calculated)

  const facts: FactField[] = [
    {
      label: 'Geburtsdatum',
      value: calculated.birthDateLabel,
      status: form.birthDate ? (calculated.age === undefined ? 'check' : 'present') : 'missing',
    },
    {
      label: 'Alter',
      value: calculated.age !== undefined ? `${calculated.age} Jahre` : MISSING,
      status: calculated.age !== undefined ? 'present' : 'missing',
    },
    {
      label: 'Nettoeinkommen',
      value: moneyFactLabel(form.netIncome, 'mtl.'),
      status: parseMoneyInput(form.netIncome) !== undefined || cleanText(form.netIncome) ? 'present' : 'missing',
    },
    {
      label: 'Überschuss',
      value: moneyFactLabel(form.surplus, 'mtl.'),
      status: parseMoneyInput(form.surplus) !== undefined || cleanText(form.surplus) ? 'present' : 'missing',
    },
    {
      label: 'Anlagehorizont',
      value: horizonValue,
      status: horizonValue === MISSING ? 'missing' : cleanText(form.horizon) ? 'present' : 'check',
    },
  ]

  return {
    clientName,
    targetAge: calculated.targetAge,
    subtitle: `${clientName} | Bestandsaufnahme vs. empfohlenes Konzept`,
    intro:
      'Diese Übersicht zeigt sachlich, was sich durch das empfohlene Konzept monatlich, jährlich und langfristig verändert.',
    facts,
    existing,
    recommended,
    impact,
    changes,
    longTermSaving,
    optionalPotential,
    conclusion,
    notices: [
      buildRuntimeNotice(calculated),
      buildLongTermSavingNotice(calculated),
      'Optionaler Zinssatz ist modellhaft',
      'Neue Bausteine nicht in reiner Beitragsersparnis enthalten',
      'Fehlende Werte bleiben markiert',
      'Keine Garantie oder Renditezusage',
      'Darstellung aus Mandantensicht',
      'Ersparnisse werden als positiver Vorteil gezeigt',
    ],
    qualityChecks: [
      { label: 'Mandantendaten', ok: clientName !== NOT_GIVEN && calculated.age !== undefined },
      {
        label: 'Einkommen & Überschuss',
        ok: hasValue(form.netIncome) && hasValue(form.surplus),
      },
      { label: 'Bestand', ok: existing.monthly !== undefined || existing.yearly !== undefined },
      { label: 'Empfehlung', ok: recommended.monthly !== undefined || recommended.yearly !== undefined },
      { label: 'Direkte Veränderung', ok: impact.type !== 'missing' },
      { label: 'Produkte', ok: changes.some((change) => change.effectType !== 'missing') },
      { label: 'Langfristwirkung', ok: longTermSaving.status === 'present' },
    ],
  }
}

export function formatCurrency(value: number, options: { plus?: boolean; yearly?: boolean } = {}) {
  const absolute = Math.abs(value)
  const sign = options.plus && value >= 0 ? '+' : value < 0 ? '−' : ''
  const suffix = options.yearly ? ' p.a.' : ''
  return `${sign}${new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(absolute)}${suffix}`
}

export function formatOptionalCurrency(value: number | undefined, options: { plus?: boolean; yearly?: boolean } = {}) {
  return value === undefined ? MISSING : formatCurrency(value, options)
}

export function parseMoneyInput(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const isNegative = /[-−]/.test(trimmed)
  const cleaned = trimmed
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
  const number = Number.parseFloat(cleaned)
  if (!Number.isFinite(number)) return undefined
  return isNegative ? -Math.abs(number) : Math.abs(number)
}

export function parsePercentInput(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const cleaned = trimmed.replace(/[^\d,.-]/g, '').replace(',', '.')
  const number = Number.parseFloat(cleaned)
  if (!Number.isFinite(number)) return undefined
  return number
}

export function slugifyName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

function calculateConcept(monthlyInput: string, yearlyInput: string) {
  const monthlyFromInput = parseMoneyInput(monthlyInput)
  const yearlyFromInput = parseMoneyInput(yearlyInput)
  return {
    monthly: monthlyFromInput ?? (yearlyFromInput !== undefined ? yearlyFromInput / 12 : undefined),
    yearly: yearlyFromInput ?? (monthlyFromInput !== undefined ? monthlyFromInput * 12 : undefined),
  }
}

function buildConceptTotals(
  monthly: number | undefined,
  yearly: number | undefined,
  monthlyInput: string,
  yearlyInput: string,
  type: 'existing' | 'recommended',
): ConceptTotals {
  const baseNote =
    type === 'existing'
      ? 'Der aktuelle Bestand ist die Ausgangslage.'
      : 'Das empfohlene Konzept ist die neue Struktur.'
  const note = buildDerivedNote(monthlyInput, yearlyInput, baseNote)

  return {
    monthly,
    yearly,
    monthlyLabel: monthly !== undefined ? `${formatCurrency(monthly)} mtl.` : MISSING,
    yearlyLabel: yearly !== undefined ? formatCurrency(yearly, { yearly: true }) : MISSING,
    note,
  }
}

function buildDerivedNote(monthlyInput: string, yearlyInput: string, baseNote: string) {
  const hasMonthly = parseMoneyInput(monthlyInput) !== undefined
  const hasYearly = parseMoneyInput(yearlyInput) !== undefined
  if (hasMonthly && !hasYearly) return `${baseNote} Jahreswert automatisch aus Monatswert berechnet.`
  if (!hasMonthly && hasYearly) return `${baseNote} Monatswert automatisch aus Jahreswert berechnet.`
  if (hasMonthly && hasYearly) return `${baseNote} Monats- und Jahreswert wurden einzeln erfasst.`
  return `${baseNote} Beitrag fehlt noch.`
}

function buildImpact(monthly: number | undefined, yearly: number | undefined): Mandantenwirkung {
  if (monthly === undefined && yearly === undefined) {
    return {
      monthlyLabel: MISSING,
      yearlyLabel: MISSING,
      type: 'missing',
      explanation: 'Die Veränderung wird automatisch berechnet, sobald Bestand und Empfehlung erfasst sind.',
    }
  }

  const reference = monthly ?? (yearly ? yearly / 12 : 0)
  const isSaving = reference >= 0

  return {
    monthly,
    yearly,
    type: isSaving ? 'saving' : 'extra',
    monthlyLabel:
      monthly === undefined
        ? MISSING
        : isSaving
          ? `${formatCurrency(monthly, { plus: true })} mtl.`
          : `Mehrbeitrag: ${formatCurrency(Math.abs(monthly))} mtl.`,
    yearlyLabel:
      yearly === undefined
        ? MISSING
        : isSaving
          ? formatCurrency(yearly, { plus: true, yearly: true })
          : `Mehrbeitrag: ${formatCurrency(Math.abs(yearly), { yearly: true })}`,
    explanation: isSaving
      ? 'Entlastung aus der Differenz zwischen Bestandsaufnahme und empfohlenem Konzept.'
      : 'Das empfohlene Konzept verursacht einen Mehrbeitrag; die fachliche Begründung sollte klar benannt werden.',
  }
}

function buildProductChanges(productChanges: EditableProductChange[]) {
  return productChanges.map((change, index) => {
    const derived = deriveProductEffect(change)
    return {
      title: cleanText(change.title) || `Baustein ${index + 1}`,
      oldProduct: cleanText(change.oldProduct) || NOT_GIVEN,
      newProduct: cleanText(change.newProduct) || CHECK,
      oldMonthly: derived.oldMonthly,
      newMonthly: derived.newMonthly,
      oldMonthlyLabel: derived.oldMonthlyLabel,
      newMonthlyLabel: derived.newMonthlyLabel,
      effect: derived.effect,
      effectLabel: derived.effectLabel,
      effectType: derived.effectType,
      effectSource: derived.effectSource,
    } satisfies ProductChange
  })
}

export function deriveProductEffect(change: EditableProductChange) {
  const oldMonthly = parseMoneyInput(change.oldMonthly)
  const newMonthly = parseMoneyInput(change.newMonthly)
  const hasCalculatedPair = oldMonthly !== undefined && newMonthly !== undefined

  if (hasCalculatedPair) {
    const effect = oldMonthly - newMonthly
    const effectType: ProductEffectType = Math.abs(effect) < 0.005 ? 'neutral' : effect > 0 ? 'saving' : 'extra'
    return {
      oldMonthly,
      newMonthly,
      oldMonthlyLabel: `${formatCurrency(oldMonthly)} mtl.`,
      newMonthlyLabel: `${formatCurrency(newMonthly)} mtl.`,
      effect,
      effectLabel: buildProductEffectLabel(effect, effectType),
      effectType,
      effectSource: 'calculated' as const,
    }
  }

  const manualEffect = parseMoneyInput(change.monthlyEffect)
  const effectType: ProductEffectType = hasProductContent(change)
    ? change.effectType !== 'missing'
      ? change.effectType
      : inferProductEffectType(manualEffect)
    : 'missing'

  return {
    oldMonthly,
    newMonthly,
    oldMonthlyLabel: oldMonthly !== undefined ? `${formatCurrency(oldMonthly)} mtl.` : MISSING,
    newMonthlyLabel: newMonthly !== undefined ? `${formatCurrency(newMonthly)} mtl.` : MISSING,
    effect: manualEffect,
    effectLabel: buildProductEffectLabel(manualEffect, effectType),
    effectType,
    effectSource: manualEffect !== undefined || effectType !== 'missing' ? ('manual' as const) : ('missing' as const),
  }
}

export function calculateProductContributionTotals(productChanges: EditableProductChange[]) {
  let oldTotal = 0
  let newTotal = 0
  let oldCount = 0
  let newCount = 0
  let pairedCount = 0

  for (const change of productChanges) {
    const oldMonthly = parseMoneyInput(change.oldMonthly)
    const newMonthly = parseMoneyInput(change.newMonthly)
    if (oldMonthly !== undefined) {
      oldTotal += oldMonthly
      oldCount += 1
    }
    if (newMonthly !== undefined) {
      newTotal += newMonthly
      newCount += 1
    }
    if (oldMonthly !== undefined && newMonthly !== undefined) pairedCount += 1
  }

  const hasOldTotal = oldCount > 0
  const hasNewTotal = newCount > 0
  const effect = hasOldTotal && hasNewTotal ? oldTotal - newTotal : undefined

  return {
    oldTotal: hasOldTotal ? oldTotal : undefined,
    newTotal: hasNewTotal ? newTotal : undefined,
    effect,
    oldCount,
    newCount,
    pairedCount,
    canApply: hasOldTotal && hasNewTotal,
  }
}

function inferProductEffectType(value: number | undefined): ProductEffectType {
  if (value === undefined) return 'missing'
  if (Math.abs(value) < 0.005) return 'neutral'
  return value > 0 ? 'saving' : 'extra'
}

function buildProductEffectLabel(value: number | undefined, type: ProductEffectType) {
  if (type === 'missing') return CHECK
  if (value === undefined) return CHECK
  if (type === 'neutral') return 'neutral'
  if (type === 'saving') return `${formatCurrency(value, { plus: true })} mtl.`
  if (type === 'new') return `neuer Baustein: ${formatCurrency(value)} mtl.`
  if (type === 'extra') return `Mehr: ${formatCurrency(Math.abs(value))} mtl.`
  return `${formatCurrency(value)} mtl.`
}

function buildLongTermSaving(calculated: PraeLuxCalculatedValues): LongTermSaving {
  if (calculated.pureSavingUntilTarget !== undefined && calculated.optimizedMonthlySaving !== undefined) {
    return {
      value: calculated.pureSavingUntilTarget,
      label: formatCurrency(calculated.pureSavingUntilTarget, { plus: calculated.pureSavingUntilTarget >= 0 }),
      status: 'present',
      note: buildMonthlyEquivalentNote(calculated.pureSavingUntilTarget, calculated),
    }
  }

  return {
    label: CHECK,
    status: 'check',
    note: 'Bitte monatliche Ersparnisse und Anlagehorizont erfassen.',
  }
}

function buildMonthlyEquivalentNote(total: number, calculated: PraeLuxCalculatedValues) {
  const months = calculationMonths(calculated.remainingYears)

  if (months === undefined) return `Monatswert nach Geburtsdatum und Zielalter berechenbar.`

  const annualRate =
    calculated.generalInterestRate !== undefined && calculated.generalInterestRate > 0
      ? calculated.generalInterestRate
      : undefined
  const monthlyEquivalent =
    annualRate === undefined
      ? total / months
      : calculateMonthlyDepositForTarget(total, months, annualRate)

  if (annualRate !== undefined) {
    return `Dies entspricht ca. ${formatCurrency(monthlyEquivalent)} pro Monat bei ${formatPercent(
      annualRate,
    )} Zinseszins p.a.`
  }

  return `Dies entspricht ca. ${formatCurrency(monthlyEquivalent)} pro Monat ohne Zinseszins gerechnet.`
}

function buildLongTermSavingNotice(calculated: PraeLuxCalculatedValues) {
  if (calculated.generalInterestRate !== undefined && calculated.generalInterestRate > 0) {
    return `Zinseszins mit ${formatPercent(calculated.generalInterestRate)} p.a. modelliert`
  }

  return 'Beitragsersparnis ohne Zinseszins gerechnet'
}

function buildRuntimeNotice(calculated: PraeLuxCalculatedValues) {
  if (calculated.remainingYears === undefined) return `Anlagehorizont bis ${calculated.targetAge} offen`
  return calculated.remainingYears === 1 ? 'Anlagehorizont: 1 Jahr' : `Anlagehorizont: ${calculated.remainingYears} Jahre`
}

function buildRuntimeLabel(calculated: PraeLuxCalculatedValues) {
  if (calculated.remainingYears === undefined) return `bis ${calculated.targetAge}`
  return calculated.remainingYears === 1 ? 'über 1 Jahr' : `über ${calculated.remainingYears} Jahre`
}

function buildOptionalPotential(calculated: PraeLuxCalculatedValues) {
  if (calculated.optionalPotentialUntilTarget !== undefined && calculated.optionalMonthlyInvestment !== undefined) {
    const ratePart =
      calculated.generalInterestRate !== undefined && calculated.generalInterestRate > 0
        ? ` bei ${formatPercent(calculated.generalInterestRate)} allgemeinem Zinssatz p.a.`
        : ' ohne Renditeannahme'
    return `Wenn optional ${formatCurrency(
      calculated.optionalMonthlyInvestment,
    )} mtl. zusätzlich eingesetzt werden, ergibt das${ratePart} ${formatCurrency(
      calculated.optionalPotentialUntilTarget,
      { plus: true },
    )} ${buildRuntimeLabel(calculated)}.`
  }

  return 'Kein optionales Zusatzpotenzial ausgewiesen, solange kein separater optionaler Monatsbetrag erfasst ist.'
}

function buildConclusion(
  form: PraeLuxFormData,
  impact: Mandantenwirkung,
  longTermSaving: LongTermSaving,
) {
  const custom = cleanText(form.conclusionNote)
  if (custom) return custom

  if (impact.type === 'saving') {
    const longTermPart =
      longTermSaving.status === 'present'
        ? ' Die langfristige Beitragsersparnis ist separat ausgewiesen.'
        : ' Die langfristige Wirkung sollte nach Prüfung der Bestandsbausteine ergänzt werden.'
    return `Das neue Konzept verbessert die laufende Beitragsstruktur und schafft finanziellen Spielraum. Die bestehende Absicherung wird nicht schlechtgeredet, sondern gezielt optimiert.${longTermPart}`
  }

  if (impact.type === 'extra') {
    return 'Das neue Konzept verursacht einen Mehrbeitrag. Entscheidend ist die transparente fachliche Begründung, welche zusätzlichen oder verbesserten Bausteine diesen Mehraufwand erklären.'
  }

  return 'Die vorliegenden Angaben reichen noch nicht aus, um die finanzielle Wirkung vollständig zu bewerten. Fehlende Werte sind markiert und sollten vor der Mandantenfreigabe ergänzt werden.'
}

function moneyFactLabel(value: string, suffix: string) {
  const money = parseMoneyInput(value)
  if (money !== undefined) return `${formatCurrency(money)} ${suffix}`
  return cleanText(value) || MISSING
}

function buildHorizonLabel(calculated: PraeLuxCalculatedValues) {
  if (calculated.remainingYears === undefined) return MISSING
  if (calculated.remainingYears === 0) return `bis ${calculated.targetAge} erreicht`
  return `${calculated.remainingYears} Jahre bis ${calculated.targetAge}`
}

function hasProductContent(change: EditableProductChange) {
  return Boolean(
    cleanText(change.oldProduct) ||
      cleanText(change.newProduct) ||
      cleanText(change.oldMonthly) ||
      cleanText(change.newMonthly) ||
      cleanText(change.monthlyEffect) ||
      change.effectType !== 'missing',
  )
}

function calculateMonthlySavingsPotential(monthlyAmount: number, years: number, annualRate: number | undefined) {
  const months = Math.max(0, Math.round(years * 12))
  if (months === 0) return 0
  if (annualRate === undefined || annualRate <= 0) return monthlyAmount * months
  const monthlyRate = annualRate / 100 / 12
  return monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
}

function calculateMonthlyDepositForTarget(targetValue: number, months: number, annualRate: number) {
  if (months <= 0) return 0
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate <= 0) return targetValue / months
  return targetValue / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
}

function calculationMonths(years: number | undefined) {
  if (years === undefined) return undefined
  const months = Math.max(0, Math.round(years * 12))
  return months > 0 ? months : undefined
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} %`
}

function hasValue(value: string) {
  return parseMoneyInput(value) !== undefined || Boolean(cleanText(value))
}

function parseInteger(value: string) {
  const number = Number.parseInt(value.replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(number) ? number : undefined
}

function parseHorizonYears(value: string | undefined, age: number | undefined) {
  if (!value) return undefined
  const normalized = value.trim().toLocaleLowerCase('de-DE').replace(',', '.')
  if (!normalized) return undefined

  const matches = [...normalized.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number.parseFloat(match[0]))
  const first = matches.find((number) => Number.isFinite(number))
  if (first === undefined || first < 0) return undefined

  if (matches.length === 1 && normalized.includes('bis') && age !== undefined && first > age && first <= 110) {
    return Math.max(0, Math.round(first - age))
  }

  return first <= 100 ? Math.round(first) : undefined
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, ' ').trim().slice(0, 160) ?? ''
}

function formatIsoDate(value: string) {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return undefined
  return new Intl.DateTimeFormat('de-DE').format(date)
}

function calculateAgeFromIsoDate(value: string) {
  if (!value) return undefined
  const birth = new Date(`${value}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return undefined
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age >= 0 && age < 110 ? age : undefined
}
