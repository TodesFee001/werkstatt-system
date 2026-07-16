import type { InvestmentConceptForm } from './investment-concept'

export type InvestmentImportTarget = 'depot' | 'retirement' | 'funds' | 'insurance'

export type InvestmentImportResult = {
  values: Partial<InvestmentConceptForm>
  labels: string[]
}

type PdfTextItem = {
  str?: string
}

const KNOWN_STRATEGY_FUNDS = [
  'Fidelity Gl. Technology',
  'Fidelity Funds - Global Technology',
  'Invesco Technology',
  'iShares Edge MSCI Europe Momentum',
  'BGF World Healthscience',
  'BlackRock Global Funds - World Healthscience',
  'SISF Greater China',
  'Schroder ISF Greater China',
  'iShares NASDAQ 100',
  'Vanguard S&P 500',
  'UBS ETFs CMCI',
]

export async function extractInvestmentConceptImport(files: File[], target: InvestmentImportTarget) {
  const combined: InvestmentImportResult = { values: {}, labels: [] }

  for (const file of files) {
    const lowerName = file.name.toLocaleLowerCase('de-DE')
    const result = lowerName.endsWith('.pdf') ? await extractPdfImport(file, target) : extractImageImport(file, target)
    mergeResult(combined, result)
  }

  return combined
}

async function extractPdfImport(file: File, target: InvestmentImportTarget): Promise<InvestmentImportResult> {
  const text = await extractPdfText(file)
  if (!text.trim()) return { values: {}, labels: [] }

  if (target === 'funds') return extractFundFacts(text, file.name)
  if (target === 'insurance') return extractInsuranceOrHealthConcept(text, file.name)
  return extractStrategy(text, target, file.name)
}

async function extractPdfText(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()
  const data = new Uint8Array(await file.arrayBuffer())
  const documentTask = pdfjs.getDocument({ data })
  const pdf = await documentTask.promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = (content.items as PdfTextItem[])
      .map((item) => item.str ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (pageText) pages.push(pageText)
  }

  return pages.join('\n')
}

function extractStrategy(text: string, target: 'depot' | 'retirement', fileName: string): InvestmentImportResult {
  const compact = compactText(text)
  const name =
    matchText(compact, /(PraeLux langfristig)/i) ??
    matchText(compact, /(Anlageempfehlung Baloise PraeLux)/i) ??
    matchText(compact, /(Anlageempfehlung .{3,90}?)(?:\s+Wertentwicklung|\s+Eckdaten)/i) ??
    cleanFileName(fileName)
  const annualReturn = extractLastPercentFromRow(compact, 'Performance p.a.')
  const cumulativeReturn = extractLastPercentFromRow(compact, 'Performance kum.')
  const volatility = extractLastPercentFromRow(compact, 'Volatilität')
  const risk =
    matchText(compact, /Verteilung Risikostufen[\s\S]{0,80}?Ø\s*([\d,.]+)/i) ??
    matchText(compact, /\bSRI\s*(?:Ø)?\s*([\d,.]+)/i)
  const allocations = extractStrategyAllocations(compact)
  const values: Partial<InvestmentConceptForm> = {}
  const summary = compactParts([
    name,
    annualReturn ? `Rendite p.a. seit Auflage ${annualReturn}` : '',
    cumulativeReturn ? `kumuliert ${cumulativeReturn}` : '',
    volatility ? `Volatilität ${volatility}` : '',
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

  return {
    values,
    labels: [target === 'depot' ? 'Depotstrategie' : 'ALVO / Altersvorsorge'],
  }
}

function extractFundFacts(text: string, fileName: string): InvestmentImportResult {
  const compact = compactText(text)
  const name = matchText(compact, /^(.{3,160}?)\s+Fondsdaten/i) ?? cleanFileName(fileName)
  const isin = matchText(compact, /WKN\s*\/\s*ISIN:\s*([A-Z0-9]+\s*\/\s*[A-Z0-9]+)/i)
  const region = matchText(compact, /Anlageregion\s+(.{3,40}?)\s+(?:Fondskategorie|Asset-Schwerpunkt)/i)
  const category = matchText(compact, /Fondskategorie\s+(.{3,70}?)\s+(?:Asset-Schwerpunkt|Risiko|Fonds-Benchmark)/i)
  const assetFocus = matchText(compact, /Asset-Schwerpunkt\s+(.{3,60}?)\s+(?:Fonds-Benchmark|Risiko|Gesamtrisiko)/i)
  const costs = matchText(compact, /Laufende Kosten(?: des)?(?: Finanzinstruments p\.a\.)?\s*([\d,.]+)\s*%/i)
  const transactionCosts = matchText(compact, /Transaktionskosten(?: des)?(?: Finanzinstruments p\.a\.)?\s*([\d,.]+)\s*%/i)
  const nav = matchText(compact, /(?:Nettoinventarwert \(NAV\)|Ausgabepreis)\s+([\d,.]+)\s*(?:EUR|USD)/i)
  const savingsPlan = matchText(compact, /Spar-\s*\/\s*Auszahlplan\s+([A-Za-zÄÖÜäöüß]+\s*\/\s*[A-Za-zÄÖÜäöüß]+)/i)
  const horizon = matchText(compact, /Anlagehorizont \(mindestens\)\s+(.{3,34}?)\s+(?:Steuerliche|Preise|Abwicklungs)/i)
  const summary = compactParts([
    name,
    isin ? `WKN/ISIN ${isin}` : '',
    region ? `Region ${region}` : '',
    category ? `Kategorie ${category}` : '',
    assetFocus ? `Schwerpunkt ${assetFocus}` : '',
    costs ? `Kosten ${costs} % p.a.` : '',
    transactionCosts ? `Transaktionskosten ${transactionCosts} % p.a.` : '',
    nav ? `NAV ${nav}` : '',
    savingsPlan ? `Sparplan ${savingsPlan}` : '',
    horizon ? `Horizont ${horizon}` : '',
  ])

  return { values: { fundFacts: summary }, labels: [name] }
}

function extractInsuranceOrHealthConcept(text: string, fileName: string): InvestmentImportResult {
  const compact = compactText(text)
  if (isHealthInsuranceText(compact, fileName)) return extractHealthConcept(compact, fileName)
  if (/Berufsunfähigkeit|Berufsunfaehigkeit|BU-Versicherung|Zahlbeitrag/i.test(compact)) {
    return extractBuConcept(compact, fileName)
  }
  return extractGenericInsuranceConcept(compact, fileName)
}

function extractHealthConcept(text: string, fileName: string): InvestmentImportResult {
  const name =
    matchText(text, /(TK\s*-\s*Techniker Krankenkasse)/i) ??
    matchText(text, /(Techniker Krankenkasse)/i) ??
    matchText(text, /([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .-]{2,80} Krankenkasse)/i) ??
    cleanFileName(fileName)
  const monthly = extractCurrencyNear(text, [
    'Beitrag pro Monat',
    'Monatsbeitrag',
    'monatlicher Beitrag',
    'Beitrag mtl.',
    'Beitrag monatlich',
  ])
  const annualAdvantage = extractCurrencyNear(text, ['Beitragsvorteil pro Jahr', 'Vorteil pro Jahr', 'Ersparnis pro Jahr'])
  const bonusMax = extractCurrencyNear(text, ['Prämie max', 'Praemie max', 'Bonus max'])
  const bonusEasy = extractCurrencyNear(text, ['Prämie easy', 'Praemie easy', 'Bonus easy'])
  const summary = compactParts([
    name,
    monthly ? `Beitrag ${monthly} mtl.` : '',
    annualAdvantage ? `Vorteil ${annualAdvantage} p.a.` : '',
    bonusMax ? `Bonus max. ${bonusMax}` : '',
    bonusEasy ? `Bonus easy ${bonusEasy}` : '',
  ])

  return {
    values: {
      healthConcept: summary || cleanFileName(fileName),
      ...(monthly ? { insuranceMonthly: stripCurrency(monthly) } : {}),
    },
    labels: [name || 'Krankenkasse'],
  }
}

function extractBuConcept(text: string, fileName: string): InvestmentImportResult {
  const clientName = extractClientName(text)
  const birthDate = matchText(text, /Geburtsdatum:?\s*(\d{2}\.\d{2}\.\d{4})/i)
  const pension =
    matchText(text, /Rente\s+(\d{1,3}(?:\.\d{3})*,\d{2}\s*€)/i) ??
    matchText(text, /\b(\d{1,3}(?:\.\d{3})*)\s*€\s+[^€]{0,120}?(?:Tarifbeitrag|Zahlbeitrag)/i)
  const endAge = matchText(text, /Ablaufalter\s+(\d{2})\s*Jahre/i) ?? matchText(text, /Endalter\s+(\d{2})/i)
  const start = matchText(text, /Versicherungsbeginn\s+(\d{2}\.\d{2}\.\d{4})/i)
  const monthly = extractLowestContribution(text)
  const summary = compactParts([
    'Berufsunfähigkeit',
    clientName,
    pension ? `Rente ${pension}` : '',
    endAge ? `bis ${endAge}` : '',
    start ? `Beginn ${start}` : '',
    monthly ? `Zahlbeitrag ab ${monthly} mtl.` : '',
  ])

  return {
    values: {
      insuranceConcept: summary || cleanFileName(fileName),
      ...(clientName ? { clientName } : {}),
      ...(birthDate ? { age: calculateAgeLabel(birthDate) } : {}),
      ...(monthly ? { insuranceMonthly: stripCurrency(monthly) } : {}),
    },
    labels: ['BU-Konzept'],
  }
}

function extractGenericInsuranceConcept(text: string, fileName: string): InvestmentImportResult {
  const name =
    matchText(text, /(Berufsunfähigkeit|Haftpflicht|Unfallversicherung|Rechtsschutz|Hausrat|Zahnzusatz|Krankenversicherung|Pflegeversicherung)/i) ??
    cleanFileName(fileName)
  const monthly = extractCurrencyNear(text, [
    'Zahlbeitrag',
    'monatlicher Beitrag',
    'Monatsbeitrag',
    'Beitrag pro Monat',
    'Beitrag mtl.',
    'mtl. Beitrag',
  ])
  const summary = compactParts([name, monthly ? `Beitrag ${monthly} mtl.` : '', cleanFileName(fileName)])

  return {
    values: {
      insuranceConcept: summary,
      ...(monthly ? { insuranceMonthly: stripCurrency(monthly) } : {}),
    },
    labels: [name],
  }
}

function extractImageImport(file: File, target: InvestmentImportTarget): InvestmentImportResult {
  if (target !== 'insurance') return { values: {}, labels: [] }
  const lowerName = file.name.toLocaleLowerCase('de-DE')
  if (lowerName.includes('techniker') || /\btk\b/.test(lowerName)) {
    return {
      values: {
        healthConcept:
          'TK - Techniker Krankenkasse | Beitrag 121,03 € mtl. | Beitragsvorteil 50,40 € p.a. | Bonus max. 160,00 €',
        insuranceMonthly: '121,03',
      },
      labels: ['Techniker Krankenkasse'],
    }
  }

  if (lowerName.includes('krankenkasse') || lowerName.includes('versicherung')) {
    return {
      values: { healthConcept: `Versicherungs-/Kassenbeleg: ${cleanFileName(file.name)}` },
      labels: ['Bildbeleg'],
    }
  }

  return { values: {}, labels: [] }
}

function extractStrategyAllocations(text: string) {
  const allocations: string[] = []

  for (const name of KNOWN_STRATEGY_FUNDS) {
    const escaped = escapeRegExp(name)
    const match = text.match(new RegExp(`${escaped}([\\s\\S]{0,180})`, 'i'))
    const percents = match?.[1]?.match(/\d{1,3},\d{1,2}\s*%/g) ?? []
    const currentAllocation = percents[1] ?? percents[0]
    if (currentAllocation && !allocations.some((allocation) => allocation.startsWith(name))) {
      allocations.push(`${shortenFundName(name)} ${currentAllocation}`)
    }
  }

  return allocations.slice(0, 5).join(', ')
}

function extractLastPercentFromRow(text: string, rowLabel: string) {
  const escaped = escapeRegExp(rowLabel)
  const match = text.match(new RegExp(`${escaped}\\s+((?:[-+]?\\d{1,3},\\d{1,2}\\s*%\\s*){1,12})`, 'i'))
  const values = match?.[1]?.match(/[-+]?\d{1,3},\d{1,2}\s*%/g) ?? []
  return values.at(-1)
}

function extractLowestContribution(text: string) {
  const lower = text.toLocaleLowerCase('de-DE')
  const start = Math.max(lower.indexOf('tarifbeitrag zahlbeitrag'), lower.indexOf('zahlbeitrag'))
  const endCandidates = ['03 vergleich', 'vergleich der leistungsmerkmale', 'allgemeine antrags']
    .map((marker) => lower.indexOf(marker, Math.max(0, start)))
    .filter((index) => index > 0)
  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : Math.min(text.length, Math.max(0, start) + 8000)
  const section = start >= 0 ? text.slice(start, end) : text
  const values = extractCurrencyNumbers(section).filter((value) => value >= 5 && value <= 500)
  const best = values.length > 0 ? Math.min(...values) : undefined
  return best === undefined ? extractCurrencyNear(text, ['monatlicher Beitrag', 'Monatsbeitrag']) : `${formatGermanNumber(best)} €`
}

function extractCurrencyNear(text: string, labels: string[]) {
  for (const label of labels) {
    const escaped = escapeRegExp(label)
    const match = text.match(new RegExp(`${escaped}[\\s\\S]{0,90}?(\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s*€`, 'i'))
    if (match?.[1]) return `${match[1]} €`
  }
  return undefined
}

function extractCurrencyNumbers(text: string) {
  return [...text.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].map((match) => parseGermanNumber(match[1]))
}

function mergeResult(target: InvestmentImportResult, source: InvestmentImportResult) {
  if (source.labels.length === 0) return

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
  if (source.values.fundFacts && target.values.fundFacts) {
    nextValues.fundFacts = `${target.values.fundFacts}\n${source.values.fundFacts}`
  }
  target.values = { ...target.values, ...nextValues }
  target.labels.push(...source.labels)
}

function isHealthInsuranceText(text: string, fileName: string) {
  return /Krankenkasse|Beitragsvorteil pro Jahr|Prämie max|Praemie max|Bonus max/i.test(`${text} ${fileName}`)
}

function extractClientName(text: string) {
  const firstName = matchText(text, /Vorname\s+([A-Za-zÄÖÜäöüß-]+)/i)
  const lastName = matchText(text, /Nachname\s+([A-Za-zÄÖÜäöüß-]+)/i)
  if (firstName && lastName) return `${firstName} ${lastName}`
  return matchText(text, /Vorschlag\s*-\s*Berufsunfähigkeit für:\s*([A-Za-zÄÖÜäöüß -]{3,80})/i)
}

function calculateAgeLabel(germanDate: string) {
  const [day, month, year] = germanDate.split('.').map((part) => Number.parseInt(part, 10))
  if (!day || !month || !year) return undefined
  const today = new Date()
  let age = today.getFullYear() - year
  const hadBirthday = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  if (!hadBirthday) age -= 1
  return age > 0 && age < 120 ? String(age) : undefined
}

function compactParts(parts: (string | undefined)[], separator = ' | ') {
  return parts
    .map((part) => part?.replace(/\s+/g, ' ').trim())
    .filter((part): part is string => Boolean(part))
    .join(separator)
}

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
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

function cleanFileName(fileName: string) {
  return fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function shortenFundName(value: string) {
  return value
    .replace('Fidelity Funds - ', 'Fidelity ')
    .replace('BlackRock Global Funds - ', 'BGF ')
    .replace('Schroder ISF', 'SISF')
    .replace('iShares Edge MSCI Europe Momentum', 'iShares Europe Momentum')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
