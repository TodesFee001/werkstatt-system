import {
  formatInvestmentCurrency,
  formatInvestmentPercent,
  type InvestmentCategory,
  type InvestmentConceptData,
  type InvestmentProjectionPoint,
} from './investment-concept'

export const INVESTMENT_CANVAS_WIDTH = 1240
export const INVESTMENT_CANVAS_HEIGHT = 1754

const palette = {
  paper: '#ffffff',
  paperSoft: '#f8fafb',
  navy: '#0a1f38',
  navy2: '#173c62',
  gold: '#c7a35c',
  goldSoft: '#fbf5e6',
  green: '#17764d',
  greenSoft: '#e9f6ef',
  teal: '#247477',
  tealSoft: '#eef7f7',
  ink: '#102236',
  muted: '#637184',
  line: '#d9e1e8',
}

type Rect = {
  x: number
  y: number
  w: number
  h: number
}

export function drawInvestmentConcept(canvas: HTMLCanvasElement, data: InvestmentConceptData, scale = 2) {
  canvas.width = INVESTMENT_CANVAS_WIDTH * scale
  canvas.height = INVESTMENT_CANVAS_HEIGHT * scale
  canvas.style.width = `${INVESTMENT_CANVAS_WIDTH}px`
  canvas.style.height = `${INVESTMENT_CANVAS_HEIGHT}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, INVESTMENT_CANVAS_WIDTH, INVESTMENT_CANVAS_HEIGHT)
  ctx.fillStyle = palette.paper
  ctx.fillRect(0, 0, INVESTMENT_CANVAS_WIDTH, INVESTMENT_CANVAS_HEIGHT)

  drawHeader(ctx, data)
  drawAllocation(ctx, data)
  drawProjection(ctx, data)
  drawSummary(ctx, data)
  drawFooter(ctx)
}

function drawHeader(ctx: CanvasRenderingContext2D, data: InvestmentConceptData) {
  setFont(ctx, 46, 900)
  ctx.fillStyle = palette.navy
  drawSingleLine(ctx, 'Investmentkonzept', INVESTMENT_CANVAS_WIDTH / 2, 104, 900, 'center')

  setFont(ctx, 20, 800)
  ctx.fillStyle = palette.gold
  const horizon = data.horizonYears === undefined ? 'Anlagehorizont offen' : `${data.horizonYears} Jahre bis ${data.targetAge}`
  drawSingleLine(ctx, `${data.clientName} | ${horizon}`, INVESTMENT_CANVAS_WIDTH / 2, 146, 900, 'center')

  setFont(ctx, 15, 700)
  ctx.fillStyle = palette.muted
  drawSingleLine(
    ctx,
    'Monatliche Struktur und modellhafte Entwicklung mit vorschuessiger Einzahlung und jaehrlicher Zinsansammlung.',
    INVESTMENT_CANVAS_WIDTH / 2,
    180,
    980,
    'center',
  )
}

function drawAllocation(ctx: CanvasRenderingContext2D, data: InvestmentConceptData) {
  drawSectionTitle(ctx, '1', 'Aufteilung der monatlichen Struktur', 70, 250, palette.gold)

  const rect = { x: 70, y: 280, w: 1100, h: 420 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.paperSoft, palette.line)
  drawPie(ctx, data.categories, data.totalMonthly, rect)
  drawCategoryLegend(ctx, data.categories, rect)
}

function drawPie(ctx: CanvasRenderingContext2D, categories: InvestmentCategory[], totalMonthly: number, rect: Rect) {
  const cx = rect.x + 372
  const cy = rect.y + 210
  const radius = 142
  const totalWeight = totalMonthly > 0 ? totalMonthly : categories.length
  let start = -Math.PI / 2

  categories.forEach((category) => {
    const weight = totalMonthly > 0 ? Math.max(0, category.monthly) : 1
    const slice = (weight / totalWeight) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, start + slice)
    ctx.closePath()
    ctx.fillStyle = category.color
    ctx.fill()
    ctx.strokeStyle = palette.paper
    ctx.lineWidth = 5
    ctx.stroke()
    start += slice
  })

  ctx.beginPath()
  ctx.arc(cx, cy, 44, 0, Math.PI * 2)
  ctx.fillStyle = palette.paper
  ctx.fill()
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 2
  ctx.stroke()

  setFont(ctx, 13, 900)
  ctx.fillStyle = palette.muted
  drawSingleLine(ctx, 'GESAMT', cx, cy - 7, 120, 'center')
  setFont(ctx, 18, 900)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, totalMonthly > 0 ? dataSafeMoney(totalMonthly) : 'offen', cx, cy + 18, 130, 'center')

  drawCallout(ctx, cx - 126, cy - 98, rect.x + 140, rect.y + 112, 'Depot')
  drawCallout(ctx, cx + 120, cy - 88, rect.x + 706, rect.y + 110, 'Versicherungen / Krankenkasse')
  drawCallout(ctx, cx + 112, cy + 84, rect.x + 715, rect.y + 300, 'Reservehaltung / Fixkosten')
  drawCallout(ctx, cx - 122, cy + 92, rect.x + 142, rect.y + 302, 'Altersvorsorge')
}

function drawCategoryLegend(ctx: CanvasRenderingContext2D, categories: InvestmentCategory[], rect: Rect) {
  const startX = rect.x + 670
  const startY = rect.y + 155
  const itemH = 52

  categories.forEach((category, index) => {
    const y = startY + index * itemH
    ctx.fillStyle = category.color
    ctx.beginPath()
    ctx.roundRect(startX, y - 20, 26, 26, 7)
    ctx.fill()

    setFont(ctx, 15, 900)
    ctx.fillStyle = palette.ink
    drawSingleLine(ctx, category.label, startX + 42, y - 3, 320)
    setFont(ctx, 13, 800)
    ctx.fillStyle = palette.muted
    drawSingleLine(ctx, category.monthlyLabel, startX + 42, y + 20, 220)
  })
}

function drawProjection(ctx: CanvasRenderingContext2D, data: InvestmentConceptData) {
  drawSectionTitle(ctx, '2', 'Entwicklung Kapital / Zeit', 70, 760, palette.navy)

  const rect = { x: 70, y: 792, w: 1100, h: 620 }
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, palette.paper, palette.line)

  const chart = { x: rect.x + 86, y: rect.y + 86, w: rect.w - 150, h: 420 }
  const maxValue = niceMax(Math.max(data.depotFuture, data.retirementFuture, 50000))
  drawChartGrid(ctx, chart, maxValue)
  drawProjectionLine(ctx, chart, data.points, maxValue, 'retirement', palette.green, true)
  drawProjectionLine(ctx, chart, data.points, maxValue, 'depot', palette.navy, false)
  drawChartLabels(ctx, chart, data)
}

function drawChartGrid(ctx: CanvasRenderingContext2D, chart: Rect, maxValue: number) {
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 1
  setFont(ctx, 12, 800)

  for (let index = 0; index <= 5; index += 1) {
    const ratio = index / 5
    const y = chart.y + chart.h - chart.h * ratio
    ctx.beginPath()
    ctx.moveTo(chart.x, y)
    ctx.lineTo(chart.x + chart.w, y)
    ctx.stroke()
    ctx.fillStyle = palette.muted
    drawSingleLine(ctx, compactMoney(maxValue * ratio), chart.x - 12, y + 4, 72, 'right')
  }

  ctx.strokeStyle = palette.ink
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(chart.x, chart.y)
  ctx.lineTo(chart.x, chart.y + chart.h)
  ctx.lineTo(chart.x + chart.w, chart.y + chart.h)
  ctx.stroke()

  setFont(ctx, 15, 900)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, 'Kapital', chart.x - 36, chart.y - 22, 120)
  drawSingleLine(ctx, 'Zeit', chart.x + chart.w + 18, chart.y + chart.h + 7, 90)
}

function drawProjectionLine(
  ctx: CanvasRenderingContext2D,
  chart: Rect,
  points: InvestmentProjectionPoint[],
  maxValue: number,
  key: 'depot' | 'retirement',
  color: string,
  filled: boolean,
) {
  if (points.length === 0) return
  const horizon = Math.max(1, points[points.length - 1]?.year ?? 1)
  const toX = (year: number) => chart.x + (year / horizon) * chart.w
  const toY = (value: number) => chart.y + chart.h - (value / maxValue) * chart.h

  ctx.beginPath()
  points.forEach((point, index) => {
    const x = toX(point.year)
    const y = toY(point[key])
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })

  if (filled) {
    ctx.lineTo(toX(points[points.length - 1].year), chart.y + chart.h)
    ctx.lineTo(chart.x, chart.y + chart.h)
    ctx.closePath()
    ctx.fillStyle = `${color}22`
    ctx.fill()
  }

  ctx.beginPath()
  points.forEach((point, index) => {
    const x = toX(point.year)
    const y = toY(point[key])
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.lineCap = 'butt'

  const last = points[points.length - 1]
  if (last[key] <= 0) return
  const label = key === 'depot' ? 'Depot' : 'Altersvorsorge'
  setFont(ctx, 17, 900)
  ctx.fillStyle = color
  drawSingleLine(ctx, label, toX(last.year) - 120, toY(last[key]) - 12, 220)
}

function drawChartLabels(ctx: CanvasRenderingContext2D, chart: Rect, data: InvestmentConceptData) {
  if (data.horizonYears === undefined || data.horizonYears <= 0) return
  const horizon = Math.max(1, data.horizonYears ?? 1)
  const marks = Array.from(new Set([10, 20, horizon])).filter((year) => year > 0 && year <= horizon)
  setFont(ctx, 14, 900)
  ctx.fillStyle = palette.muted

  marks.forEach((year) => {
    const x = chart.x + (year / horizon) * chart.w
    ctx.strokeStyle = palette.line
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, chart.y + chart.h - 10)
    ctx.lineTo(x, chart.y + chart.h + 10)
    ctx.stroke()

    const label = year === horizon ? `${data.targetAge}. Lebensjahr` : `${year} Jahre`
    drawSingleLine(ctx, label, x, chart.y + chart.h + 38, 150, 'center')
  })
}

function drawSummary(ctx: CanvasRenderingContext2D, data: InvestmentConceptData) {
  drawSectionTitle(ctx, '3', 'Ergebnis', 70, 1478, palette.green)

  const gap = 18
  const w = (1100 - gap * 2) / 3
  drawSummaryBox(ctx, { x: 70, y: 1510, w, h: 120 }, 'Depot', formatInvestmentCurrency(data.depotFuture), palette.navy)
  drawSummaryBox(
    ctx,
    { x: 70 + w + gap, y: 1510, w, h: 120 },
    'Altersvorsorge',
    formatInvestmentCurrency(data.retirementFuture),
    palette.green,
  )
  drawSummaryBox(
    ctx,
    { x: 70 + (w + gap) * 2, y: 1510, w, h: 120 },
    'Gesamt',
    formatInvestmentCurrency(data.totalFuture),
    palette.gold,
  )

  if (data.documentSummaries.length > 0) {
    setFont(ctx, 12, 800)
    ctx.fillStyle = palette.ink
    drawWrappedText(ctx, data.documentSummaries.slice(0, 2).join(' | '), 70, 1654, 1100, 17, 'center')
  }

  setFont(ctx, 13, 800)
  ctx.fillStyle = palette.muted
  drawSingleLine(
    ctx,
    `Depot ${formatInvestmentPercent(data.depotRate)} p.a. | Altersvorsorge ${formatInvestmentPercent(
      data.retirementRate,
    )} p.a. | monatlich vorschuessig, Zinsperiode jaehrlich`,
    70,
    data.documentSummaries.length > 0 ? 1692 : 1666,
    1100,
    'center',
  )
}

function drawSummaryBox(ctx: CanvasRenderingContext2D, rect: Rect, label: string, value: string, color: string) {
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 16, palette.paperSoft, palette.line)
  setFont(ctx, 14, 900)
  ctx.fillStyle = palette.muted
  drawSingleLine(ctx, label.toUpperCase(), rect.x + 22, rect.y + 36, rect.w - 44)
  setFont(ctx, 25, 900)
  ctx.fillStyle = color
  drawSingleLine(ctx, value, rect.x + 22, rect.y + 78, rect.w - 44)
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(70, 1708)
  ctx.lineTo(1170, 1708)
  ctx.stroke()

  setFont(ctx, 16, 900)
  ctx.fillStyle = palette.navy
  drawSingleLine(ctx, 'PraeLux Investmentkonzept', INVESTMENT_CANVAS_WIDTH / 2, 1734, 320, 'center')
}

function drawCallout(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, label: string) {
  ctx.strokeStyle = palette.muted
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()

  setFont(ctx, 18, 900)
  ctx.fillStyle = palette.ink
  drawWrappedText(ctx, label, toX + (toX < fromX ? -12 : 12), toY - 10, 220, 22, toX < fromX ? 'right' : 'left')
}

function drawSectionTitle(ctx: CanvasRenderingContext2D, number: string, title: string, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x + 15, y - 7, 15, 0, Math.PI * 2)
  ctx.fill()
  setFont(ctx, 15, 900)
  ctx.fillStyle = palette.paper
  drawSingleLine(ctx, number, x + 15, y - 1, 24, 'center')

  setFont(ctx, 24, 900)
  ctx.fillStyle = palette.ink
  drawSingleLine(ctx, title, x + 42, y, 760)
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  align: CanvasTextAlign = 'left',
) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > width && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  })
  if (current) lines.push(current)

  ctx.textAlign = align
  lines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
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
  let output = text
  while (output.length > 3 && ctx.measureText(output).width > maxWidth) {
    output = output.slice(0, -2).trim()
  }
  if (output !== text) output = `${output}...`
  ctx.textAlign = align
  ctx.fillText(output, x, y)
  ctx.textAlign = 'left'
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight: number) {
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`
}

function compactMoney(value: number) {
  if (value >= 1000000) return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value / 1000000)} Mio.`
  if (value >= 1000) return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value / 1000)} Tsd.`
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value)
}

function dataSafeMoney(value: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function niceMax(value: number) {
  if (value <= 0) return 50000
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}
