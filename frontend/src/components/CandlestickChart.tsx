import type { ChartCandle } from '../types'

interface Props {
  candles: ChartCandle[]
  height?: number
  currencySymbol?: string
}

const PADDING = { top: 20, right: 10, bottom: 30, left: 60 }

function niceY(min: number, max: number, ticks = 5) {
  const range = max - min
  const step = Math.pow(10, Math.floor(Math.log10(range / ticks)))
  const nicedStep = step * Math.ceil(range / ticks / step)
  const niceMin = Math.floor(min / nicedStep) * nicedStep
  const niceMax = Math.ceil(max / nicedStep) * nicedStep
  const result: number[] = []
  for (let v = niceMin; v <= niceMax + nicedStep * 0.001; v += nicedStep) {
    result.push(parseFloat(v.toFixed(10)))
  }
  return { ticks: result, min: niceMin, max: niceMax }
}

export default function CandlestickChart({ candles, height = 220, currencySymbol = '' }: Props) {
  if (!candles || candles.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        無法載入圖表資料
      </div>
    )
  }

  const w = 600
  const h = height
  const innerW = w - PADDING.left - PADDING.right
  const innerH = h - PADDING.top - PADDING.bottom

  const prices = candles.flatMap((c) => [c.high, c.low])
  const rawMin = Math.min(...prices)
  const rawMax = Math.max(...prices)
  const { ticks: yTicks, min: yMin, max: yMax } = niceY(rawMin, rawMax)

  const xScale = (i: number) => (i / (candles.length - 1 || 1)) * innerW
  const yScale = (v: number) => innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH

  const candleW = Math.max(2, Math.min(12, (innerW / candles.length) * 0.6))

  // X-axis labels: show ~5 labels
  const labelStep = Math.ceil(candles.length / 5)
  const xLabels = candles
    .map((c, i) => ({ i, label: formatDate(c.timestamp) }))
    .filter((_, i) => i % labelStep === 0 || i === candles.length - 1)

  function formatDate(ts: number) {
    const d = new Date(ts * 1000)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ height }}
    >
      <g transform={`translate(${PADDING.left},${PADDING.top})`}>
        {/* Grid + Y axis */}
        {yTicks.map((tick) => {
          const y = yScale(tick)
          if (y < 0 || y > innerH) return null
          return (
            <g key={tick}>
              <line x1={0} x2={innerW} y1={y} y2={y} stroke="#1f2937" strokeWidth={1} />
              <text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fill="#6b7280" fontSize={10}>
                {currencySymbol}{tick.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Candles */}
        {candles.map((c, i) => {
          const x = xScale(i)
          const isUp = c.close >= c.open
          const color = isUp ? '#f87171' : '#4ade80'
          const bodyTop = yScale(Math.max(c.open, c.close))
          const bodyBot = yScale(Math.min(c.open, c.close))
          const bodyH = Math.max(1, bodyBot - bodyTop)
          return (
            <g key={c.timestamp}>
              {/* Wick */}
              <line
                x1={x} x2={x}
                y1={yScale(c.high)} y2={yScale(c.low)}
                stroke={color} strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={x - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={color}
                opacity={0.9}
              />
            </g>
          )
        })}

        {/* X axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xScale(i)}
            y={innerH + 18}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={10}
          >
            {label}
          </text>
        ))}

        {/* Axes */}
        <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="#374151" strokeWidth={1} />
        <line x1={0} x2={0} y1={0} y2={innerH} stroke="#374151" strokeWidth={1} />
      </g>
    </svg>
  )
}
