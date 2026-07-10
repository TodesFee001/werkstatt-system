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
  effect?: number
  effectLabel: string
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

const MISSING = 'fehlt'
const CHECK = 'muss geprüft werden'
const NOT_GIVEN = 'nicht angegeben'

type SearchLine = {
  original: string
  search: string
}

const FACT_DEFINITIONS = [
  {
    key: 'birthDate',
    label: 'Geburtsdatum',
    patterns: [
      /geburtsdatum\s*[:\-]\s*([0-3]?\d[./-][01]?\d[./-](?:19|20)?\d{2})/i,
      /geboren(?:\s+am)?\s*[:\-]?\s*([0-3]?\d[./-][01]?\d[./-](?:19|20)?\d{2})/i,
    ],
  },
  {
    key: 'age',
    label: 'Alter',
    patterns: [/(?:^|\n)\s*alter\s*[:\-]\s*(\d{1,2})(?:\s*jahre?)?/i],
  },
  {
    key: 'netIncome',
    label: 'Nettoeinkommen',
    patterns: [
      /nettoeinkommen\s*[:\-]\s*([^\n\r]+)/i,
      /netto[-\s]?einkommen\s*[:\-]\s*([^\n\r]+)/i,
    ],
  },
  {
    key: 'surplus',
    label: 'Überschuss',
    patterns: [
      /monatlicher\s+überschuss\s*[:\-]\s*([^\n\r]+)/i,
      /überschuss\s*[:\-]\s*([^\n\r]+)/i,
      /frei(?:er|e|)\s+betrag\s*[:\-]\s*([^\n\r]+)/i,
    ],
  },
  {
    key: 'horizon',
    label: 'Anlagehorizont',
    patterns: [/anlagehorizont\s*[:\-]\s*([^\n\r]+)/i, /horizont\s*[:\-]\s*([^\n\r]+)/i],
  },
  {
    key: 'targetAge',
    label: 'Zielalter',
    patterns: [
      /zielalter\s*[:\-]\s*([^\n\r]+)/i,
      /verfügungszeitpunkt\s*[:\-]\s*([^\n\r]+)/i,
      /verfuegungszeitpunkt\s*[:\-]\s*([^\n\r]+)/i,
    ],
  },
  {
    key: 'reserves',
    label: 'Rücklagen',
    patterns: [/rücklagen\s*[:\-]\s*([^\n\r]+)/i, /ruecklagen\s*[:\-]\s*([^\n\r]+)/i],
  },
  {
    key: 'liabilities',
    label: 'Verbindlichkeiten',
    patterns: [/verbindlichkeiten\s*[:\-]\s*([^\n\r]+)/i, /schulden\s*[:\-]\s*([^\n\r]+)/i],
  },
] as const

export function parsePraeLuxInput(rawText: string): OverviewData {
  const text = rawText.trim()
  const lines = toSearchLines(text)
  const factsByKey = extractFacts(text)
  const clientName = extractClientName(text) || NOT_GIVEN
  const existing = buildConceptTotals(text, lines, 'existing')
  const recommended = buildConceptTotals(text, lines, 'recommended')
  const impact = buildImpact(existing, recommended, lines)
  const changes = extractProductChanges(lines)
  const longTermSaving = buildLongTermSaving(text, lines, factsByKey.age, changes, impact)
  const optionalPotential = buildOptionalPotential(impact)
  const conclusion = buildConclusion(impact, longTermSaving)

  const facts = FACT_DEFINITIONS.map((definition) => {
    const value = factsByKey[definition.key] || MISSING
    return {
      label: definition.label,
      value,
      status: value === MISSING ? 'missing' : 'present',
    } satisfies FactField
  })

  return {
    clientName,
    subtitle: `${clientName} | Bestandsaufnahme vs. empfohlenes Konzept`,
    intro:
      'Diese Übersicht zeigt, was sich durch das empfohlene Konzept monatlich, jährlich und langfristig bis zum 67. Lebensjahr verändert.',
    facts,
    existing,
    recommended,
    impact,
    changes,
    longTermSaving,
    optionalPotential,
    conclusion,
    notices: [
      'Laufzeit modellhaft bis 67',
      'Beitragsersparnis ohne Zinseszins gerechnet',
      'Optionale Investition nur als Zusatzpotenzial',
      'Vereinfachte Modellrechnung',
      'Angaben ohne Gewähr',
      'Ersetzt keine individuelle Vertragsprüfung',
      'Darstellung erfolgt aus Mandantensicht',
      'Ersparnisse werden als positiver Vorteil dargestellt',
    ],
    qualityChecks: [
      { label: 'Mandantendaten', ok: clientName !== NOT_GIVEN },
      { label: 'Bestand', ok: Boolean(existing.monthly || existing.yearly) },
      { label: 'Empfehlung', ok: Boolean(recommended.monthly || recommended.yearly) },
      { label: 'Mandantenwirkung', ok: impact.type !== 'missing' },
      { label: 'Produktveränderungen', ok: changes.some((change) => change.effectType !== 'missing') },
      { label: 'Langfristwert', ok: longTermSaving.status === 'present' },
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

export function slugifyName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

function extractClientName(text: string) {
  const patterns = [
    /(?:mandant(?:in)?|mandantenname|kunde(?:nname)?|name)\s*[:\-]\s*([^\n\r]+)/i,
    /für\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+){1,3})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = cleanValue(match?.[1])
    if (value && !isGenericLabel(value)) return value
  }

  return undefined
}

function extractFacts(text: string) {
  const facts: Record<string, string> = {}

  for (const definition of FACT_DEFINITIONS) {
    for (const pattern of definition.patterns) {
      const match = text.match(pattern)
      const value = cleanValue(match?.[1])
      if (value) {
        facts[definition.key] = value
        break
      }
    }
  }

  if (!facts.age && facts.birthDate) {
    const age = calculateAge(facts.birthDate)
    if (age) facts.age = String(age)
  }

  return facts
}

function buildConceptTotals(text: string, lines: SearchLine[], type: 'existing' | 'recommended'): ConceptTotals {
  const monthly = findConceptMoney(lines, type, 'monthly') ?? findConceptMoneyInText(text, type, 'monthly')
  const yearly =
    findConceptMoney(lines, type, 'yearly') ??
    findConceptMoneyInText(text, type, 'yearly') ??
    (monthly ? monthly * 12 : undefined)
  const derivedMonthly = monthly ?? (yearly ? yearly / 12 : undefined)

  const note =
    type === 'existing'
      ? 'Der aktuelle Bestand wird sachlich als Ausgangspunkt eingeordnet.'
      : 'Das empfohlene Konzept wird als neue Struktur gegenübergestellt.'

  return {
    monthly: derivedMonthly,
    yearly,
    monthlyLabel: derivedMonthly ? `${formatCurrency(derivedMonthly)} mtl.` : MISSING,
    yearlyLabel: yearly ? formatCurrency(yearly, { yearly: true }) : MISSING,
    note,
  }
}

function buildImpact(existing: ConceptTotals, recommended: ConceptTotals, lines: SearchLine[]): Mandantenwirkung {
  const directMonthly = findImpactMoney(lines, 'monthly')
  const directYearly = findImpactMoney(lines, 'yearly')

  const monthly =
    directMonthly ??
    (existing.monthly !== undefined && recommended.monthly !== undefined
      ? existing.monthly - recommended.monthly
      : undefined)
  const yearly =
    directYearly ??
    (existing.yearly !== undefined && recommended.yearly !== undefined
      ? existing.yearly - recommended.yearly
      : monthly !== undefined
        ? monthly * 12
        : undefined)

  if (monthly === undefined && yearly === undefined) {
    return {
      monthlyLabel: MISSING,
      yearlyLabel: MISSING,
      type: 'missing',
      explanation: 'Die Veränderung kann mit den vorliegenden Angaben noch nicht beziffert werden.',
    }
  }

  const reference = monthly ?? (yearly ? yearly / 12 : 0)
  const isSaving = reference >= 0
  const type = isSaving ? 'saving' : 'extra'

  return {
    monthly,
    yearly,
    type,
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
      ? 'Entlastung durch Optimierung und Entfall einzelner Bausteine.'
      : 'Die Empfehlung führt zu einem Mehrbeitrag, der mit zusätzlichen oder veränderten Bausteinen geprüft werden sollte.',
  }
}

function buildLongTermSaving(
  text: string,
  lines: SearchLine[],
  ageValue: string | undefined,
  changes: ProductChange[],
  impact: Mandantenwirkung,
): LongTermSaving {
  const explicit = findLongTermSaving(text)
  if (explicit !== undefined) {
    return {
      value: explicit,
      label: formatCurrency(explicit, { plus: explicit >= 0 }),
      status: 'present',
      note: 'ohne Zinseszins gerechnet',
    }
  }

  const optimizedMonthly = findOptimizedMonthlySaving(lines)
  const age = ageValue ? Number.parseInt(ageValue, 10) : undefined
  if (optimizedMonthly !== undefined && age && age < 67) {
    const value = optimizedMonthly * 12 * (67 - age)
    return {
      value,
      label: formatCurrency(value, { plus: value >= 0 }),
      status: 'present',
      note: 'ohne Zinseszins gerechnet',
    }
  }

  const hasNewComponent = changes.some((change) => change.effectType === 'new' || change.effectType === 'extra')
  if (impact.type === 'saving' && impact.monthly && age && age < 67 && !hasNewComponent) {
    const value = impact.monthly * 12 * (67 - age)
    return {
      value,
      label: formatCurrency(value, { plus: true }),
      status: 'check',
      note: 'aus direkter Entlastung berechnet; neue Bausteine müssen geprüft werden',
    }
  }

  return {
    label: CHECK,
    status: 'check',
    note:
      'Für die reine Beitragsersparnis fehlen die optimierten Bestandsbausteine oder das Alter bis 67.',
  }
}

function buildOptionalPotential(impact: Mandantenwirkung) {
  if (impact.type !== 'saving' || !impact.monthly || impact.monthly <= 0) {
    return 'Kein optionales Zusatzpotenzial dargestellt, solange keine klare monatliche Entlastung ausgewiesen ist.'
  }

  return `Die monatliche Entlastung von ${formatCurrency(
    impact.monthly,
    { plus: true },
  )} könnte optional zusätzlich für Vermögensaufbau genutzt werden. Diese Betrachtung ist rein modellhaft und nicht garantiert.`
}

function buildConclusion(impact: Mandantenwirkung, longTermSaving: LongTermSaving) {
  if (impact.type === 'saving') {
    const longTermPart =
      longTermSaving.status === 'present'
        ? ` Besonders stark wirkt die laufende Entlastung über die Laufzeit bis zum 67. Lebensjahr.`
        : ' Die langfristige Wirkung sollte nach Prüfung der Bestandsbausteine ergänzt werden.'

    return `Das neue Konzept verbessert die laufende Beitragsstruktur und schafft finanziellen Spielraum. Die bestehende Absicherung wird nicht schlechtgeredet, sondern gezielt optimiert.${longTermPart}`
  }

  if (impact.type === 'extra') {
    return 'Das neue Konzept verursacht einen Mehrbeitrag. Entscheidend ist deshalb die fachliche Prüfung, welche zusätzlichen oder verbesserten Bausteine diesen Mehraufwand begründen.'
  }

  return 'Die vorliegenden Angaben reichen noch nicht aus, um die finanzielle Wirkung vollständig zu bewerten. Fehlende Werte sind markiert und sollten vor der Mandantenfreigabe ergänzt werden.'
}

function extractProductChanges(lines: SearchLine[]) {
  const changes: ProductChange[] = []

  for (const line of lines) {
    if (changes.length >= 6) break
    const hasChangeSignal =
      line.original.includes('→') ||
      line.original.includes('->') ||
      line.search.includes(' alt ') ||
      line.search.includes(' neu ') ||
      line.search.includes('bestand') ||
      line.search.includes('empfehl')
    const hasProductSignal = PRODUCT_KEYWORDS.some((keyword) => line.search.includes(keyword.search))
    const money = extractFirstMoney(line.original)

    if (!hasChangeSignal || !hasProductSignal) continue

    const title = detectProductTitle(line.search)
    const [oldProduct, newProduct] = splitOldNew(line.original)
    const effectType = detectEffectType(line.search, money, oldProduct, newProduct)

    changes.push({
      title,
      oldProduct: oldProduct || NOT_GIVEN,
      newProduct: newProduct || CHECK,
      effect: money,
      effectLabel: buildEffectLabel(money, effectType),
      effectType,
    })
  }

  if (changes.length === 0) {
    changes.push({
      title: 'Produktveränderungen',
      oldProduct: NOT_GIVEN,
      newProduct: CHECK,
      effectLabel: CHECK,
      effectType: 'missing',
    })
  }

  return changes
}

function buildEffectLabel(value: number | undefined, type: ProductEffectType) {
  if (value === undefined) return CHECK
  if (type === 'saving') return `${formatCurrency(value, { plus: true })} mtl.`
  if (type === 'new') return `neuer Baustein: ${formatCurrency(value)} mtl.`
  if (type === 'extra') return `Mehrbeitrag: ${formatCurrency(Math.abs(value))} mtl.`
  return `${formatCurrency(value)} mtl.`
}

function detectEffectType(
  searchLine: string,
  money: number | undefined,
  oldProduct: string,
  newProduct: string,
): ProductEffectType {
  if (searchLine.includes('erspar') || searchLine.includes('entlast') || searchLine.includes('gunstiger')) {
    return 'saving'
  }
  if (searchLine.includes('mehrbeitrag') || searchLine.includes('teurer') || searchLine.includes('mehrbelast')) {
    return 'extra'
  }
  if (searchLine.includes('neuer baustein') || searchLine.includes('zusatzlich') || oldProduct === '') {
    return 'new'
  }
  if (money !== undefined && /[+]\s*\d/.test(newProduct + searchLine)) return 'saving'
  if (money !== undefined && /[-−]\s*\d/.test(newProduct + searchLine)) return 'extra'
  return money === undefined ? 'missing' : 'neutral'
}

function splitOldNew(line: string) {
  const arrow = line.includes('→') ? '→' : line.includes('->') ? '->' : undefined
  if (arrow) {
    const [left, right] = line.split(arrow)
    return [stripProductLabel(left), stripProductLabel(right)] as const
  }

  const altNeu = line.match(/alt\s*[:\-]\s*(.*?)\s+neu\s*[:\-]\s*(.*)/i)
  if (altNeu) return [stripProductLabel(altNeu[1]), stripProductLabel(altNeu[2])] as const

  const bestandNeu = line.match(/bestand\s*[:\-]\s*(.*?)\s+(?:empfehlung|neu)\s*[:\-]\s*(.*)/i)
  if (bestandNeu) return [stripProductLabel(bestandNeu[1]), stripProductLabel(bestandNeu[2])] as const

  return [stripProductLabel(line), ''] as const
}

function stripProductLabel(value: string) {
  return cleanValue(
    value
      .replace(/^\s*[•*\-]\s*/, '')
      .replace(/\b(?:haftpflicht|krankenkasse|zahnzusatz|rechtsschutz|altersvorsorge|produkt|baustein)\b\s*[:\-]?/i, '')
      .replace(/\b(?:ersparnis|entlastung|mehrbeitrag|neuer baustein)\b.*$/i, ''),
  ) || ''
}

function findConceptMoney(lines: SearchLine[], type: 'existing' | 'recommended', period: 'monthly' | 'yearly') {
  const conceptNeedles =
    type === 'existing'
      ? ['bestand', 'bisher', 'aktuell', 'vorvertrag']
      : ['empfohlen', 'empfehlung', 'neues konzept', 'neu', 'zielkonzept']
  const periodNeedles = period === 'monthly' ? ['mtl', 'monat'] : ['jahr', 'p.a', 'pa', 'jährlich', 'jaehrlich']

  for (const line of lines) {
    const hasConcept = conceptNeedles.some((needle) => line.search.includes(needle))
    const hasPeriod = periodNeedles.some((needle) => line.search.includes(needle))
    const mentionsContribution = ['beitrag', 'gesamtbeitrag', 'kosten', 'summe'].some((needle) =>
      line.search.includes(needle),
    )
    if (hasConcept && hasPeriod && mentionsContribution) {
      const value = extractFirstMoney(line.original)
      if (value !== undefined) return value
    }
  }

  return undefined
}

function findConceptMoneyInText(text: string, type: 'existing' | 'recommended', period: 'monthly' | 'yearly') {
  const concept = type === 'existing' ? '(?:bestand|bisher|aktuell)' : '(?:empfohlenes konzept|empfehlung|neues konzept)'
  const periodPattern = period === 'monthly' ? '(?:monatlich|monat|mtl\\.)' : '(?:jährlich|jaehrlich|jahr|p\\.a\\.)'
  const regex = new RegExp(`${concept}[\\s\\S]{0,100}${periodPattern}[\\s\\S]{0,60}(${MONEY_PATTERN.source})`, 'i')
  const match = text.match(regex)
  return parseMoney(match?.[1])
}

function findImpactMoney(lines: SearchLine[], period: 'monthly' | 'yearly') {
  const periodNeedles = period === 'monthly' ? ['mtl', 'monat'] : ['jahr', 'p.a', 'pa', 'jährlich', 'jaehrlich']
  for (const line of lines) {
    const hasImpact = ['mandantenwirkung', 'direkte veranderung', 'entlastung', 'ersparnis', 'mehrbeitrag'].some(
      (needle) => line.search.includes(needle),
    )
    const hasPeriod = periodNeedles.some((needle) => line.search.includes(needle))
    if (hasImpact && hasPeriod) {
      const value = extractFirstMoney(line.original)
      if (value !== undefined) {
        return line.search.includes('mehrbeitrag') || line.search.includes('mehrbelast') ? -Math.abs(value) : value
      }
    }
  }
  return undefined
}

function findLongTermSaving(text: string) {
  const patterns = [
    /reine\s+beitragsersparnis\s+bis\s+67[\s\S]{0,80}([+\-−]?\s*\d[\d.\s]*,\d{2}\s*€?)/i,
    /beitragsersparnis\s+bis\s+67[\s\S]{0,80}([+\-−]?\s*\d[\d.\s]*,\d{2}\s*€?)/i,
  ]
  for (const pattern of patterns) {
    const value = parseMoney(text.match(pattern)?.[1])
    if (value !== undefined) return value
  }
  return undefined
}

function findOptimizedMonthlySaving(lines: SearchLine[]) {
  for (const line of lines) {
    const isOptimized =
      line.search.includes('optimiert') ||
      line.search.includes('bisherige bausteine') ||
      line.search.includes('bestandsbausteine') ||
      line.search.includes('ausgewiesene beitragsersparnis')
    const isMonthly = line.search.includes('monat') || line.search.includes('mtl')
    const isSaving = line.search.includes('erspar') || line.search.includes('entlast')
    if (isOptimized && isMonthly && isSaving) {
      const value = extractFirstMoney(line.original)
      if (value !== undefined) return value
    }
  }
  return undefined
}

const MONEY_PATTERN = /[+\-−]?\s*\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?\s*€?|[+\-−]?\s*\d+(?:,\d{2})?\s*€/i

function extractFirstMoney(value: string) {
  return parseMoney(value.match(MONEY_PATTERN)?.[0])
}

function parseMoney(value: string | undefined) {
  if (!value) return undefined
  const isNegative = /[-−]/.test(value)
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
  const number = Number.parseFloat(cleaned)
  if (!Number.isFinite(number)) return undefined
  return isNegative ? -Math.abs(number) : Math.abs(number)
}

function toSearchLines(text: string): SearchLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ original: line, search: normalizeSearch(line) }))
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}.+€-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanValue(value: string | undefined) {
  return value
    ?.replace(/\s+/g, ' ')
    .replace(/[;|]+$/g, '')
    .trim()
    .slice(0, 120)
}

function isGenericLabel(value: string) {
  return /^(basisdatenblatt|finanzgutachten|bestandsaufnahme|empfohlenes konzept)$/i.test(value.trim())
}

function calculateAge(birthDate: string) {
  const match = birthDate.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (!match) return undefined
  const year = Number(match[3].length === 2 ? `19${match[3]}` : match[3])
  const month = Number(match[2]) - 1
  const day = Number(match[1])
  const birth = new Date(year, month, day)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age > 0 && age < 100 ? age : undefined
}

const PRODUCT_KEYWORDS = [
  { title: 'Haftpflicht', search: 'haftpflicht' },
  { title: 'Krankenkasse', search: 'krankenkasse' },
  { title: 'Zahnzusatz', search: 'zahn' },
  { title: 'Rechtsschutz', search: 'rechtsschutz' },
  { title: 'Altersvorsorge', search: 'altersvorsorge' },
  { title: 'Berufsunfähigkeit', search: 'berufsunfahigkeit' },
  { title: 'Unfall', search: 'unfall' },
  { title: 'Hausrat', search: 'hausrat' },
  { title: 'Kfz', search: 'kfz' },
  { title: 'Absicherung', search: 'absicherung' },
  { title: 'Baustein', search: 'baustein' },
]

function detectProductTitle(searchLine: string) {
  return PRODUCT_KEYWORDS.find((keyword) => searchLine.includes(keyword.search))?.title || 'Baustein'
}
