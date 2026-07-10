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
  x: number
  y: number
}

type TextRow = {
  y: number
  parts: TextPart[]
  text: string
}

type ConceptSection = 'existing' | 'recommended'

export async function extractFinanzgutachtenFromPdf(file: File): Promise<FinanzgutachtenPdfResult> {
  const rows = await extractRows(file)
  const values: FinanzgutachtenPdfValues = {}
  const labels: string[] = []
  const productMap = new Map<string, FinanzgutachtenProductImport>()

  let section: ConceptSection | undefined

  for (const row of rows) {
    const rowText = normalizeText(row.text)

    if (rowText.includes('bestandsaufnahme')) {
      section = 'existing'
      continue
    }

    if (rowText.includes('empfohlenes konzept')) {
      section = 'recommended'
      continue
    }

    if (!section) continue

    const product = cellText(row, 140, 330)
    const company = cellText(row, 330, 445)
    const monthly = normalizeMoney(cellText(row, 445, 545))
    const yearly = normalizeMoney(cellText(row, 545, 625))

    if (!monthly && !yearly) continue

    if (normalizeText(product).startsWith('gesamt')) {
      addConceptTotals(values, labels, section, monthly, yearly)
      continue
    }

    const categoryKey = categoryKeyForProduct(product)
    if (!categoryKey) continue

    const current = productMap.get(categoryKey) ?? { categoryKey }
    const productValue = normalizeCompany(company)

    if (section === 'existing') {
      current.oldProduct = productValue
      current.oldMonthly = monthly
    } else {
      current.newProduct = productValue
      current.newMonthly = monthly
    }

    productMap.set(categoryKey, current)
  }

  const products = [...productMap.values()]

  return {
    values,
    products,
    labels,
    productLabels: products.map((product) => product.categoryKey),
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
      parts.push({ str, x, y })
    }
  }

  return groupRows(parts)
}

function groupRows(parts: TextPart[]) {
  const rows: TextRow[] = []
  const sorted = [...parts].sort((left, right) => right.y - left.y || left.x - right.x)

  for (const part of sorted) {
    const row = rows.find((candidate) => Math.abs(candidate.y - part.y) <= 2)

    if (row) {
      row.parts.push(part)
      continue
    }

    rows.push({ y: part.y, parts: [part], text: '' })
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
    .sort((left, right) => right.y - left.y)
}

function addConceptTotals(
  values: FinanzgutachtenPdfValues,
  labels: string[],
  section: ConceptSection,
  monthly: string,
  yearly: string,
) {
  if (section === 'existing') {
    if (monthly) {
      values.existingMonthly = monthly
      labels.push('Bestand monatlich')
    }
    if (yearly) {
      values.existingYearly = yearly
      labels.push('Bestand jährlich')
    }
    return
  }

  if (monthly) {
    values.recommendedMonthly = monthly
    labels.push('Konzept monatlich')
  }
  if (yearly) {
    values.recommendedYearly = yearly
    labels.push('Konzept jährlich')
  }
}

function cellText(row: TextRow, minX: number, maxX: number) {
  return compactText(row.parts.filter((part) => part.x >= minX && part.x < maxX).map((part) => part.str).join(''))
}

function normalizeMoney(value: string) {
  const match = value.match(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€?/)
  return match ? `${match[1]} €` : ''
}

function normalizeCompany(value: string) {
  const company = compactText(value)
  return company && company !== '-' ? company : '-'
}

function categoryKeyForProduct(product: string) {
  const normalized = normalizeText(product)

  if (normalized.includes('berufsun')) return 'berufsunfaehigkeitsversicherung'
  if (normalized.includes('haftpflicht') || (normalized.includes('privatha') && normalized.includes('pflicht'))) {
    return 'dienst-und-privathaftpflichtversicherung'
  }
  if (normalized.includes('unfall')) return 'unfallversicherung'
  if (normalized.includes('kranken') || normalized.includes('pflege')) return 'kranken-und-pflegeversicherung'
  if (normalized.includes('altersvorsorge')) return 'altersvorsorge'
  if (normalized.includes('hausrat')) return 'hausratsversicherung'
  if (normalized.includes('zahn')) return 'zahnzusatzversicherung'
  if (normalized.includes('rechtsschutz')) return 'rechtsschutzversicherung'

  return ''
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
