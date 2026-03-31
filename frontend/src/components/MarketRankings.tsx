import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { StockWithSector } from '../types'
import { getTaiwanStocks } from '../services/api'

export default function MarketRankings() {
  const [stocks, setStocks] = useState<StockWithSector[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers')
  const navigate = useNavigate()

  useEffect(() => {
    getTaiwanStocks()
      .then((res) => setStocks(res.stocks ?? []))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...stocks].sort((a, b) =>
    tab === 'gainers'
      ? b.changePercent - a.changePercent
      : a.changePercent - b.changePercent
  )
  const top = sorted.slice(0, 5)

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">📊 當日漲跌排行</h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setTab('gainers')}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1 ${
              tab === 'gainers' ? 'bg-red-600/80 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> 漲幅排行
          </button>
          <button
            onClick={() => setTab('losers')}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1 ${
              tab === 'losers' ? 'bg-green-700/80 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> 跌幅排行
          </button>
        </div>
      </div>

      <div className="p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-6">暫無資料</p>
        ) : (
          <div className="space-y-1">
            {top.map((s, rank) => {
              const isUp = s.changePercent >= 0
              return (
                <button
                  key={s.symbol}
                  onClick={() => navigate(`/stocks/${encodeURIComponent(s.symbol)}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-colors text-left"
                >
                  <span className="text-xs text-gray-600 w-4 text-center font-mono">{rank + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{s.symbol.replace('.TW', '')}</p>
                    <p className="text-xs text-gray-500 truncate">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                      {isUp ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      NT${s.price.toFixed(2)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
