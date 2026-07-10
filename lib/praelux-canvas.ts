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
  drawSectionTitle(ctx, '4', 'Wesentliche Veränderungen', 70, 650, palette.gold)

  const frame = { x: 70, y: 680, w: 1100, h: 250 }
  roundedRect(ctx, frame.x, frame.y, frame.w, frame.h, 18, palette.paper, palette.gold)

  const cards = changes.slice(0, 8)
  const gap = 10
  const columns = 4
  const cardW = (frame.w - 40 - gap * (columns - 1)) / columns
  const cardH = 86
  cards.forEach((change, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    const x = frame.x + 20 + col * (cardW + gap)
    const y = frame.y + 54 + row * (cardH + 12)
    drawProductCard(ctx, { x, y, w: cardW, h: cardH }, change)
  })

  setFont(ctx, 14, 700)
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
  drawProductIcon(ctx, rect.x + 25, rect.y + 22, change.title, tone.accent, 14)

  setFont(ctx, 10, 900)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, change.title, rect.x + 48, rect.y + 16, rect.w - 62, { lineHeight: 12, maxLines: 2 })

  setFont(ctx, 9, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('ALT', rect.x + 14, rect.y + 55)
  setFont(ctx, 10, 800)
  ctx.fillStyle = change.oldMonthly === undefined ? palette.red : palette.ink
  drawSingleLine(ctx, change.oldMonthlyLabel, rect.x + 40, rect.y + 55, 86)

  setFont(ctx, 9, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('NEU', rect.x + 132, rect.y + 55)
  setFont(ctx, 10, 800)
  ctx.fillStyle = change.newMonthly === undefined ? palette.red : palette.ink
  drawSingleLine(ctx, change.newMonthlyLabel, rect.x + 160, rect.y + 55, rect.w - 172)

  roundedRect(ctx, rect.x + 12, rect.y + 64, rect.w - 24, 18, 9, tone.badge, tone.border)
  setFont(ctx, 10, 900)
  ctx.fillStyle = tone.accent
  drawSingleLine(ctx, change.effectLabel, rect.x + rect.w / 2, rect.y + 77, rect.w - 34, 'center')
}

function drawLongTermSaving(ctx: CanvasRenderingContext2D, data: OverviewData) {
  drawSectionTitle(ctx, '5', `Reine Beitragsersparnis bis ${data.targetAge}`, 70, 972, palette.green)

  const rect = { x: 70, y: 1002, w: 1100, h: 174 }
  const isPresent = data.longTermSaving.status === 'present'
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 20, isPresent ? palette.greenSoft : palette.amberSoft, isPresent ? '#b7dec9' : '#ead49a')

  ctx.fillStyle = isPresent ? palette.green : palette.amber
  roundPath(ctx, rect.x, rect.y, 122, rect.h, 20)
  ctx.fill()
  drawSavingsIcon(ctx, rect.x + 61, rect.y + 88, palette.paper)

  setFont(ctx, 18, 900)
  ctx.fillStyle = palette.muted
  ctx.fillText('GESAMTVORTEIL', rect.x + 156, rect.y + 52)
  setFont(ctx, isPresent ? 50 : 32, 900)
  ctx.fillStyle = isPresent ? palette.green : palette.amber
  drawSingleLine(ctx, data.longTermSaving.label, rect.x + 156, rect.y + 111, 380)

  setFont(ctx, 14, 800)
  ctx.fillStyle = palette.muted
  if (isPresent) {
    drawSingleLine(ctx, data.longTermSaving.note, rect.x + 158, rect.y + 140, 380)
  } else {
    drawWrappedText(ctx, data.longTermSaving.note, rect.x + 158, rect.y + 134, 380, { lineHeight: 18, maxLines: 2 })
  }

  setFont(ctx, 18, 600)
  ctx.fillStyle = palette.ink
  drawWrappedText(
    ctx,
    'Diese Ersparnis bezieht sich auf die Optimierung der bisherigen Bausteine vor Einrechnung neuer zusätzlicher Bausteine.',
    rect.x + 590,
    rect.y + 64,
    470,
    { lineHeight: 25, maxLines: 3 },
  )
}

function drawOptionalPotential(ctx: CanvasRenderingContext2D, text: string) {
  drawSectionTitle(ctx, '6', 'Optionales Zusatzpotenzial', 70, 1223, palette.gold)

  const rect = { x: 70, y: 1253, w: 1100, h: 120 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.goldSoft, '#e5cf95')
  drawSmallCircleIcon(ctx, rect.x + 48, rect.y + 60, palette.gold)

  setFont(ctx, 19, 700)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, text, rect.x + 92, rect.y + 47, rect.w - 124, { lineHeight: 25, maxLines: 3 })
}

function drawConclusion(ctx: CanvasRenderingContext2D, data: OverviewData) {
  drawSectionTitle(ctx, '7', 'Fazit', 70, 1422, palette.navy)

  const rect = { x: 70, y: 1452, w: 1100, h: 126 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.paper, palette.line)
  ctx.fillStyle = palette.navy
  roundPath(ctx, rect.x, rect.y, 126, rect.h, 18)
  ctx.fill()
  drawCheckIcon(ctx, rect.x + 63, rect.y + 64, palette.paper)

  setFont(ctx, 18, 700)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, data.conclusion, rect.x + 158, rect.y + 45, rect.w - 190, { lineHeight: 25, maxLines: 3 })
}

function drawNotices(ctx: CanvasRenderingContext2D, notices: string[]) {
  drawSectionTitle(ctx, '8', 'Modellannahmen & Hinweise', 70, 1624, palette.navy)

  const startX = 70
  const startY = 1651
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
