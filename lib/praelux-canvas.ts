import type { FactField, OverviewData, ProductChange, ProductEffectType } from './praelux'

export const A4_WIDTH = 1240
export const A4_HEIGHT = 1754

const palette = {
  paper: '#ffffff',
  paperSoft: '#f8fafb',
  navy: '#0a1f38',
  navy2: '#173c62',
  navySoft: '#e9eef4',
  gold: '#c7a35c',
  goldDark: '#a98235',
  goldSoft: '#fbf5e6',
  green: '#17764d',
  greenSoft: '#e9f6ef',
  teal: '#247477',
  amber: '#b88221',
  amberSoft: '#fff3d5',
  red: '#a93c3c',
  redSoft: '#f9e5e5',
  ink: '#102236',
  muted: '#637184',
  line: '#d9e1e8',
}

type TextOptions = {
  lineHeight?: number
  maxLines?: number
}

type Rect = {
  x: number
  y: number
  w: number
  h: number
}

type FactIconKind = 'calendar' | 'person' | 'coin' | 'trend' | 'horizon'
type ProductIconKind = 'income' | 'liability' | 'accident' | 'health' | 'retirement' | 'home' | 'tooth' | 'legal'

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
  drawLogo(ctx, A4_WIDTH / 2, 55)

  setFont(ctx, 43, 900)
  ctx.fillStyle = palette.navy
  drawSingleLine(ctx, 'Gesamtvorteil des neuen Konzepts', A4_WIDTH / 2, 136, 960, 'center')

  setFont(ctx, 20, 800)
  ctx.fillStyle = palette.goldDark
  drawSingleLine(ctx, data.subtitle, A4_WIDTH / 2, 178, 930, 'center')

  setFont(ctx, 16, 500)
  ctx.fillStyle = palette.muted
  drawWrappedText(ctx, data.intro, 180, 212, 880, { lineHeight: 22, maxLines: 2 }, 'center')
}

function drawLogo(ctx: CanvasRenderingContext2D, centerX: number, y: number) {
  drawAnchor(ctx, centerX, y - 18, 16, palette.gold)

  setFont(ctx, 31, 900)
  const left = 'PRAE'
  const right = 'LUX'
  const leftWidth = ctx.measureText(left).width
  const rightWidth = ctx.measureText(right).width
  const start = centerX - (leftWidth + rightWidth) / 2
  ctx.fillStyle = palette.navy
  ctx.fillText(left, start, y + 34)
  ctx.fillStyle = '#8b96a3'
  ctx.fillText(right, start + leftWidth, y + 34)
}

function drawFactStrip(ctx: CanvasRenderingContext2D, facts: FactField[]) {
  const rect = { x: 70, y: 252, w: 1100, h: 88 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.paperSoft, palette.line)

  const cards = facts.slice(0, 5)
  const itemW = rect.w / cards.length
  cards.forEach((fact, index) => {
    const x = rect.x + index * itemW
    if (index > 0) {
      ctx.strokeStyle = palette.line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, rect.y + 18)
      ctx.lineTo(x, rect.y + rect.h - 18)
      ctx.stroke()
    }

    drawFactIcon(ctx, x + 28, rect.y + 45, index, fact.status)
    setFont(ctx, 11, 900)
    ctx.fillStyle = palette.muted
    drawSingleLine(ctx, fact.label.toUpperCase(), x + 56, rect.y + 34, itemW - 72)
    setFont(ctx, 17, 900)
    ctx.fillStyle = fact.status === 'present' ? palette.ink : fact.status === 'check' ? palette.amber : palette.red
    drawSingleLine(ctx, fact.value, x + 56, rect.y + 60, itemW - 72)
  })
}

function drawConceptBoxes(ctx: CanvasRenderingContext2D, data: OverviewData) {
  const y = 386
  const gap = 18
  const w = (1100 - gap * 2) / 3
  drawMetricBox(ctx, { x: 70, y, w, h: 210 }, '1', 'Bestandsaufnahme', data.existing, palette.navy)
  drawMetricBox(
    ctx,
    { x: 70 + w + gap, y, w, h: 210 },
    '2',
    'Empfohlenes Konzept',
    data.recommended,
    palette.navy,
  )
  drawImpactBox(ctx, { x: 70 + (w + gap) * 2, y, w, h: 210 }, data)
}

function drawMetricBox(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  number: string,
  title: string,
  values: { monthlyLabel: string; yearlyLabel: string; note: string },
  accent: string,
) {
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.paper, palette.line)
  drawBoxHeader(ctx, rect, number, title, accent)

  setFont(ctx, 13, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('MONATLICH', rect.x + 24, rect.y + 88)
  setFont(ctx, 31, 900)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, values.monthlyLabel, rect.x + 24, rect.y + 124, rect.w - 48)

  setFont(ctx, 13, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('JÄHRLICH', rect.x + 24, rect.y + 154)
  setFont(ctx, 20, 900)
  ctx.fillStyle = accent
  drawSingleLine(ctx, values.yearlyLabel, rect.x + 24, rect.y + 181, rect.w - 48)
}

function drawImpactBox(ctx: CanvasRenderingContext2D, rect: Rect, data: OverviewData) {
  const accent = data.impact.type === 'saving' ? palette.gold : data.impact.type === 'extra' ? palette.amber : palette.navy
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, data.impact.type === 'saving' ? palette.goldSoft : palette.paper, palette.line)
  drawBoxHeader(ctx, rect, '3', 'Direkte Veränderung', accent)

  setFont(ctx, 13, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('MONATLICH', rect.x + 24, rect.y + 88)
  setFont(ctx, 29, 900)
  ctx.fillStyle = data.impact.type === 'extra' ? palette.amber : accent
  drawSingleLine(ctx, data.impact.monthlyLabel, rect.x + 24, rect.y + 124, rect.w - 48)

  setFont(ctx, 13, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('JÄHRLICH', rect.x + 24, rect.y + 154)
  setFont(ctx, 20, 900)
  ctx.fillStyle = data.impact.type === 'extra' ? palette.amber : palette.ink
  drawSingleLine(ctx, data.impact.yearlyLabel, rect.x + 24, rect.y + 181, rect.w - 48)
}

function drawBoxHeader(ctx: CanvasRenderingContext2D, rect: Rect, number: string, title: string, color: string) {
  ctx.save()
  roundPath(ctx, rect.x, rect.y, rect.w, rect.h, 18)
  ctx.clip()
  ctx.fillStyle = color
  ctx.fillRect(rect.x, rect.y, rect.w, 58)
  ctx.restore()

  ctx.fillStyle = palette.paper
  ctx.beginPath()
  ctx.arc(rect.x + 31, rect.y + 29, 15, 0, Math.PI * 2)
  ctx.fill()
  setFont(ctx, 15, 900)
  ctx.fillStyle = color
  drawSingleLine(ctx, number, rect.x + 31, rect.y + 35, 24, 'center')

  setFont(ctx, 18, 900)
  ctx.fillStyle = palette.paper
  drawSingleLine(ctx, title, rect.x + 56, rect.y + 36, rect.w - 76)
}

function drawChanges(ctx: CanvasRenderingContext2D, changes: ProductChange[]) {
  drawSectionTitle(ctx, '4', 'Wesentliche Veränderungen', 70, 612, palette.gold)

  const frame = { x: 70, y: 642, w: 1100, h: 520 }
  roundedRect(ctx, frame.x, frame.y, frame.w, frame.h, 18, palette.paper, palette.gold)

  const cards = changes.slice(0, 8)
  const gap = 14
  const columns = 2
  const cardW = (frame.w - 40 - gap * (columns - 1)) / columns
  const cardH = 110
  cards.forEach((change, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    const x = frame.x + 20 + col * (cardW + gap)
    const y = frame.y + 50 + row * (cardH + 7)
    drawProductCard(ctx, { x, y, w: cardW, h: cardH }, change)
  })

  setFont(ctx, 15, 700)
  ctx.fillStyle = palette.muted
  ctx.fillText('Acht Kernkategorien mit Alt-Beitrag, Neu-Beitrag und Wirkung aus Mandantensicht', frame.x + 20, frame.y + 31)
}

function drawProductCard(ctx: CanvasRenderingContext2D, rect: Rect, change: ProductChange) {
  if (rect.h < 130) {
    drawCompactProductCard(ctx, rect, change)
    return
  }

  const tone = toneForEffect(change.effectType)
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 12, tone.bg, tone.border)
  drawProductIcon(ctx, rect.x + rect.w / 2, rect.y + 28, change.title, tone.accent)

  setFont(ctx, 14, 900)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, change.title, rect.x + rect.w / 2, rect.y + 62, rect.w - 24, 'center')

  setFont(ctx, 11, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('ALT', rect.x + 14, rect.y + 86)
  setFont(ctx, 12, 700)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, change.oldProduct, rect.x + 54, rect.y + 86, rect.w - 66)
  setFont(ctx, 11, 800)
  ctx.fillStyle = change.oldMonthly === undefined ? palette.red : palette.muted
  drawSingleLine(ctx, change.oldMonthlyLabel, rect.x + 54, rect.y + 103, rect.w - 66)

  setFont(ctx, 11, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('NEU', rect.x + 14, rect.y + 122)
  setFont(ctx, 12, 700)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, change.newProduct, rect.x + 54, rect.y + 122, rect.w - 66)
  setFont(ctx, 11, 800)
  ctx.fillStyle = change.newMonthly === undefined ? palette.red : palette.muted
  drawSingleLine(ctx, change.newMonthlyLabel, rect.x + 54, rect.y + 139, rect.w - 66)

  roundedRect(ctx, rect.x + 12, rect.y + 147, rect.w - 24, 24, 12, tone.badge, tone.border)
  setFont(ctx, 12, 900)
  ctx.fillStyle = tone.accent
  drawSingleLine(ctx, change.effectLabel, rect.x + rect.w / 2, rect.y + 164, rect.w - 36, 'center')
}

function drawCompactProductCard(ctx: CanvasRenderingContext2D, rect: Rect, change: ProductChange) {
  const tone = toneForEffect(change.effectType)
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 12, tone.bg, tone.border)
  drawProductIcon(ctx, rect.x + 31, rect.y + 34, change.title, tone.accent, 18)

  setFont(ctx, 16, 900)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, change.title, rect.x + 64, rect.y + 24, rect.w - 238, { lineHeight: 16, maxLines: 2 })

  roundedRect(ctx, rect.x + rect.w - 170, rect.y + 14, 156, 30, 15, tone.badge, tone.border)
  setFont(ctx, 14, 900)
  ctx.fillStyle = tone.accent
  drawSingleLine(ctx, change.effectLabel, rect.x + rect.w - 92, rect.y + 34, 142, 'center')

  setFont(ctx, 13, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('ALT', rect.x + 64, rect.y + 70)
  setFont(ctx, 14, 900)
  ctx.fillStyle = change.oldMonthly === undefined ? palette.red : palette.ink
  drawSingleLine(ctx, change.oldProduct, rect.x + 104, rect.y + 70, 156)
  setFont(ctx, 15, 900)
  ctx.fillStyle = change.oldMonthly === undefined ? palette.red : palette.muted
  drawSingleLine(ctx, change.oldMonthlyLabel, rect.x + 274, rect.y + 70, 140)

  setFont(ctx, 13, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('NEU', rect.x + 64, rect.y + 96)
  setFont(ctx, 14, 900)
  ctx.fillStyle = change.newMonthly === undefined ? palette.red : palette.ink
  drawSingleLine(ctx, change.newProduct, rect.x + 104, rect.y + 96, 156)
  setFont(ctx, 15, 900)
  ctx.fillStyle = change.newMonthly === undefined ? palette.red : palette.muted
  drawSingleLine(ctx, change.newMonthlyLabel, rect.x + 274, rect.y + 96, 140)
}

function drawLongTermSaving(ctx: CanvasRenderingContext2D, data: OverviewData) {
  drawSectionTitle(ctx, '5', `Reine Beitragsersparnis bis ${data.targetAge}`, 70, 1190, palette.green)

  const rect = { x: 70, y: 1216, w: 1100, h: 132 }
  const isPresent = data.longTermSaving.status === 'present'
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 20, isPresent ? palette.greenSoft : palette.amberSoft, isPresent ? '#b7dec9' : '#ead49a')

  ctx.fillStyle = isPresent ? palette.green : palette.amber
  roundPath(ctx, rect.x, rect.y, 122, rect.h, 20)
  ctx.fill()
  drawSavingsIcon(ctx, rect.x + 61, rect.y + 66, palette.paper)

  setFont(ctx, 18, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('GESAMTVORTEIL', rect.x + 156, rect.y + 36)
  ctx.fillStyle = isPresent ? palette.green : palette.amber
  drawFittedSingleLine(ctx, data.longTermSaving.label, rect.x + 156, rect.y + 78, 386, {
    maxSize: isPresent ? 38 : 27,
    minSize: 22,
    weight: 900,
  })

  setFont(ctx, 14, 800)
  ctx.fillStyle = palette.muted
  if (isPresent) {
    drawWrappedText(ctx, data.longTermSaving.note, rect.x + 158, rect.y + 98, 380, { lineHeight: 15, maxLines: 2 })
  } else {
    drawWrappedText(ctx, data.longTermSaving.note, rect.x + 158, rect.y + 96, 380, { lineHeight: 18, maxLines: 2 })
  }

  setFont(ctx, 16, 600)
  ctx.fillStyle = palette.ink
  drawWrappedText(
    ctx,
    'Diese Ersparnis bezieht sich auf die Optimierung der bisherigen Bausteine vor Einrechnung neuer zusätzlicher Bausteine.',
    rect.x + 590,
    rect.y + 46,
    470,
    { lineHeight: 21, maxLines: 3 },
  )
}

function drawOptionalPotential(ctx: CanvasRenderingContext2D, text: string) {
  drawSectionTitle(ctx, '6', 'Optionales Zusatzpotenzial', 70, 1376, palette.gold)

  const rect = { x: 70, y: 1400, w: 1100, h: 74 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.goldSoft, '#e5cf95')
  drawSmallCircleIcon(ctx, rect.x + 48, rect.y + 37, palette.gold)

  setFont(ctx, 16, 700)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, text, rect.x + 92, rect.y + 29, rect.w - 124, { lineHeight: 19, maxLines: 2 })
}

function drawConclusion(ctx: CanvasRenderingContext2D, data: OverviewData) {
  drawSectionTitle(ctx, '7', 'Fazit', 70, 1502, palette.navy)

  const rect = { x: 70, y: 1526, w: 1100, h: 74 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.paper, palette.line)
  ctx.fillStyle = palette.navy
  roundPath(ctx, rect.x, rect.y, 126, rect.h, 18)
  ctx.fill()
  drawCheckIcon(ctx, rect.x + 63, rect.y + 38, palette.paper)

  setFont(ctx, 16, 700)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, data.conclusion, rect.x + 158, rect.y + 27, rect.w - 190, { lineHeight: 19, maxLines: 2 })
}

function drawNotices(ctx: CanvasRenderingContext2D, notices: string[]) {
  drawSectionTitle(ctx, '8', 'Modellannahmen & Hinweise', 70, 1636, palette.navy)

  const startX = 70
  const startY = 1660
  const itemW = 270
  setFont(ctx, 12, 700)
  notices.slice(0, 8).forEach((notice, index) => {
    const col = index % 4
    const row = Math.floor(index / 4)
    const x = startX + col * itemW
    const y = startY + row * 32
    drawMiniNoticeIcon(ctx, x + 7, y - 4)
    ctx.fillStyle = palette.muted
    drawSingleLine(ctx, notice, x + 22, y, 232)
  })
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(70, 1715)
  ctx.lineTo(1170, 1715)
  ctx.stroke()

  setFont(ctx, 17, 900)
  ctx.fillStyle = palette.navy
  drawSingleLine(ctx, 'PraeLux', A4_WIDTH / 2, 1739, 120, 'center')
  drawAnchor(ctx, A4_WIDTH / 2 + 50, 1730, 9, palette.gold)
}

function drawSectionTitle(
  ctx: CanvasRenderingContext2D,
  number: string,
  title: string,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x + 15, y - 7, 15, 0, Math.PI * 2)
  ctx.fill()
  setFont(ctx, 15, 900)
  ctx.fillStyle = palette.paper
  drawSingleLine(ctx, number, x + 15, y - 1, 24, 'center')

  setFont(ctx, 24, 900)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, title, x + 42, y, 650)
}

function toneForEffect(effectType: ProductEffectType) {
  if (effectType === 'saving') {
    return { bg: palette.greenSoft, border: '#b9dec9', accent: palette.green, badge: '#dff0e7' }
  }
  if (effectType === 'extra' || effectType === 'new') {
    return { bg: palette.amberSoft, border: '#ead49a', accent: palette.amber, badge: '#fff8e5' }
  }
  if (effectType === 'missing') {
    return { bg: palette.redSoft, border: '#edc0c0', accent: palette.red, badge: '#fff0f0' }
  }
  return { bg: palette.paperSoft, border: palette.line, accent: palette.teal, badge: '#eef7f7' }
}

function drawFactIcon(ctx: CanvasRenderingContext2D, x: number, y: number, index: number, status: string) {
  const color = status === 'present' ? palette.gold : status === 'check' ? palette.amber : palette.red
  if (index >= 0) {
    drawIconCircle(ctx, x, y, 15, color)
    drawFactSymbol(ctx, x, y, factIconKind(index), color, 15)
    return
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = color
  setFont(ctx, 12, 900)
  drawSingleLine(ctx, ['G', 'A', '€', '+', 'Z'][index] ?? '•', x, y + 4, 24, 'center')
}

function drawProductIcon(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, color: string, radius = 19) {
  if (radius > 0) {
    drawIconCircle(ctx, x, y, radius, color)
    drawProductSymbol(ctx, x, y, productIconKind(title), color, radius)
    return
  }
  ctx.strokeStyle = color
  ctx.fillStyle = palette.paper
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  const icon = iconInitial(title)
  setFont(ctx, icon.length > 1 ? 11 : 14, 900)
  ctx.fillStyle = color
  drawSingleLine(ctx, icon, x, y + 5, radius * 1.6, 'center')
}

function drawSavingsIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(x - 30, y - 18, 60, 42, 18)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + 32, y - 2, 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - 10, y - 22)
  ctx.lineTo(x + 12, y - 22)
  ctx.stroke()
}

function drawSmallCircleIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 24, 0, Math.PI * 2)
  ctx.fill()
  setFont(ctx, 24, 900)
  ctx.fillStyle = palette.paper
  drawSingleLine(ctx, '+', x, y + 8, 30, 'center')
}

function drawCheckIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 28, y - 2)
  ctx.lineTo(x - 8, y + 20)
  ctx.lineTo(x + 32, y - 26)
  ctx.stroke()
  ctx.lineCap = 'butt'
}

function drawMiniNoticeIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = palette.gold
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
}

function drawIconCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.strokeStyle = color
  ctx.fillStyle = palette.paper
  ctx.lineWidth = Math.max(1.8, radius * 0.13)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawFactSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: FactIconKind,
  color: string,
  radius: number,
) {
  beginIconStroke(ctx, color, radius)

  if (kind === 'calendar') {
    ctx.roundRect(x - radius * 0.48, y - radius * 0.36, radius * 0.96, radius * 0.76, radius * 0.12)
    ctx.moveTo(x - radius * 0.48, y - radius * 0.12)
    ctx.lineTo(x + radius * 0.48, y - radius * 0.12)
    ctx.moveTo(x - radius * 0.22, y - radius * 0.5)
    ctx.lineTo(x - radius * 0.22, y - radius * 0.24)
    ctx.moveTo(x + radius * 0.22, y - radius * 0.5)
    ctx.lineTo(x + radius * 0.22, y - radius * 0.24)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'person') {
    ctx.arc(x, y - radius * 0.22, radius * 0.2, 0, Math.PI * 2)
    ctx.moveTo(x - radius * 0.48, y + radius * 0.5)
    ctx.quadraticCurveTo(x, y + radius * 0.1, x + radius * 0.48, y + radius * 0.5)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'coin') {
    ctx.ellipse(x, y, radius * 0.42, radius * 0.52, 0, 0, Math.PI * 2)
    ctx.moveTo(x - radius * 0.18, y - radius * 0.12)
    ctx.lineTo(x + radius * 0.2, y - radius * 0.12)
    ctx.moveTo(x - radius * 0.18, y + radius * 0.12)
    ctx.lineTo(x + radius * 0.2, y + radius * 0.12)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'trend') {
    ctx.moveTo(x - radius * 0.5, y + radius * 0.3)
    ctx.lineTo(x - radius * 0.15, y + radius * 0.02)
    ctx.lineTo(x + radius * 0.08, y + radius * 0.14)
    ctx.lineTo(x + radius * 0.48, y - radius * 0.34)
    ctx.moveTo(x + radius * 0.2, y - radius * 0.34)
    ctx.lineTo(x + radius * 0.48, y - radius * 0.34)
    ctx.lineTo(x + radius * 0.48, y - radius * 0.06)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  ctx.arc(x, y, radius * 0.43, -Math.PI * 0.95, Math.PI * 0.85)
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - radius * 0.28)
  ctx.moveTo(x, y)
  ctx.lineTo(x + radius * 0.24, y + radius * 0.15)
  ctx.moveTo(x + radius * 0.18, y + radius * 0.46)
  ctx.lineTo(x + radius * 0.52, y + radius * 0.46)
  ctx.stroke()
  endIconStroke(ctx)
}

function drawProductSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: ProductIconKind,
  color: string,
  radius: number,
) {
  beginIconStroke(ctx, color, radius)

  if (kind === 'income') {
    drawShieldPath(ctx, x, y - radius * 0.02, radius * 0.62)
    ctx.moveTo(x, y - radius * 0.1)
    ctx.arc(x, y - radius * 0.14, radius * 0.14, 0, Math.PI * 2)
    ctx.moveTo(x - radius * 0.24, y + radius * 0.28)
    ctx.quadraticCurveTo(x, y + radius * 0.08, x + radius * 0.24, y + radius * 0.28)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'liability') {
    drawShieldPath(ctx, x, y, radius * 0.66)
    ctx.moveTo(x - radius * 0.22, y + radius * 0.04)
    ctx.lineTo(x - radius * 0.04, y + radius * 0.22)
    ctx.lineTo(x + radius * 0.28, y - radius * 0.22)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'accident') {
    ctx.roundRect(x - radius * 0.14, y - radius * 0.48, radius * 0.28, radius * 0.96, radius * 0.08)
    ctx.roundRect(x - radius * 0.48, y - radius * 0.14, radius * 0.96, radius * 0.28, radius * 0.08)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'health') {
    ctx.moveTo(x - radius * 0.5, y + radius * 0.02)
    ctx.lineTo(x - radius * 0.25, y + radius * 0.02)
    ctx.lineTo(x - radius * 0.1, y - radius * 0.25)
    ctx.lineTo(x + radius * 0.08, y + radius * 0.28)
    ctx.lineTo(x + radius * 0.22, y - radius * 0.04)
    ctx.lineTo(x + radius * 0.5, y - radius * 0.04)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'retirement') {
    ctx.moveTo(x, y + radius * 0.48)
    ctx.lineTo(x, y - radius * 0.32)
    ctx.moveTo(x, y - radius * 0.02)
    ctx.quadraticCurveTo(x - radius * 0.46, y - radius * 0.32, x - radius * 0.48, y - radius * 0.62)
    ctx.quadraticCurveTo(x - radius * 0.1, y - radius * 0.58, x, y - radius * 0.12)
    ctx.moveTo(x, y - radius * 0.02)
    ctx.quadraticCurveTo(x + radius * 0.46, y - radius * 0.32, x + radius * 0.48, y - radius * 0.62)
    ctx.quadraticCurveTo(x + radius * 0.1, y - radius * 0.58, x, y - radius * 0.12)
    ctx.moveTo(x - radius * 0.4, y + radius * 0.5)
    ctx.lineTo(x + radius * 0.4, y + radius * 0.5)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'home') {
    ctx.moveTo(x - radius * 0.55, y - radius * 0.02)
    ctx.lineTo(x, y - radius * 0.5)
    ctx.lineTo(x + radius * 0.55, y - radius * 0.02)
    ctx.moveTo(x - radius * 0.38, y)
    ctx.lineTo(x - radius * 0.38, y + radius * 0.5)
    ctx.lineTo(x + radius * 0.38, y + radius * 0.5)
    ctx.lineTo(x + radius * 0.38, y)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  if (kind === 'tooth') {
    ctx.moveTo(x - radius * 0.34, y - radius * 0.36)
    ctx.bezierCurveTo(x - radius * 0.58, y - radius * 0.12, x - radius * 0.32, y + radius * 0.58, x - radius * 0.05, y + radius * 0.32)
    ctx.bezierCurveTo(x + radius * 0.02, y + radius * 0.22, x - radius * 0.02, y + radius * 0.1, x, y + radius * 0.02)
    ctx.bezierCurveTo(x + radius * 0.02, y + radius * 0.1, x - radius * 0.02, y + radius * 0.22, x + radius * 0.05, y + radius * 0.32)
    ctx.bezierCurveTo(x + radius * 0.32, y + radius * 0.58, x + radius * 0.58, y - radius * 0.12, x + radius * 0.34, y - radius * 0.36)
    ctx.bezierCurveTo(x + radius * 0.18, y - radius * 0.5, x + radius * 0.1, y - radius * 0.34, x, y - radius * 0.32)
    ctx.bezierCurveTo(x - radius * 0.1, y - radius * 0.34, x - radius * 0.18, y - radius * 0.5, x - radius * 0.34, y - radius * 0.36)
    ctx.stroke()
    endIconStroke(ctx)
    return
  }

  ctx.moveTo(x, y - radius * 0.52)
  ctx.lineTo(x, y + radius * 0.46)
  ctx.moveTo(x - radius * 0.38, y + radius * 0.46)
  ctx.lineTo(x + radius * 0.38, y + radius * 0.46)
  ctx.moveTo(x - radius * 0.5, y - radius * 0.18)
  ctx.lineTo(x + radius * 0.5, y - radius * 0.18)
  ctx.moveTo(x - radius * 0.34, y - radius * 0.18)
  ctx.lineTo(x - radius * 0.52, y + radius * 0.16)
  ctx.lineTo(x - radius * 0.16, y + radius * 0.16)
  ctx.closePath()
  ctx.moveTo(x + radius * 0.34, y - radius * 0.18)
  ctx.lineTo(x + radius * 0.16, y + radius * 0.16)
  ctx.lineTo(x + radius * 0.52, y + radius * 0.16)
  ctx.closePath()
  ctx.stroke()
  endIconStroke(ctx)
}

function beginIconStroke(ctx: CanvasRenderingContext2D, color: string, radius: number) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.6, radius * 0.12)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
}

function endIconStroke(ctx: CanvasRenderingContext2D) {
  ctx.restore()
}

function drawShieldPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.moveTo(x, y - size * 0.62)
  ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.42, x - size * 0.48, y - size * 0.08)
  ctx.quadraticCurveTo(x - size * 0.42, y + size * 0.36, x, y + size * 0.66)
  ctx.quadraticCurveTo(x + size * 0.42, y + size * 0.36, x + size * 0.48, y - size * 0.08)
  ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.42, x, y - size * 0.62)
}

function factIconKind(index: number): FactIconKind {
  return (['calendar', 'person', 'coin', 'trend', 'horizon'] as const)[index] ?? 'calendar'
}

function productIconKind(title: string): ProductIconKind {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ÃŸ/g, 'ss')
    .toLocaleLowerCase('de-DE')

  if (normalized.includes('berufsun')) return 'income'
  if (normalized.includes('haftpflicht')) return 'liability'
  if (normalized.includes('unfall')) return 'accident'
  if (normalized.includes('kranken') || normalized.includes('pflege') || normalized.includes('krankenkasse')) return 'health'
  if (normalized.includes('altersvorsorge')) return 'retirement'
  if (normalized.includes('hausrat')) return 'home'
  if (normalized.includes('zahn')) return 'tooth'
  if (normalized.includes('rechtsschutz')) return 'legal'
  return 'liability'
}

function iconInitial(title: string) {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLocaleLowerCase('de-DE')

  if (normalized.includes('berufsun')) return 'BU'
  if (normalized.includes('haftpflicht')) return 'HP'
  if (normalized.includes('unfall')) return 'U'
  if (normalized.includes('kranken') || normalized.includes('pflege') || normalized.includes('krankenkasse')) return 'KV'
  if (normalized.includes('altersvorsorge')) return 'AV'
  if (normalized.includes('hausrat')) return 'HR'
  if (normalized.includes('zahn')) return 'ZZ'
  if (normalized.includes('rechtsschutz')) return '§'
  return title.slice(0, 1).toUpperCase()
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

function drawFittedSingleLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: { maxSize: number; minSize: number; weight: number },
  align: CanvasTextAlign = 'left',
) {
  const previousAlign = ctx.textAlign
  ctx.textAlign = align

  let fontSize = options.maxSize
  setFont(ctx, fontSize, options.weight)

  while (ctx.measureText(text).width > maxWidth && fontSize > options.minSize) {
    fontSize -= 1
    setFont(ctx, fontSize, options.weight)
  }

  ctx.fillText(text, x, y)
  ctx.textAlign = previousAlign
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: TextOptions = {},
  align: CanvasTextAlign = 'left',
) {
  const lineHeight = options.lineHeight ?? 20
  const maxLines = options.maxLines ?? 4
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  let truncated = false

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) {
      truncated = true
      break
    }
  }

  if (current && lines.length < maxLines) lines.push(current)
  if (truncated && lines.length === maxLines) {
    const last = lines[lines.length - 1]
    if (ctx.measureText(`${last} …`).width <= maxWidth) lines[lines.length - 1] = `${last} …`
  }

  const previousAlign = ctx.textAlign
  ctx.textAlign = align
  lines.forEach((line, index) => {
    const drawX = align === 'center' ? x + maxWidth / 2 : x
    ctx.fillText(line, drawX, y + index * lineHeight)
  })
  ctx.textAlign = previousAlign
}
