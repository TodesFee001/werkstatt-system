import type { FactField, OverviewData, ProductChange, ProductEffectType } from './praelux'

export const A4_WIDTH = 1240
export const A4_HEIGHT = 1754

const palette = {
  paper: '#ffffff',
  paperSoft: '#f6f8f9',
  navy: '#0a1f38',
  navy2: '#12365a',
  navySoft: '#e9eef4',
  gold: '#c7a35c',
  goldSoft: '#f7efd9',
  green: '#17764d',
  greenSoft: '#e8f5ed',
  amber: '#b88221',
  amberSoft: '#fff3d5',
  red: '#a93c3c',
  redSoft: '#f9e5e5',
  ink: '#102236',
  muted: '#637184',
  line: '#d8e1ea',
}

type TextOptions = {
  color?: string
  align?: CanvasTextAlign
  weight?: number
  size?: number
  lineHeight?: number
  maxLines?: number
}

type Rect = {
  x: number
  y: number
  w: number
  h: number
}

export function drawPraeLuxOverview(canvas: HTMLCanvasElement, data: OverviewData, scale = 2) {
  canvas.width = A4_WIDTH * scale
  canvas.height = A4_HEIGHT * scale
  canvas.style.width = `${A4_WIDTH}px`
  canvas.style.height = `${A4_HEIGHT}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, A4_WIDTH, A4_HEIGHT)
  ctx.fillStyle = palette.paper
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

  drawHeader(ctx, data)
  drawFactStrip(ctx, data.facts)
  drawConceptBoxes(ctx, data)
  drawChanges(ctx, data.changes)
  drawLongTermSaving(ctx, data)
  drawOptionalPotential(ctx, data.optionalPotential)
  drawConclusion(ctx, data)
  drawNotices(ctx, data.notices)
  drawFooter(ctx)
}

function drawHeader(ctx: CanvasRenderingContext2D, data: OverviewData) {
  gradientRect(ctx, 0, 0, A4_WIDTH, 210, palette.navy, palette.navy2)
  ctx.fillStyle = 'rgba(199, 163, 92, 0.2)'
  ctx.fillRect(0, 188, A4_WIDTH, 6)
  ctx.fillStyle = palette.gold
  ctx.fillRect(70, 188, 420, 6)

  setFont(ctx, 34, 800)
  ctx.fillStyle = palette.paper
  ctx.fillText('PraeLux', 70, 58)
  drawAnchor(ctx, 226, 44, 20, palette.gold)

  setFont(ctx, 46, 800)
  ctx.fillStyle = palette.paper
  ctx.fillText('Gesamtvorteil des neuen Konzepts', 70, 115)

  setFont(ctx, 21, 700)
  ctx.fillStyle = palette.gold
  drawSingleLine(ctx, data.subtitle, 70, 150, 860)

  setFont(ctx, 17, 400)
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  drawWrappedText(ctx, data.intro, 70, 177, 880, { lineHeight: 22, maxLines: 2 })

  drawQualityMeter(ctx, data)
}

function drawQualityMeter(ctx: CanvasRenderingContext2D, data: OverviewData) {
  const okCount = data.qualityChecks.filter((check) => check.ok).length
  const total = data.qualityChecks.length
  const rect = { x: 950, y: 42, w: 220, h: 112 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 16, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.16)')
  setFont(ctx, 13, 700)
  ctx.fillStyle = 'rgba(255,255,255,0.74)'
  ctx.fillText('Datenstatus', rect.x + 18, rect.y + 28)
  setFont(ctx, 38, 800)
  ctx.fillStyle = okCount === total ? palette.gold : palette.paper
  ctx.fillText(`${okCount}/${total}`, rect.x + 18, rect.y + 70)
  setFont(ctx, 13, 500)
  ctx.fillStyle = 'rgba(255,255,255,0.76)'
  drawWrappedText(ctx, okCount === total ? 'vollständig erkannt' : 'fehlende Werte markiert', rect.x + 92, rect.y + 52, 104, {
    lineHeight: 17,
    maxLines: 2,
  })
}

function drawFactStrip(ctx: CanvasRenderingContext2D, facts: FactField[]) {
  const startX = 70
  const startY = 235
  const gap = 10
  const columns = 4
  const cardW = (1100 - gap * (columns - 1)) / columns
  const cardH = 64

  facts.forEach((fact, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    const x = startX + col * (cardW + gap)
    const y = startY + row * (cardH + gap)
    roundedRect(ctx, x, y, cardW, cardH, 12, palette.paperSoft, palette.line)
    setFont(ctx, 12, 800)
    ctx.fillStyle = palette.muted
    ctx.fillText(fact.label.toUpperCase(), x + 14, y + 22)
    setFont(ctx, 19, 800)
    ctx.fillStyle = fact.status === 'present' ? palette.ink : palette.red
    drawSingleLine(ctx, fact.value, x + 14, y + 48, cardW - 28)
  })
}

function drawConceptBoxes(ctx: CanvasRenderingContext2D, data: OverviewData) {
  const y = 405
  const gap = 20
  const w = (1100 - gap * 2) / 3
  drawMetricBox(ctx, { x: 70, y, w, h: 210 }, 'Bestandsaufnahme', data.existing.monthlyLabel, data.existing.yearlyLabel, data.existing.note, 'neutral')
  drawMetricBox(
    ctx,
    { x: 70 + w + gap, y, w, h: 210 },
    'Empfohlenes Konzept',
    data.recommended.monthlyLabel,
    data.recommended.yearlyLabel,
    data.recommended.note,
    'gold',
  )
  drawMetricBox(
    ctx,
    { x: 70 + (w + gap) * 2, y, w, h: 210 },
    'Direkte Veränderung',
    data.impact.monthlyLabel,
    data.impact.yearlyLabel,
    data.impact.explanation,
    data.impact.type === 'saving' ? 'green' : data.impact.type === 'extra' ? 'gold' : 'neutral',
  )
}

function drawMetricBox(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  title: string,
  primary: string,
  secondary: string,
  note: string,
  tone: 'neutral' | 'green' | 'gold',
) {
  const fill = tone === 'green' ? palette.greenSoft : tone === 'gold' ? palette.goldSoft : palette.paper
  const accent = tone === 'green' ? palette.green : tone === 'gold' ? palette.gold : palette.navy2
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, fill, palette.line)
  ctx.fillStyle = accent
  roundPath(ctx, rect.x, rect.y, rect.w, 10, 18)
  ctx.fill()

  setFont(ctx, 18, 800)
  ctx.fillStyle = palette.ink
  ctx.fillText(title, rect.x + 24, rect.y + 42)

  setFont(ctx, 33, 900)
  ctx.fillStyle = accent
  drawSingleLine(ctx, primary, rect.x + 24, rect.y + 92, rect.w - 48)

  setFont(ctx, 21, 800)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, secondary, rect.x + 24, rect.y + 126, rect.w - 48)

  setFont(ctx, 15, 500)
  ctx.fillStyle = palette.muted
  drawWrappedText(ctx, note, rect.x + 24, rect.y + 160, rect.w - 48, { lineHeight: 20, maxLines: 2 })
}

function drawChanges(ctx: CanvasRenderingContext2D, changes: ProductChange[]) {
  const sectionY = 668
  setFont(ctx, 27, 900)
  ctx.fillStyle = palette.ink
  ctx.fillText('Wesentliche Veränderungen', 70, sectionY)

  setFont(ctx, 15, 500)
  ctx.fillStyle = palette.muted
  ctx.fillText('Alt-Produkt, Neu-Produkt und monatlicher Effekt aus Mandantensicht.', 70, sectionY + 26)

  const gap = 18
  const cardW = (1100 - gap) / 2
  const cardH = 101
  const cards = changes.slice(0, 6)

  cards.forEach((change, index) => {
    const x = 70 + (index % 2) * (cardW + gap)
    const y = 720 + Math.floor(index / 2) * (cardH + gap)
    drawProductCard(ctx, { x, y, w: cardW, h: cardH }, change)
  })
}

function drawProductCard(ctx: CanvasRenderingContext2D, rect: Rect, change: ProductChange) {
  const tone = toneForEffect(change.effectType)
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 14, tone.bg, tone.border)
  drawProductIcon(ctx, rect.x + 30, rect.y + 50, change.title, tone.accent)

  setFont(ctx, 17, 900)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, change.title, rect.x + 62, rect.y + 28, rect.w - 250)

  setFont(ctx, 13, 600)
  ctx.fillStyle = palette.muted
  drawSingleLine(ctx, `Alt: ${change.oldProduct}`, rect.x + 62, rect.y + 53, rect.w - 82)
  drawSingleLine(ctx, `Neu: ${change.newProduct}`, rect.x + 62, rect.y + 75, rect.w - 82)

  setFont(ctx, 17, 900)
  ctx.fillStyle = tone.accent
  drawSingleLine(ctx, change.effectLabel, rect.x + rect.w - 205, rect.y + 30, 178, 'right')
}

function drawLongTermSaving(ctx: CanvasRenderingContext2D, data: OverviewData) {
  const rect = { x: 70, y: 1082, w: 1100, h: 170 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 20, data.longTermSaving.status === 'present' ? palette.greenSoft : palette.amberSoft, palette.line)
  ctx.fillStyle = data.longTermSaving.status === 'present' ? palette.green : palette.amber
  roundPath(ctx, rect.x, rect.y, 14, rect.h, 20)
  ctx.fill()

  setFont(ctx, 24, 900)
  ctx.fillStyle = palette.ink
  ctx.fillText('Reine Beitragsersparnis bis 67', rect.x + 34, rect.y + 44)

  setFont(ctx, 52, 900)
  ctx.fillStyle = data.longTermSaving.status === 'present' ? palette.green : palette.amber
  drawSingleLine(ctx, data.longTermSaving.label, rect.x + 34, rect.y + 105, 420)

  setFont(ctx, 15, 800)
  ctx.fillStyle = palette.muted
  ctx.fillText(data.longTermSaving.note, rect.x + 36, rect.y + 135)

  setFont(ctx, 18, 500)
  ctx.fillStyle = palette.ink
  drawWrappedText(
    ctx,
    'Diese Ersparnis bezieht sich auf die Optimierung der bisherigen Bausteine vor Einrechnung neuer zusätzlicher Bausteine.',
    rect.x + 520,
    rect.y + 58,
    560,
    { lineHeight: 25, maxLines: 3 },
  )
}

function drawOptionalPotential(ctx: CanvasRenderingContext2D, text: string) {
  const rect = { x: 70, y: 1276, w: 1100, h: 120 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 16, palette.paper, palette.line)
  setFont(ctx, 22, 900)
  ctx.fillStyle = palette.ink
  ctx.fillText('Optionales Zusatzpotenzial', rect.x + 26, rect.y + 38)
  setFont(ctx, 17, 500)
  ctx.fillStyle = palette.muted
  drawWrappedText(ctx, text, rect.x + 26, rect.y + 66, rect.w - 52, { lineHeight: 23, maxLines: 2 })
}

function drawConclusion(ctx: CanvasRenderingContext2D, data: OverviewData) {
  const rect = { x: 70, y: 1420, w: 1100, h: 132 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 16, palette.navySoft, palette.line)
  setFont(ctx, 22, 900)
  ctx.fillStyle = palette.navy
  ctx.fillText('Fazit', rect.x + 26, rect.y + 38)
  setFont(ctx, 18, 600)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, data.conclusion, rect.x + 26, rect.y + 68, rect.w - 52, { lineHeight: 24, maxLines: 3 })
}

function drawNotices(ctx: CanvasRenderingContext2D, notices: string[]) {
  const rect = { x: 70, y: 1575, w: 1100, h: 104 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 14, palette.paperSoft, palette.line)
  setFont(ctx, 17, 900)
  ctx.fillStyle = palette.ink
  ctx.fillText('Modellannahmen & Hinweise', rect.x + 22, rect.y + 31)
  setFont(ctx, 12.5, 600)
  ctx.fillStyle = palette.muted

  notices.slice(0, 8).forEach((notice, index) => {
    const col = index % 4
    const row = Math.floor(index / 4)
    const x = rect.x + 22 + col * 265
    const y = rect.y + 58 + row * 26
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.arc(x, y - 4, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = palette.muted
    drawSingleLine(ctx, notice, x + 12, y, 232)
  })
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = palette.navy
  ctx.fillRect(0, 1714, A4_WIDTH, 40)
  setFont(ctx, 18, 800)
  ctx.fillStyle = palette.paper
  ctx.fillText('PraeLux', 70, 1739)
  drawAnchor(ctx, 154, 1731, 11, palette.gold)
}

function toneForEffect(effectType: ProductEffectType) {
  if (effectType === 'saving') {
    return { bg: palette.greenSoft, border: '#b9dec9', accent: palette.green }
  }
  if (effectType === 'extra' || effectType === 'new') {
    return { bg: palette.amberSoft, border: '#ead49a', accent: palette.amber }
  }
  if (effectType === 'missing') {
    return { bg: palette.redSoft, border: '#edc0c0', accent: palette.red }
  }
  return { bg: palette.paper, border: palette.line, accent: palette.navy2 }
}

function drawProductIcon(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, color: string) {
  ctx.strokeStyle = color
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(x, y, 19, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  setFont(ctx, 14, 900)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(iconInitial(title), x, y + 5)
  ctx.textAlign = 'left'
}

function iconInitial(title: string) {
  if (title === 'Krankenkasse') return '+'
  if (title === 'Zahnzusatz') return 'Z'
  if (title === 'Rechtsschutz') return '§'
  if (title === 'Altersvorsorge') return 'A'
  return title.slice(0, 1).toUpperCase()
}

function gradientRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  from: string,
  to: string,
) {
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
  gradient.addColorStop(0, from)
  gradient.addColorStop(1, to)
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, w, h)
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  roundPath(ctx, x, y, w, h, radius)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.4
    ctx.stroke()
  }
}

function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawAnchor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2, size / 7)
  ctx.beginPath()
  ctx.arc(x, y - size * 0.35, size * 0.28, 0, Math.PI * 2)
  ctx.moveTo(x, y - size * 0.05)
  ctx.lineTo(x, y + size * 0.8)
  ctx.moveTo(x - size * 0.55, y + size * 0.15)
  ctx.lineTo(x + size * 0.55, y + size * 0.15)
  ctx.moveTo(x - size * 0.55, y + size * 0.55)
  ctx.quadraticCurveTo(x - size * 0.35, y + size, x, y + size * 0.8)
  ctx.quadraticCurveTo(x + size * 0.35, y + size, x + size * 0.55, y + size * 0.55)
  ctx.stroke()
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight: number) {
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
}

function drawSingleLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: CanvasTextAlign = 'left',
) {
  const previousAlign = ctx.textAlign
  ctx.textAlign = align
  let output = text
  while (ctx.measureText(output).width > maxWidth && output.length > 4) {
    output = `${output.slice(0, -4).trim()}…`
  }
  ctx.fillText(output, x, y)
  ctx.textAlign = previousAlign
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: TextOptions = {},
) {
  const lineHeight = options.lineHeight ?? 20
  const maxLines = options.maxLines ?? 4
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }

  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines && words.length > 0) {
    const last = lines[lines.length - 1]
    if (ctx.measureText(`${last} …`).width <= maxWidth) lines[lines.length - 1] = `${last} …`
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
}
