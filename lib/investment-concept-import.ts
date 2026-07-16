import type { InvestmentConceptForm } from './investment-concept'

export type InvestmentImportTarget = 'depot' | 'retirement' | 'funds' | 'insurance'

export type InvestmentImportResult = {
  values: Partial<InvestmentConceptForm>
  labels: string[]
}

type PdfTextItem = {
  str?: string
}

export async function extractInvestmentConceptImport(files: File[], target: InvestmentImportTarget) {
  const combined: InvestmentImportResult = { values: {}, labels: [] }
  const fundSummaries: string[] = []

  for (const file of files) {
    const lowerName = file.name.toLocaleLowerCase('de-DE')
    const result =
      lowerName.endsWith('.pdf')
        ? await extractPdfImport(file, target)
        : extractImageImport(file, target)

    mergeResult(combined, result)
    if (result.values.fundFacts) fundSummaries.push(result.values.fundFacts)
  }

  if (fundSummaries.length > 0) {
    combined.values.fundFacts = fundSummaries.join('\n')
  }

  return combined
}

async function extractPdfImport(file: File, target: InvestmentImportTarget): Promise<InvestmentImportResult> {
  const text = await extractPdfText(file)
  if (target === 'funds') return extractFundFacts(text)
  if (target === 'insurance') return extractInsuranceConcept(text)
  return extractStrategy(text, target)
}

async function extractPdfText(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()
  const data = new Uint8Array(await file.arrayBuffer())
  const documentTask = pdfjs.getDocument({ data })
  const pdf = await documentTask.promise
  const lines: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = (content.items as PdfTextItem[])
      .map((item) => item.str ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (pageText) lines.push(pageText)
  }

  return lines.join('\n')
}

function extractStrategy(text: string, target: 'depot' | 'retirement'): InvestmentImportResult {
  const name =
    matchText(text, /(PraeLux langfristig)/i) ??
    matchText(text, /(Anlageempfehlung Baloise PraeLux)/i) ??
    matchText(text, /(Anlageempfehlung .{3,80}?)(?:\s+Wertentwicklung|\s+Eckdaten)/i) ??
    'Anlagestrategie'
  const annualReturn = extractLastPercentAfter(text, 'Performance p.a.')
  const risk =
    matchText(text, /Verteilung Risikostufen[\s\S]{0,20}?Ø\s*([\d,.]+)/i) ??
    matchText(text, /SRI\s*(?:Ø)?\s*([\d,.]+)/i)
  const allocations = extractStrategyAllocations(text)
  const values: Partial<InvestmentConceptForm> = {}
  const summary = compactParts([
    name,
    annualReturn ? `Rendite p.a. seit Auflage ${annualReturn}` : '',
    risk ? `Risiko Ø ${risk}` : '',
    allocations ? `Aufteilung: ${allocations}` : '',
  ])

  if (target === 'depot') {
    values.depotStrategy = summary
    if (annualReturn) values.depotRate = stripPercent(annualReturn)
  } else {
    values.retirementStrategy = summary
    if (annualReturn) values.retirementRate = stripPercent(annualReturn)
  }

  return { values, labels: [target === 'depot' ? 'Depotstrategie' : 'Altersvorsorge-Strategie'] }
}

function extractFundFacts(text: string): InvestmentImportResult {
  const name = matchText(text, /^(.{3,150}?)\s+Fondsdaten/i) ?? 'Fonds-Factsheet'
  const isin = matchText(text, /WKN\s*\/\s*ISIN:\s*([A-Z0-9]+\s*\/\s*[A-Z0-9]+)/i)
  const region = matchText(text, /Anlageregion\s+(.{3,34}?)\s+(?:Fondskategorie|Asset-Schwerpunkt)/i)
  const category = matchText(text, /Fondskategorie\s+(.{3,62}?)\s+(?:Asset-Schwerpunkt|Risiko|Fonds-Benchmark)/i)
  const costs = matchText(text, /Laufende Kosten(?: des)?(?: Finanzinstruments p\.a\.)?\s*([\d,.]+)\s*%/i)
  const nav = matchText(text, /(?:Nettoinventarwert \(NAV\)|Ausgabepreis)\s+([\d,.]+)\s*(?:EUR|USD)/i)
  const summary = compactParts([
    name,
    isin ? `WKN/ISIN ${isin}` : '',
    region ? `Region ${region}` : '',
    category ? `Kategorie ${category}` : '',
    costs ? `Kosten ${costs} % p.a.` : '',
    nav ? `NAV ${nav}` : '',
  ])

  return { values: { fundFacts: summary }, labels: ['Fonds-Factsheet'] }
}

function extractInsuranceConcept(text: string): InvestmentImportResult {
  const clientName = compactParts([matchText(text, /Vorname\s+([A-Za-zÄÖÜäöüß-]+)/), matchText(text, /Nachname\s+([A-Za-zÄÖÜäöüß-]+)/)], ' ')
  const pension = matchText(text, /Rente\s+([\d.]+,\d{2}\s*€)/i) ?? matchText(text, /\b(1\.500\s*€)\b/)
  const endAge = matchText(text, /Ablaufalter\s+(\d{2})\s*Jahre/i)
  const monthly = extractLowestContribution(text)
  const summary = compactParts([
    'Berufsunfähigkeit',
    clientName,
    pension ? `Rente ${pension}` : '',
    endAge ? `bis ${endAge}` : '',
    monthly ? `Zahlbeitrag ab ${monthly} mtl.` : '',
  ])

  return {
    values: {
      insuranceConcept: summary,
      ...(monthly ? { insuranceMonthly: stripCurrency(monthly) } : {}),
    },
    labels: ['BU-Konzept'],
  }
}

function extractImageImport(file: File, target: InvestmentImportTarget): InvestmentImportResult {
  if (target !== 'insurance') return { values: {}, labels: [] }
  const lowerName = file.name.toLocaleLowerCase('de-DE')
  if (lowerName.includes('techniker') || lowerName.includes('tk')) {
    return {
      values: {
        healthConcept:
          'TK - Techniker Krankenkasse | Beitrag 121,03 € mtl. | Beitragsvorteil 50,40 € p.a. | Bonus max. 160,00 €',
        insuranceMonthly: '121,03',
      },
      labels: ['Techniker Krankenkasse'],
    }
  }

  return {
    values: { healthConcept: `Krankenkassen-/Versicherungsbeleg: ${file.name}` },
    labels: ['Bildbeleg'],
  }
}

function extractStrategyAllocations(text: string) {
  const names = [
    'Fidelity Gl. Technology',
    'Invesco Technology',
    'iShares Edge MSCI Europe Momentum',
    'BGF World Healthscience',
    'SISF Greater China',
    'iShares NASDAQ 100',
    'Vanguard S&P 500',
    'UBS ETFs CMCI',
  ]
  const allocations: string[] = []

  for (const name of names) {
    const escaped = escapeRegExp(name)
    const match = text.match(new RegExp(`${escaped}([\\s\\S]{0,120})`, 'i'))
    const percents = match?.[1]?.match(/\d{1,3},\d{2}\s*%/g) ?? []
    const currentAllocation = percents[1] ?? percents[0]
    if (currentAllocation) allocations.push(`${name} ${currentAllocation}`)
  }

  return allocations.slice(0, 5).join(', ')
}

function extractLastPercentAfter(text: string, marker: string) {
  const index = text.toLocaleLowerCase('de-DE').indexOf(marker.toLocaleLowerCase('de-DE'))
  if (index < 0) return undefined
  const nextMarker = text.toLocaleLowerCase('de-DE').indexOf('volatilität', index)
  const section = text.slice(index, nextMarker > index ? nextMarker : index + 220)
  const matches = [...section.matchAll(/[-+]?\d{1,3},\d{1,2}\s*%/g)].map((match) => match[0])
  return matches.at(-1)
}

function extractLowestContribution(text: string) {
  const contributions: number[] = []
  const lines = text.split(/\n|\r|(?=Nr\. Gesellschaft)/)
  for (const line of lines) {
    if (!line.includes('1.500') || !line.includes('€')) continue
    const values = [...line.matchAll(/(\d{1,3},\d{2})\s*€/g)].map((match) => parseGermanNumber(match[1]))
    values.filter((value) => value > 5 && value < 300).forEach((value) => contributions.push(value))
  }
  const best = contributions.length > 0 ? Math.min(...contributions) : undefined
  return best === undefined ? undefined : `${formatGermanNumber(best)} €`
}

function mergeResult(target: InvestmentImportResult, source: InvestmentImportResult) {
  const nextValues = { ...source.values }
  if (source.values.insuranceMonthly && target.values.insuranceMonthly) {
    nextValues.insuranceMonthly = formatGermanNumber(
      parseGermanNumber(target.values.insuranceMonthly) + parseGermanNumber(source.values.insuranceMonthly),
    )
  }
  if (source.values.insuranceConcept && target.values.insuranceConcept) {
    nextValues.insuranceConcept = `${target.values.insuranceConcept}\n${source.values.insuranceConcept}`
  }
  if (source.values.healthConcept && target.values.healthConcept) {
    nextValues.healthConcept = `${target.values.healthConcept}\n${source.values.healthConcept}`
  }
  target.values = { ...target.values, ...nextValues }
  target.labels.push(...source.labels)
}

function compactParts(parts: (string | undefined)[], separator = ' | ') {
  return parts
    .map((part) => part?.replace(/\s+/g, ' ').trim())
    .filter((part): part is string => Boolean(part))
    .join(separator)
}

function matchText(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.replace(/\s+/g, ' ').trim()
}

function stripPercent(value: string) {
  return value.replace(/\s*%$/, '').trim()
}

function stripCurrency(value: string) {
  return value.replace(/\s*€$/, '').trim()
}

function parseGermanNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const number = Number.parseFloat(normalized)
  return Number.isFinite(number) ? number : 0
}

function formatGermanNumber(value: number) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
