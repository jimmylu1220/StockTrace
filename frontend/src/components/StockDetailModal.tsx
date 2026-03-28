import { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { StockQuote, ChartData } from '../types'
import { getStockChart } from '../services/api'

interface Props {
  stock: StockQuote
  onClose: () => void
}

const RANGES = [
  { label: '1週', value: '5d', interval: '1d' },
  { label: '1月', value: '1mo', interval: '1d' },
  { label: '3月', value: '3mo', interval: '1d' },
  { label: '6月', value: '6mo', interval: '1d' },
  { label: '1年', value: '1y', interval: '1wk' },
]

function formatDate(ts: number) {
  const d = new Date(ts * 1000)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function StockDetailModal({ stock, onClose }: Props) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [range, setRange] = useState(RANGES[1])
  const [loading, setLoading] = useState(false)
  const isUp = stock.changePercent >= 0
  const isTW = stock.currency === 'TWD'
  const symbol = isTW ? 'NT$' : '$'

  useEffect(() => {
    setLoading(true)
    getStockChart(stock.symbol, range.interval, range.value)
      .then(setChartData)
      .finally(() => setLoading(false))
  }, [stock.symbol, range])

  const chartPoints = chartData?.candles.map((c) => ({
    date: formatDate(c.timestamp),
    close: c.close,
    volume: c.volume,
    open: c.open,
    high: c.high,
    low: c.low,
  })) ?? []

  const minClose = Math.min(...chartPoints.map((d) => d.close)) * 0.995
  const maxClose = Math.max(...chartPoints.map((d) => d.close)) * 1.005

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{stock.symbol}</h2>
              <span className="text-sm text-gray-400">{stock.exchange}</span>
            </div>
            <p className="text-gray-400 mt-0.5">{stock.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Price */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">
              {symbol}{stock.price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-red-400' : 'text-green-400'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              stock.marketState === 'REGULAR' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {stock.marketState === 'REGULAR' ? '交易中' : '已收盤'}
            </span>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-800 border-b border-gray-800">
          {[
            { label: '今日高', value: `${symbol}${stock.dayHigh.toFixed(2)}` },
            { label: '今日低', value: `${symbol}${stock.dayLow.toFixed(2)}` },
            { label: '52週高', value: `${symbol}${stock.high52Week.toFixed(2)}` },
            { label: '52週低', value: `${symbol}${stock.low52Week.toFixed(2)}` },
            { label: '本益比', value: stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '-' },
            { label: '股息殖利率', value: stock.dividendYield > 0 ? `${(stock.dividendYield * 100).toFixed(2)}%` : '-' },
            { label: '50日均線', value: stock.fiftyDayAvg > 0 ? `${symbol}${stock.fiftyDayAvg.toFixed(2)}` : '-' },
            { label: '200日均線', value: stock.twoHundredDayAvg > 0 ? `${symbol}${stock.twoHundredDayAvg.toFixed(2)}` : '-' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-medium text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-white">股價走勢</span>
            </div>
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    range.value === r.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-500">載入中...</div>
          ) : chartPoints.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[minClose, maxClose]}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${symbol}${v.toFixed(0)}`}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#f9fafb' }}
                    formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, '收盤價']}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={isUp ? '#f87171' : '#4ade80'}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">無法載入圖表資料</div>
          )}
        </div>
      </div>
    </div>
  )
}
