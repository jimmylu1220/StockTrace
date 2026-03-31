import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, TrendingUp, TrendingDown, BarChart3, Star, ExternalLink } from 'lucide-react'
import type { StockQuote, ChartData } from '../types'
import { getStockChart } from '../services/api'
import { useWatchlist } from '../hooks/useWatchlist'
import CandlestickChart from './CandlestickChart'

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

export default function StockDetailModal({ stock, onClose }: Props) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [range, setRange] = useState(RANGES[1])
  const [loading, setLoading] = useState(false)
  const { isWatched, toggle } = useWatchlist()
  const navigate = useNavigate()
  const isUp = stock.changePercent >= 0
  const isTW = stock.currency === 'TWD'
  const symbol = isTW ? 'NT$' : '$'
  const watched = isWatched(stock.symbol)

  useEffect(() => {
    setLoading(true)
    getStockChart(stock.symbol, range.interval, range.value)
      .then(setChartData)
      .finally(() => setLoading(false))
  }, [stock.symbol, range])

  const goToDetail = () => {
    onClose()
    navigate(`/stocks/${encodeURIComponent(stock.symbol)}`)
  }

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
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggle(stock.symbol)}
              className={`p-1.5 rounded-lg transition-colors ${watched ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
              title={watched ? '移除自選' : '加入自選'}
            >
              <Star className={`w-4 h-4 ${watched ? 'fill-yellow-400' : ''}`} />
            </button>
            <button
              onClick={goToDetail}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="查看個股頁面"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
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
              <span className="text-sm font-medium text-white">K線圖</span>
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
          ) : (
            <CandlestickChart
              candles={chartData?.candles ?? []}
              height={192}
              currencySymbol={symbol}
            />
          )}
        </div>
      </div>
    </div>
  )
}
