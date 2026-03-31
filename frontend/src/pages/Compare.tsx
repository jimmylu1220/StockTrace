import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { X, Plus, Search } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import type { ChartData } from '../types'
import { getStockChart } from '../services/api'
import { ALL_STOCKS } from '../data/stocks'

const COLORS = ['#60a5fa', '#f87171', '#4ade80', '#facc15']
const MAX_STOCKS = 4

const RANGES = [
  { label: '1月', value: '1mo', interval: '1d' },
  { label: '3月', value: '3mo', interval: '1d' },
  { label: '6月', value: '6mo', interval: '1d' },
  { label: '1年', value: '1y', interval: '1wk' },
]

function formatDate(ts: number) {
  const d = new Date(ts * 1000)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function normalizeCandles(candles: ChartData['candles']) {
  if (candles.length === 0) return []
  const base = candles[0].close
  return candles.map((c) => ({
    date: formatDate(c.timestamp),
    pct: base > 0 ? ((c.close - base) / base) * 100 : 0,
    ts: c.timestamp,
  }))
}

export default function Compare() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialSymbols = (searchParams.get('symbols') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_STOCKS)

  const [symbols, setSymbols] = useState<string[]>(initialSymbols)
  const [chartMap, setChartMap] = useState<Record<string, ChartData>>({})
  const [range, setRange] = useState(RANGES[1])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<typeof ALL_STOCKS>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch chart for new symbols
  useEffect(() => {
    symbols.forEach((sym) => {
      if (chartMap[sym + range.value]) return
      setLoading((p) => ({ ...p, [sym]: true }))
      getStockChart(sym, range.interval, range.value)
        .then((data) => setChartMap((p) => ({ ...p, [sym + range.value]: data })))
        .finally(() => setLoading((p) => ({ ...p, [sym]: false })))
    })
  }, [symbols, range])

  const handleInput = (v: string) => {
    setInput(v)
    if (v.length < 1) { setSuggestions([]); return }
    const q = v.toLowerCase()
    setSuggestions(
      ALL_STOCKS.filter(
        (s) =>
          !symbols.includes(s.symbol) &&
          (s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      ).slice(0, 6)
    )
  }

  const addSymbol = (sym: string) => {
    if (symbols.length >= MAX_STOCKS) return
    setSymbols((p) => [...p, sym])
    setInput('')
    setSuggestions([])
    // update URL
    const next = [...symbols, sym]
    navigate(`/compare?symbols=${next.map(encodeURIComponent).join(',')}`, { replace: true })
  }

  const removeSymbol = (sym: string) => {
    const next = symbols.filter((s) => s !== sym)
    setSymbols(next)
    navigate(next.length > 0 ? `/compare?symbols=${next.map(encodeURIComponent).join(',')}` : '/compare', { replace: true })
  }

  // Build merged chart data
  const allNorm: Record<string, { date: string; pct: number; ts: number }[]> = {}
  symbols.forEach((sym) => {
    const d = chartMap[sym + range.value]
    if (d) allNorm[sym] = normalizeCandles(d.candles)
  })

  // Align by index (same number of points across symbols — just zip)
  const maxLen = Math.max(0, ...Object.values(allNorm).map((a) => a.length))
  const chartData = Array.from({ length: maxLen }, (_, i) => {
    const first = Object.values(allNorm)[0]?.[i]
    const point: Record<string, number | string> = { date: first?.date ?? '' }
    symbols.forEach((sym) => {
      const v = allNorm[sym]?.[i]
      if (v !== undefined) point[sym] = parseFloat(v.pct.toFixed(2))
    })
    return point
  })

  const isAnyLoading = Object.values(loading).some(Boolean)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">股票比較</h1>
        <p className="text-sm text-gray-500">最多比較 {MAX_STOCKS} 檔，以百分比漲跌幅對齊</p>
      </div>

      {/* Stock chips + add input */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {symbols.map((sym, idx) => (
            <div
              key={sym}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: COLORS[idx] + '20', color: COLORS[idx], border: `1px solid ${COLORS[idx]}40` }}
            >
              {sym.replace('.TW', '')}
              <button onClick={() => removeSymbol(sym)} className="opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {symbols.length < MAX_STOCKS && (
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5">
                <Plus className="w-3.5 h-3.5 text-gray-500" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => handleInput(e.target.value)}
                  placeholder="輸入股票代碼"
                  className="bg-transparent text-sm text-white placeholder-gray-600 outline-none w-28"
                />
                <Search className="w-3.5 h-3.5 text-gray-500" />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 min-w-[200px]">
                  {suggestions.map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => addSymbol(s.symbol)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 text-sm"
                    >
                      <span className="text-white font-medium">{s.symbol.replace('.TW', '')}</span>
                      <span className="text-gray-500 ml-2 text-xs">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Range selector */}
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                range.value === r.value ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card p-5">
        {symbols.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-gray-500">
            <p>請輸入股票代碼開始比較</p>
            <p className="text-xs mt-1">例如：2330.TW、NVDA</p>
          </div>
        ) : isAnyLoading ? (
          <div className="h-72 flex items-center justify-center text-gray-500">載入中...</div>
        ) : chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number, name: string) => [
                    `${value > 0 ? '+' : ''}${value.toFixed(2)}%`,
                    name.replace('.TW', ''),
                  ]}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>{value.replace('.TW', '')}</span>
                  )}
                />
                {symbols.map((sym, idx) => (
                  <Line
                    key={sym}
                    type="monotone"
                    dataKey={sym}
                    stroke={COLORS[idx]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-500">無法載入圖表</div>
        )}
      </div>
    </div>
  )
}
