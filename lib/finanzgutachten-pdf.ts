import type { EditableProductChange, PraeLuxFormData } from './praelux'

export type FinanzgutachtenPdfValues = Partial<
  Pick<PraeLuxFormData, 'existingMonthly' | 'existingYearly' | 'recommendedMonthly' | 'recommendedYearly'>
>

export type FinanzgutachtenProductImport = Partial<
  Pick<EditableProductChange, 'oldProduct' | 'oldMonthly' | 'newProduct' | 'newMonthly'>
> & {
  categoryKey: string
}

export type FinanzgutachtenPdfResult = {
  values: FinanzgutachtenPdfValues
  products: FinanzgutachtenProductImport[]
  labels: string[]
  productLabels: string[]
}

type PdfTextItem = {
  str?: string
  transform?: number[]
}

type TextPart = {
  str: string
  page: number
  x: number
  y: number
}

type TextRow = {
  page: number
  y: number
  parts: TextPart[]
  text: string
}

type ConceptSection = 'existing' | 'recommended'

type ComparisonMoneyIndexes = {
  oldMonthly: number
  newMonthly: number
  oldYearly?: number
  newYearly?: number
}

const productDefinitions = [
  {
    key: 'berufsunfaehigkeitsversicherung',
    aliases: [
      'Berufsunfähigkeitsversicherung',
      'Berufsunfaehigkeitsversicherung',
      'Berufsunfähigkeit',
      'Berufsunfaehigkeit',
      'Arbeitskraftabsicherung',
      'Dienstunfähigkeitsversicherung',
      'Dienstunfaehigkeitsversicherung',
    ],
  },
  {
    key: 'dienst-und-privathaftpflichtversicherung',
    aliases: [
      'Dienst- und Privathaftpflichtversicherung',
      'Dienst- und Privatha/pflichtversicherung',
      'Diensthaftpflicht',
      'Privathaftpflicht',
      'Private Haftpflichtversicherung',
      'Haftpflichtversicherung',
      'Haftpflicht',
    ],
  },
  {
    key: 'unfallversicherung',
    aliases: ['Unfallversicherung', 'Unfall'],
  },
  {
    key: 'kranken-und-pflegeversicherung',
    aliases: [
      'Kranken- und Pflegeversicherung',
      'Kranken- und Pflege',
      'Krankenversicherung',
      'Pflegeversicherung',
      'Krankenkasse',
      'PKV',
      'GKV',
    ],
  },
  {
    key: 'altersvorsorge',
    aliases: [
      'Altersvorsorge',
      'Rentenversicherung',
      'Fondsgebundene Rentenversicherung',
      'Riester',
      'Rürup',
      'Ruerup',
      'Betriebliche Altersvorsorge',
    ],
  },
  {
    key: 'hausratsversicherung',
    aliases: ['Hausratsversicherung', 'Hausratversicherung', 'Hausrat'],
  },
  {
    key: 'zahnzusatzversicherung',
    aliases: ['Zahnzusatzversicherung', 'Zahnzusatz', 'Zahnversicherung'],
  },
  {
    key: 'rechtsschutzversicherung',
    aliases: ['Rechtsschutzversicherung', 'Rechtsschutz'],
  },
] as const

const sectionKeywords: Record<ConceptSection, string[]> = {
  existing: [
    'bestandsaufnahme',
    'bestand',
    'bestehende',
    'bestehend',
    'ist situation',
    'istzustand',
    'aktuelle situation',
    'vorher',
  ],
  recommended: [
    'empfohlenes konzept',
    'empfehlung',
    'konzept',
    'neues konzept',
    'nachher',
    'soll',
    'optimiert',
    'zielkonzept',
  ],
}

export async function extractFinanzgutachtenFromPdf(file: File): Promise<FinanzgutachtenPdfResult> {
  const rows = await extractRows(file)
  const values: FinanzgutachtenPdfValues = {}
  const labels: string[] = []
  const productMap = new Map<string, FinanzgutachtenProductImport>()

  parseStructuredRows(rows, values, labels, productMap)
  parseSideBySideRows(rows, values, labels, productMap)
  parseFlexibleRows(rows, values, labels, productMap)

  const products = [...productMap.values()]

  return {
    values,
    products,
    labels,
    productLabels: products.map((product) => product.categoryKey),
  }
}

function parseStructuredRows(
  rows: TextRow[],
  values: FinanzgutachtenPdfValues,
  labels: string[],
  productMap: Map<string, FinanzgutachtenProductImport>,
) {
  let section: ConceptSection | undefined

  for (const row of rows) {
    const rowText = normalizeText(row.text)
    const nextSection = detectSection(rowText)

    if (nextSection) {
      section = nextSection
      continue
    }

    if (!section) continue

    const product = cellText(row, 140, 330)
    const company = cellText(row, 330, 445)
    const monthly = normalizeMoney(cellText(row, 445, 545))
    const yearly = normalizeMoney(cellText(row, 545, 625))

    if (!monthly && !yearly) continue

    if (isTotalLabel(product)) {
      addConceptTotals(values, labels, section, monthly, yearly)
      continue
    }

    const categoryKey = categoryKeyForProduct(product)
    if (!categoryKey) continue
    mergeProductImport(productMap, categoryKey, section, normalizeCompany(company), monthly)
  }
}

function parseFlexibleRows(
  rows: TextRow[],
  values: FinanzgutachtenPdfValues,
  labels: string[],
  productMap: Map<string, FinanzgutachtenProductImport>,
) {
  let section: ConceptSection | undefined

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const normalizedRow = normalizeText(row.text)
    const nextSection = detectSection(normalizedRow)

    if (nextSection) {
      section = nextSection
      continue
    }

    if (!section) continue

    const line = compactText([row.text, rows[index + 1]?.page === row.page ? rows[index + 1]?.text : ''].join(' '))
    const normalizedLine = normalizeText(line)
    const moneyValues = extractMoneyValues(line)

    if (moneyValues.length > 0 && isTotalLine(normalizedLine)) {
      addConceptTotalsIfMissing(values, labels, section, moneyValues[0] ?? '', moneyValues[1] ?? '')
      continue
    }

    const categoryKey = categoryKeyForProduct(line)
    if (!categoryKey || moneyValues.length === 0) continue

    mergeProductImportIfMissing(productMap, categoryKey, section, extractCompanyFromLine(line, categoryKey), moneyValues[0] ?? '')
  }

  parseLabelledTotals(rows, values, labels)
}

function parseSideBySideRows(
  rows: TextRow[],
  values: FinanzgutachtenPdfValues,
  labels: string[],
  productMap: Map<string, FinanzgutachtenProductImport>,
) {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const line = compactText([row.text, rows[index + 1]?.page === row.page ? rows[index + 1]?.text : ''].join(' '))
    const normalizedLine = normalizeText(line)
    const moneyValues = extractMoneyValues(line)

    if (moneyValues.length < 2) continue

    if (isTotalLine(normalizedLine)) {
      addSideBySideTotals(values, labels, moneyValues)
      continue
    }

    const categoryKey = categoryKeyForProduct(line)
    if (!categoryKey) continue

    const [oldMonthly, newMonthly] = pickMonthlyComparisonValues(moneyValues)
    if (!oldMonthly || !newMonthly) continue

    const companies = extractCompaniesFromComparisonLine(line, categoryKey, moneyValues)
    mergeProductImportIfMissing(productMap, categoryKey, 'existing', companies.oldProduct, oldMonthly)
    mergeProductImportIfMissing(productMap, categoryKey, 'recommended', companies.newProduct, newMonthly)
  }
}

function parseLabelledTotals(rows: TextRow[], values: FinanzgutachtenPdfValues, labels: string[]) {
  for (const row of rows) {
    const normalized = normalizeText(row.text)
    const moneyValues = extractMoneyValues(row.text)

    if (moneyValues.length === 0) continue

    if (hasAny(normalized, ['bestand', 'ist', 'aktuell']) && hasAny(normalized, ['monat', 'mtl'])) {
      addImportedTotal(values, labels, 'existingMonthly', moneyValues[0], 'Bestand monatlich')
    }
    if (hasAny(normalized, ['bestand', 'ist', 'aktuell']) && hasAny(normalized, ['jahr', 'pa', 'p.a'])) {
      addImportedTotal(values, labels, 'existingYearly', moneyValues[moneyValues.length - 1], 'Bestand jährlich')
    }
    if (hasAny(normalized, ['empfohlen', 'konzept', 'neu', 'soll']) && hasAny(normalized, ['monat', 'mtl'])) {
      addImportedTotal(values, labels, 'recommendedMonthly', moneyValues[0], 'Konzept monatlich')
    }
    if (hasAny(normalized, ['empfohlen', 'konzept', 'neu', 'soll']) && hasAny(normalized, ['jahr', 'pa', 'p.a'])) {
      addImportedTotal(values, labels, 'recommendedYearly', moneyValues[moneyValues.length - 1], 'Konzept jährlich')
    }
  }
}

async function extractRows(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()
  const data = new Uint8Array(await file.arrayBuffer())
  const documentTask = pdfjs.getDocument({ data })
  const pdf = await documentTask.promise
  const parts: TextPart[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()

    for (const item of textContent.items as PdfTextItem[]) {
      const str = item.str ?? ''
      const transform = item.transform ?? []
      const x = transform[4]
      const y = transform[5]
      if (!str || x === undefined || y === undefined) continue
      parts.push({ str, page: pageNumber, x, y })
    }
  }

  return groupRows(parts)
}

function groupRows(parts: TextPart[]) {
  const rows: TextRow[] = []
  const sorted = [...parts].sort((left, right) => left.page - right.page || right.y - left.y || left.x - right.x)

  for (const part of sorted) {
    const row = rows.find((candidate) => candidate.page === part.page && Math.abs(candidate.y - part.y) <= 2)

    if (row) {
      row.parts.push(part)
      continue
    }

    rows.push({ page: part.page, y: part.y, parts: [part], text: '' })
  }

  return rows
    .map((row) => {
      const rowParts = [...row.parts].sort((left, right) => left.x - right.x)
      return {
        ...row,
        parts: rowParts,
        text: compactText(rowParts.map((part) => part.str).join('')),
      }
    })
    .sort((left, right) => left.page - right.page || right.y - left.y)
}

function detectSection(rowText: string): ConceptSection | undefined {
  if (hasAny(rowText, sectionKeywords.existing)) return 'existing'
  if (hasAny(rowText, sectionKeywords.recommended)) return 'recommended'
  return undefined
}

function addConceptTotals(
  values: FinanzgutachtenPdfValues,
  labels: string[],
  section: ConceptSection,
  monthly: string,
  yearly: string,
) {
  if (section === 'existing') {
    addImportedTotal(values, labels, 'existingMonthly', monthly, 'Bestand monatlich')
    addImportedTotal(values, labels, 'existingYearly', yearly, 'Bestand jährlich')
    return
  }

  addImportedTotal(values, labels, 'recommendedMonthly', monthly, 'Konzept monatlich')
  addImportedTotal(values, labels, 'recommendedYearly', yearly, 'Konzept jährlich')
}

function addConceptTotalsIfMissing(
  values: FinanzgutachtenPdfValues,
  labels: string[],
  section: ConceptSection,
  monthly: string,
  yearly: string,
) {
  if (section === 'existing') {
    if (!values.existingMonthly) addImportedTotal(values, labels, 'existingMonthly', monthly, 'Bestand monatlich')
    if (!values.existingYearly) addImportedTotal(values, labels, 'existingYearly', yearly, 'Bestand jährlich')
    return
  }

  if (!values.recommendedMonthly) addImportedTotal(values, labels, 'recommendedMonthly', monthly, 'Konzept monatlich')
  if (!values.recommendedYearly) addImportedTotal(values, labels, 'recommendedYearly', yearly, 'Konzept jährlich')
}

function addSideBySideTotals(values: FinanzgutachtenPdfValues, labels: string[], moneyValues: string[]) {
  const [oldMonthly, newMonthly, oldYearly, newYearly] = pickMonthlyAndYearlyComparisonValues(moneyValues)

  addImportedTotal(values, labels, 'existingMonthly', oldMonthly, 'Bestand monatlich')
  addImportedTotal(values, labels, 'recommendedMonthly', newMonthly, 'Konzept monatlich')
  addImportedTotal(values, labels, 'existingYearly', oldYearly, 'Bestand jährlich')
  addImportedTotal(values, labels, 'recommendedYearly', newYearly, 'Konzept jährlich')
}

function addImportedTotal<K extends keyof FinanzgutachtenPdfValues>(
  values: FinanzgutachtenPdfValues,
  labels: string[],
  key: K,
  value: FinanzgutachtenPdfValues[K] | undefined,
  label: string,
) {
  if (!value || values[key]) return
  values[key] = value
  labels.push(label)
}

function mergeProductImport(
  productMap: Map<string, FinanzgutachtenProductImport>,
  categoryKey: string,
  section: ConceptSection,
  productValue: string,
  monthly: string,
) {
  const current = productMap.get(categoryKey) ?? { categoryKey }

  if (section === 'existing') {
    current.oldProduct = productValue
    current.oldMonthly = monthly
  } else {
    current.newProduct = productValue
    current.newMonthly = monthly
  }

  productMap.set(categoryKey, current)
}

function mergeProductImportIfMissing(
  productMap: Map<string, FinanzgutachtenProductImport>,
  categoryKey: string,
  section: ConceptSection,
  productValue: string,
  monthly: string,
) {
  const current = productMap.get(categoryKey) ?? { categoryKey }

  if (section === 'existing') {
    current.oldProduct ||= productValue
    current.oldMonthly ||= monthly
  } else {
    current.newProduct ||= productValue
    current.newMonthly ||= monthly
  }

  productMap.set(categoryKey, current)
}

function cellText(row: TextRow, minX: number, maxX: number) {
  return compactText(row.parts.filter((part) => part.x >= minX && part.x < maxX).map((part) => part.str).join(''))
}

function normalizeMoney(value: string) {
  return extractMoneyValues(value)[0] ?? ''
}

function pickMonthlyComparisonValues(values: string[]) {
  const [oldMonthly, newMonthly] = pickMonthlyAndYearlyComparisonValues(values)
  return [oldMonthly, newMonthly] as const
}

function pickMonthlyAndYearlyComparisonValues(values: string[]) {
  const indexes = comparisonMoneyIndexes(values)

  return [
    values[indexes.oldMonthly],
    values[indexes.newMonthly],
    indexes.oldYearly === undefined ? undefined : values[indexes.oldYearly],
    indexes.newYearly === undefined ? undefined : values[indexes.newYearly],
  ] as const
}

function comparisonMoneyIndexes(values: string[]): ComparisonMoneyIndexes {
  if (values.length >= 4 && isLikelyYearlyValue(values[0], values[1]) && isLikelyYearlyValue(values[2], values[3])) {
    return { oldMonthly: 0, newMonthly: 2, oldYearly: 1, newYearly: 3 }
  }

  if (values.length >= 3 && isLikelyYearlyValue(values[0], values[1])) {
    return { oldMonthly: 0, newMonthly: 2, oldYearly: 1 }
  }

  return { oldMonthly: 0, newMonthly: 1 }
}

function isLikelyYearlyValue(monthlyValue: string | undefined, yearlyValue: string | undefined) {
  const monthly = parseGermanMoney(monthlyValue)
  const yearly = parseGermanMoney(yearlyValue)

  if (!monthly || !yearly) return false
  return Math.abs(yearly - monthly * 12) <= 1
}

function parseGermanMoney(value: string | undefined) {
  if (!value) return 0
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  return Number.parseFloat(normalized)
}

function extractMoneyValues(value: string) {
  const matches = value.match(/[+-]?\d{1,3}(?:(?:\.\d{3})+|\d*)?,\d{2}\s*(?:€|eur)?/gi) ?? []
  return matches.map((match) => {
    const cleaned = match.replace(/\s*(eur|€)\s*$/i, '').trim()
    return `${cleaned} €`
  })
}

function normalizeCompany(value: string) {
  const company = compactText(value)
  return company && company !== '-' ? company : '-'
}

function extractCompanyFromLine(line: string, categoryKey: string) {
  const firstMoney = line.search(/[+-]?\d{1,3}(?:(?:\.\d{3})+|\d*)?,\d{2}/)
  let prefix = firstMoney >= 0 ? line.slice(0, firstMoney) : line
  const definition = productDefinitions.find((product) => product.key === categoryKey)

  for (const alias of [...(definition?.aliases ?? [])].sort((left, right) => right.length - left.length)) {
    prefix = prefix.replace(new RegExp(escapeRegExp(alias).replace(/\s+/g, '\\s+'), 'gi'), ' ')
  }

  prefix = prefix
    .replace(/\b(produkt|gesellschaft|anbieter|tarif|monatsbeitrag|jahresbeitrag|beitrag|alt|neu|bestand|konzept)\b/gi, ' ')
    .replace(/[|:;/]+/g, ' ')

  return normalizeCompany(prefix)
}

function extractCompaniesFromComparisonLine(line: string, categoryKey: string, moneyValues: string[]) {
  const positions = [...line.matchAll(/[+-]?\d{1,3}(?:(?:\.\d{3})+|\d*)?,\d{2}/g)].map((match) => ({
    index: match.index ?? -1,
    length: match[0].length,
  }))
  const indexes = comparisonMoneyIndexes(moneyValues)
  const oldMoney = positions[indexes.oldMonthly]
  const newMoney = positions[indexes.newMonthly]

  if (!oldMoney || !newMoney) {
    const fallback = extractCompanyFromLine(line, categoryKey)
    return { oldProduct: fallback, newProduct: '-' }
  }

  const previousMoney = positions[indexes.newMonthly - 1] ?? oldMoney

  return {
    oldProduct: cleanCompanySegment(line.slice(0, oldMoney.index), categoryKey),
    newProduct: cleanCompanySegment(line.slice(previousMoney.index + previousMoney.length, newMoney.index), categoryKey),
  }
}

function cleanCompanySegment(value: string, categoryKey: string) {
  let cleaned = value
  const definition = productDefinitions.find((product) => product.key === categoryKey)

  for (const alias of [...(definition?.aliases ?? [])].sort((left, right) => right.length - left.length)) {
    cleaned = cleaned.replace(new RegExp(escapeRegExp(alias).replace(/\s+/g, '\\s+'), 'gi'), ' ')
  }

  cleaned = cleaned
    .replace(/\b(produkt|gesellschaft|anbieter|tarif|monatsbeitrag|jahresbeitrag|beitrag|alt|neu|bestand|konzept|empfehlung|aktuell|vorher|nachher)\b/gi, ' ')
    .replace(/[|:;/]+/g, ' ')

  return normalizeCompany(cleaned)
}

function categoryKeyForProduct(product: string) {
  const normalized = normalizeText(product)

  for (const definition of productDefinitions) {
    if (definition.aliases.some((alias) => matchesAlias(normalized, alias))) return definition.key
  }

  if (normalized.includes('privatha') && normalized.includes('pflicht')) {
    return 'dienst-und-privathaftpflichtversicherung'
  }

  return ''
}

function matchesAlias(normalizedText: string, alias: string) {
  const normalizedAlias = normalizeText(alias)
  if (normalizedAlias.length <= 3) return normalizedText.split(/\s+/).includes(normalizedAlias)
  return normalizedText.includes(normalizedAlias)
}

function isTotalLabel(value: string) {
  return isTotalLine(normalizeText(value))
}

function isTotalLine(value: string) {
  return hasAny(value, ['gesamt', 'summe', 'total'])
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term))
}

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeText(value: string) {
  return compactText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/\//g, '')
    .toLocaleLowerCase('de-DE')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
