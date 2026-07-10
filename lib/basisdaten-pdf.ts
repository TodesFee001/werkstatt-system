import type { PraeLuxFormData } from './praelux'

export type BasisdatenPdfValues = Partial<
  Pick<
    PraeLuxFormData,
    'clientName' | 'birthDate' | 'netIncome' | 'surplus' | 'horizon' | 'targetAge' | 'reserves' | 'liabilities'
  >
>

export type BasisdatenPdfResult = {
  values: BasisdatenPdfValues
  labels: string[]
}

type PdfFieldLike = {
  getName: () => string
  getText?: () => string | undefined
}

export async function extractBasisdatenFromPdf(file: File): Promise<BasisdatenPdfResult> {
  const { PDFDocument } = await import('pdf-lib')
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })
  const fields = pdf.getForm().getFields() as PdfFieldLike[]
  const fieldValues = createFieldValueMap(fields)
  const values: BasisdatenPdfValues = {}
  const labels: string[] = []

  const firstName = readPdfField(fieldValues, ['Vorname'])
  const lastName = readPdfField(fieldValues, ['Nachname'])
  const clientName = [firstName, lastName].filter(Boolean).join(' ').trim()
  addImportedValue(values, labels, 'clientName', clientName, 'Name')

  addImportedValue(values, labels, 'birthDate', parseGermanDate(readPdfField(fieldValues, ['Geburtsdatum'])), 'Geburtsdatum')
  addImportedValue(values, labels, 'netIncome', readPdfField(fieldValues, ['Nettoeinkommen']), 'Nettoeinkommen')
  addImportedValue(values, labels, 'surplus', readPdfField(fieldValues, ['Überschuss', 'Ueberschuss']), 'Überschuss')
  addImportedValue(values, labels, 'horizon', readPdfField(fieldValues, ['Anlagehorizont']), 'Anlagehorizont')
  addImportedValue(values, labels, 'targetAge', parseTargetAge(readPdfField(fieldValues, ['Verfügungszeitpunkt'])), 'Zielalter')
  addImportedValue(values, labels, 'reserves', readPdfField(fieldValues, ['Vermögen gesamt']), 'Rücklagen')
  addImportedValue(values, labels, 'liabilities', readPdfField(fieldValues, ['Verbindlichkeiten']), 'Verbindlichkeiten')

  return { values, labels }
}

function createFieldValueMap(fields: PdfFieldLike[]) {
  const values = new Map<string, string>()

  for (const field of fields) {
    const text = field.getText?.()?.trim()
    if (!text) continue
    values.set(field.getName(), text)
    values.set(normalizeFieldName(field.getName()), text)
  }

  return values
}

function readPdfField(values: Map<string, string>, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    const value = values.get(fieldName) ?? values.get(normalizeFieldName(fieldName))
    if (value) return value
  }
  return ''
}

function addImportedValue<K extends keyof BasisdatenPdfValues>(
  values: BasisdatenPdfValues,
  labels: string[],
  key: K,
  value: BasisdatenPdfValues[K] | undefined,
  label: string,
) {
  if (!value) return
  values[key] = value
  labels.push(label)
}

function parseGermanDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!match) return ''
  const [, day, month, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseTargetAge(value: string) {
  const match = value.match(/\b(\d{2})\b/)
  return match ? match[1] : ''
}

function normalizeFieldName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '')
    .toLocaleLowerCase('de-DE')
}
