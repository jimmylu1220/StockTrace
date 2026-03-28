import { useEffect, useState } from 'react'
import { RefreshCw, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { StatisticalSignal } from '../types'
import { getStatisticalSignals } from '../services/api'
import StockDetailModal from '../components/StockDetailModal'

const SIGNAL_CONFIG = {
  strong_buy: { label: '強烈買入', color: 'bg-red-500/15 text-red-400 border border-red-500/30', dot: 'bg-red-400' },
  buy:        { label: '買入',     color: 'bg-orange-500/15 text-orange-400 border border-orange-500/30', dot: 'bg-orange-400' },
  neutral:    { label: '中性',     color: 'bg-gray-500/15 text-gray-400 border border-gray-500/30', dot: 'bg-gray-500' },
  caution:    { label: '注意',     color: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-400' },
  sell:       { label: '偏空',     color: 'bg-green-500/15 text-green-400 border border-green-500/30', dot: 'bg-green-400' },
}

const FILTERS = ['全部', 'strong_buy', 'buy', 'neutral', 'caution', 'sell'] as const

function ZScoreBar({ value }: { value: number }) {
  // Map z-score -3..+3 to 0..100%
  const pct = Math.min(100, Math.max(0, ((value + 3) / 6) * 100))
  const color = value <= -1.5 ? 'bg-red-500' : value >= 1.5 ? 'bg-green-500' : 'bg-gray-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5 relative">
        {/* center line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-gray-600" />
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono w-12 text-right ${value <= -1.5 ? 'text-red-400' : value >= 1.5 ? 'text-green-400' : 'text-gray-400'}`}>
        {value.toFixed(2)}
      </span>
    </div>
  )
}

function RSIBar({ value }: { value: number }) {
  const color = value < 30 ? 'bg-red-500' : value > 70 ? 'bg-green-500' : 'bg-blue-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${value < 30 ? 'text-red-400' : value > 70 ? 'text-green-400' : 'text-gray-400'}`}>
        {value.toFixed(0)}
      </span>
    </div>
  )
}

export default function SignalAnalysis() {
  const [signals, setSignals] = useState<StatisticalSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<typeof FILTERS[number]>('全部')
  const [selected, setSelected] = useState<StatisticalSignal | null>(null)
  const [isWeekend, setIsWeekend] = useState(false)
  const [dataDate, setDataDate] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getStatisticalSignals()
      setSignals(res.signals ?? [])
      setIsWeekend(res.isWeekend ?? false)
      setDataDate(res.dataDate ?? '')
    } catch {
      setError('無法取得分析資料，請稍後重試')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = filter === '全部' ? signals : signals.filter(s => s.signalType === filter)

  const counts = {
    strong_buy: signals.filter(s => s.signalType === 'strong_buy').length,
    buy: signals.filter(s => s.signalType === 'buy').length,
    neutral: signals.filter(s => s.signalType === 'neutral').length,
    caution: signals.filter(s => s.signalType === 'caution').length,
    sell: signals.filter(s => s.signalType === 'sell').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📊 統計買入信號
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            基於常態分佈（Z-score）、RSI 超賣及布林通道分析，篩選均值回歸機會
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新計算
        </button>
      </div>

      {/* Methodology */}
      <div className="card p-4 mb-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex gap-3">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-400">分析方法說明</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              此頁面採用<span className="text-white">均值回歸理論</span>：股價在偏離統計均值後，往往有回歸的傾向。
              評分依據：<span className="text-white">Z-score</span>（偏離均值程度）+
              <span className="text-white"> RSI</span>（超買/超賣）+
              <span className="text-white"> 布林通道</span>（價格在通道中的位置）+
              <span className="text-white"> 200日均線方向</span>。
              Z-score &lt; -1.5 代表價格低於均值1.5個標準差，在常態分佈下出現機率 &lt;7%。
              <span className="text-red-400 ml-2">⚠️ 統計分析不保證未來漲跌，僅供參考</span>
            </p>
          </div>
        </div>
      </div>

      {/* Weekend notice */}
      {!loading && isWeekend && (
        <div className="card p-3 mb-4 bg-yellow-500/5 border-yellow-500/20 flex items-center gap-2">
          <span className="text-yellow-400 text-sm">📅</span>
          <p className="text-xs text-yellow-400">
            今日休市（週末）— 顯示上一交易日（{dataDate}）資料
          </p>
        </div>
      )}

      {/* Summary counts */}
      {!loading && signals.length > 0 && (
        <div className="grid grid-cols-5 gap-2 mb-6">
          {(Object.entries(counts) as [keyof typeof counts, number][]).map(([type, count]) => {
            const cfg = SIGNAL_CONFIG[type]
            return (
              <button key={type} onClick={() => setFilter(type)}
                className={`card p-3 text-center transition-all ${filter === type ? 'border-blue-500' : 'hover:border-gray-600'}`}>
                <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${cfg.dot} bg-opacity-20`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}>
            {f === '全部' ? `全部 (${signals.length})` : `${SIGNAL_CONFIG[f as keyof typeof SIGNAL_CONFIG].label} (${counts[f as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-800" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 font-medium">
            <div className="col-span-3">股票</div>
            <div className="col-span-1 text-right">股價</div>
            <div className="col-span-1 text-right">漲跌</div>
            <div className="col-span-2">Z-score (均值回歸)</div>
            <div className="col-span-2">RSI (超買/賣)</div>
            <div className="col-span-1 text-center">評分</div>
            <div className="col-span-2">信號</div>
          </div>

          {/* Rows */}
          {filtered.map(sig => {
            const cfg = SIGNAL_CONFIG[sig.signalType]
            const isUp = sig.changePercent >= 0
            const isTW = sig.currency === 'TWD'
            const sym = isTW ? 'NT$' : '$'

            return (
              <div key={sig.symbol} onClick={() => setSelected(sig)}
                className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors items-center">
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    {isUp ? <TrendingUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> :
                            <TrendingDown className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold text-white">{sig.symbol}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[100px]">{sig.name}</p>
                      {sig.sectorName && (
                        <p className="text-xs text-blue-400/70 truncate max-w-[100px]">{sig.sectorName}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 text-right">
                  <span className="text-sm text-white font-mono">
                    {sym}{sig.price.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="col-span-1 text-right">
                  <span className={`text-xs font-medium ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                    {isUp ? '+' : ''}{sig.changePercent.toFixed(2)}%
                  </span>
                </div>

                <div className="col-span-2">
                  <ZScoreBar value={sig.zScore} />
                </div>

                <div className="col-span-2">
                  <RSIBar value={sig.rsi14} />
                </div>

                <div className="col-span-1 text-center">
                  <span className={`text-sm font-bold ${sig.signalScore >= 75 ? 'text-red-400' : sig.signalScore >= 60 ? 'text-orange-400' : 'text-gray-400'}`}>
                    {sig.signalScore}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className={`badge text-xs ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {sig.analysis && (
                    <p className="text-xs text-gray-600 mt-1 leading-tight line-clamp-1">{sig.analysis}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-500">
          {filter === '全部' ? '暫無資料' : `目前無「${SIGNAL_CONFIG[filter as keyof typeof SIGNAL_CONFIG]?.label}」信號`}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 card p-4">
        <p className="text-xs text-gray-500 font-medium mb-2">指標說明</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <Minus className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
            <div><span className="text-white">Z-score</span>：偏左(負值)=股價低於均值，越低越「便宜」。-1.5以下有統計顯著性。</div>
          </div>
          <div className="flex items-start gap-2">
            <Minus className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
            <div><span className="text-white">RSI</span>：&lt;30=超賣反彈機率高；&gt;70=超買注意回調。</div>
          </div>
          <div className="flex items-start gap-2">
            <Minus className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
            <div><span className="text-white">評分</span>：綜合以上指標的0-100分，85+為強烈信號。</div>
          </div>
        </div>
      </div>

      {selected && (
        <StockDetailModal stock={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
