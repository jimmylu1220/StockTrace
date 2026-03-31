import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, TrendingDown, BarChart3, GitCompare } from 'lucide-react'
import type { StockQuote, ChartData } from '../types'
import { getStockQuote, getStockChart } from '../services/api'
import { useWatchlist } from '../hooks/useWatchlist'
import CandlestickChart from '../components/CandlestickChart'

const RANGES = [
  { label: '1週', value: '5d', interval: '1d' },
  { label: '1月', value: '1mo', interval: '1d' },
  { label: '3月', value: '3mo', interval: '1d' },
  { label: '6月', value: '6mo', interval: '1d' },
  { label: '1年', value: '1y', interval: '1wk' },
]

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const { isWatched, toggle } = useWatchlist()

  const [stock, setStock] = useState<StockQuote | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [range, setRange] = useState(RANGES[2])
  const [loadingQuote, setLoadingQuote] = useState(true)
  const [loadingChart, setLoadingChart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const decoded = symbol ? decodeURIComponent(symbol) : ''

  useEffect(() => {
    if (!decoded) return
    setLoadingQuote(true)
    setError(null)
    getStockQuote(decoded)
      .then(setStock)
      .catch(() => setError('找不到此股票'))
      .finally(() => setLoadingQuote(false))
  }, [decoded])

  useEffect(() => {
    if (!decoded) return
    setLoadingChart(true)
    getStockChart(decoded, range.interval, range.value)
      .then(setChartData)
      .finally(() => setLoadingChart(false))
  }, [decoded, range])

  if (loadingQuote) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="card p-12 text-center">
          <p className="text-gray-400">{error ?? '找不到此股票'}</p>
        </div>
      </div>
    )
  }

  const isUp = stock.changePercent >= 0
  const isTW = stock.currency === 'TWD'
  const currencySymbol = isTW ? 'NT$' : '$'
  const watched = isWatched(stock.symbol)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="flex gap-2">
          <Link
            to={`/compare?symbols=${encodeURIComponent(stock.symbol)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5" /> 加入比較
          </Link>
          <button
            onClick={() => toggle(stock.symbol)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              watched
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${watched ? 'fill-yellow-400' : ''}`} />
            {watched ? '已加入自選' : '加入自選'}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{stock.symbol}</h1>
              <span className="text-sm text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{stock.exchange}</span>
            </div>
            <p className="text-gray-400 mt-1">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              {currencySymbol}{stock.price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${isUp ? 'text-red-400' : 'text-green-400'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              stock.marketState === 'REGULAR' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {stock.marketState === 'REGULAR' ? '交易中' : '已收盤'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: '今日最高', value: `${currencySymbol}${stock.dayHigh.toFixed(2)}` },
          { label: '今日最低', value: `${currencySymbol}${stock.dayLow.toFixed(2)}` },
          { label: '52週最高', value: `${currencySymbol}${stock.high52Week.toFixed(2)}` },
          { label: '52週最低', value: `${currencySymbol}${stock.low52Week.toFixed(2)}` },
          { label: '本益比', value: stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '-' },
          { label: '股息殖利率', value: stock.dividendYield > 0 ? `${(stock.dividendYield * 100).toFixed(2)}%` : '-' },
          { label: '50日均線', value: stock.fiftyDayAvg > 0 ? `${currencySymbol}${stock.fiftyDayAvg.toFixed(2)}` : '-' },
          { label: '200日均線', value: stock.twoHundredDayAvg > 0 ? `${currencySymbol}${stock.twoHundredDayAvg.toFixed(2)}` : '-' },
        ].map(({ label, value }) => (
          <div key={label} className="card p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-white">K線圖</span>
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

        {loadingChart ? (
          <div className="h-56 flex items-center justify-center text-gray-500">載入中...</div>
        ) : (
          <CandlestickChart
            candles={chartData?.candles ?? []}
            height={220}
            currencySymbol={currencySymbol}
          />
        )}
      </div>
    </div>
  )
}
