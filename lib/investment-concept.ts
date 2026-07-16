export type InvestmentConceptForm = {
  clientName: string
  age: string
  targetAge: string
  depotMonthly: string
  retirementMonthly: string
  reserveMonthly: string
  insuranceMonthly: string
  depotRate: string
  retirementRate: string
}

export type InvestmentCategory = {
  key: string
  label: string
  shortLabel: string
  monthly: number
  monthlyLabel: string
  color: string
}

export type InvestmentProjectionPoint = {
  year: number
  depot: number
  retirement: number
}

export type InvestmentConceptData = {
  clientName: string
  age?: number
  targetAge: number
  horizonYears?: number
  totalMonthly: number
  totalMonthlyLabel: string
  depotFuture: number
  retirementFuture: number
  totalFuture: number
  depotRate?: number
  retirementRate?: number
  categories: InvestmentCategory[]
  points: InvestmentProjectionPoint[]
}

const DEFAULT_TARGET_AGE = 67

export function createEmptyInvestmentConceptForm(): InvestmentConceptForm {
  return {
    clientName: '',
    age: '',
    targetAge: String(DEFAULT_TARGET_AGE),
    depotMonthly: '',
    retirementMonthly: '',
    reserveMonthly: '',
    insuranceMonthly: '',
    depotRate: '',
    retirementRate: '',
  }
}

export function buildInvestmentConcept(form: InvestmentConceptForm): InvestmentConceptData {
  const age = parseInteger(form.age)
  const targetAge = parseInteger(form.targetAge) ?? DEFAULT_TARGET_AGE
  const horizonYears = age !== undefined ? Math.max(0, targetAge - age) : undefined
  const depotMonthly = parseMoneyInput(form.depotMonthly) ?? 0
  const retirementMonthly = parseMoneyInput(form.retirementMonthly) ?? 0
  const reserveMonthly = parseMoneyInput(form.reserveMonthly) ?? 0
  const insuranceMonthly = parseMoneyInput(form.insuranceMonthly) ?? 0
  const depotRate = parsePercentInput(form.depotRate)
  const retirementRate = parsePercentInput(form.retirementRate)
  const totalMonthly = depotMonthly + retirementMonthly + reserveMonthly + insuranceMonthly
  const projectionYears = horizonYears ?? 0
  const depotFuture = calculateAnnualAdvanceFutureValue(depotMonthly, projectionYears, depotRate)
  const retirementFuture = calculateAnnualAdvanceFutureValue(retirementMonthly, projectionYears, retirementRate)

  return {
    clientName: cleanText(form.clientName) || 'Investmentkonzept',
    age,
    targetAge,
    horizonYears,
    totalMonthly,
    totalMonthlyLabel: formatMonthly(totalMonthly),
    depotFuture,
    retirementFuture,
    totalFuture: depotFuture + retirementFuture,
    depotRate,
    retirementRate,
    categories: [
      {
        key: 'depot',
        label: 'Depot',
        shortLabel: 'Depot',
        monthly: depotMonthly,
        monthlyLabel: formatMonthly(depotMonthly),
        color: '#0a1f38',
      },
      {
        key: 'insurance',
        label: 'Versicherungen / Krankenkasse',
        shortLabel: 'Versicherungen',
        monthly: insuranceMonthly,
        monthlyLabel: formatMonthly(insuranceMonthly),
        color: '#c7a35c',
      },
      {
        key: 'reserve',
        label: 'Reservehaltung / Fixkosten',
        shortLabel: 'Reserve',
        monthly: reserveMonthly,
        monthlyLabel: formatMonthly(reserveMonthly),
        color: '#247477',
      },
      {
        key: 'retirement',
        label: 'Altersvorsorge',
        shortLabel: 'Altersvorsorge',
        monthly: retirementMonthly,
        monthlyLabel: formatMonthly(retirementMonthly),
        color: '#17764d',
      },
    ],
    points: buildProjectionPoints(projectionYears, depotMonthly, retirementMonthly, depotRate, retirementRate),
  }
}

export function formatInvestmentCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatInvestmentPercent(value: number | undefined) {
  if (value === undefined) return 'ohne Zins'
  return `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} %`
}

export function slugifyInvestmentName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

function buildProjectionPoints(
  horizonYears: number,
  depotMonthly: number,
  retirementMonthly: number,
  depotRate: number | undefined,
  retirementRate: number | undefined,
) {
  const years = Array.from(new Set([0, Math.min(10, horizonYears), Math.min(20, horizonYears), horizonYears]))
    .filter((year) => year >= 0)
    .sort((a, b) => a - b)

  return years.map((year) => ({
    year,
    depot: calculateAnnualAdvanceFutureValue(depotMonthly, year, depotRate),
    retirement: calculateAnnualAdvanceFutureValue(retirementMonthly, year, retirementRate),
  }))
}

function calculateAnnualAdvanceFutureValue(monthlyAmount: number, years: number, annualRate: number | undefined) {
  const fullYears = Math.max(0, Math.round(years))
  if (fullYears === 0 || monthlyAmount === 0) return 0
  if (annualRate === undefined || annualRate <= 0) return monthlyAmount * 12 * fullYears

  const rate = annualRate / 100
  const yearlyAdvanceDepositFactor = 12 + rate * 6.5
  return monthlyAmount * yearlyAdvanceDepositFactor * ((Math.pow(1 + rate, fullYears) - 1) / rate)
}

function formatMonthly(value: number) {
  return `${formatInvestmentCurrency(value)} mtl.`
}

function parseMoneyInput(value: string | undefined) {
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

function parsePercentInput(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const cleaned = trimmed.replace(/[^\d,.-]/g, '').replace(',', '.')
  const number = Number.parseFloat(cleaned)
  if (!Number.isFinite(number)) return undefined
  return number
}

function parseInteger(value: string) {
  const number = Number.parseInt(value.replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(number) ? number : undefined
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, ' ').trim().slice(0, 160) ?? ''
}
