import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import type { StockQuote } from '../types'
import { getStockQuote } from '../services/api'
import { useWatchlist } from '../hooks/useWatchlist'

export default function Watchlist() {
  const { watchlist, toggle, clear } = useWatchlist()
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchAll = async () => {
    if (watchlist.length === 0) return
    setLoading(true)
    const results = await Promise.allSettled(watchlist.map((sym) => getStockQuote(sym)))
    const map: Record<string, StockQuote> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') map[watchlist[i]] = r.value
    })
    setQuotes(map)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [watchlist.join(',')])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            我的自選清單
          </h1>
          <p className="text-sm text-gray-500 mt-1">共 {watchlist.length} 檔股票</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            disabled={loading || watchlist.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
          {watchlist.length > 0 && (
            <button
              onClick={() => { if (confirm('確定要清空自選清單？')) clear() }}
              className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg text-sm text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          )}
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="card p-16 text-center">
          <Star className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium">自選清單是空的</p>
          <p className="text-gray-600 text-sm mt-2">在股票頁面點擊 ★ 加入自選清單</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-800">
          {watchlist.map((sym) => {
            const q = quotes[sym]
            const isUp = q ? q.changePercent >= 0 : false
            const isTW = q?.currency === 'TWD'
            const curr = isTW ? 'NT$' : '$'
            return (
              <div
                key={sym}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/stocks/${encodeURIComponent(sym)}`)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(sym) }}
                  className="text-yellow-400 hover:text-yellow-300 flex-shrink-0"
                >
                  <Star className="w-4 h-4 fill-yellow-400" />
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{sym.replace('.TW', '')}</p>
                  <p className="text-xs text-gray-500 truncate">{q?.name ?? sym}</p>
                </div>

                {loading && !q ? (
                  <div className="w-24 h-8 bg-gray-800 rounded animate-pulse" />
                ) : q ? (
                  <div className="text-right">
                    <p className="font-mono text-white text-sm">
                      {curr}{q.price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-xs ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? '+' : ''}{q.changePercent.toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">無法取得</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
