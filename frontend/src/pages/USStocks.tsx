import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { StockQuote } from '../types'
import { getUSStocks } from '../services/api'
import StockTable from '../components/StockTable'

export default function USStocks() {
  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getUSStocks()
      setStocks(res.stocks ?? [])
    } catch {
      setError('無法取得美股資料')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const gainers = stocks.filter((s) => s.changePercent > 0).length
  const losers = stocks.filter((s) => s.changePercent < 0).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🇺🇸 美國股市
          </h1>
          <p className="text-sm text-gray-500 mt-1">S&P 500、那斯達克主要成份股</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      {!loading && stocks.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-white">{stocks.length}</p>
            <p className="text-xs text-gray-500">追蹤股票</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{gainers}</p>
            <p className="text-xs text-gray-500">上漲</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{losers}</p>
            <p className="text-xs text-gray-500">下跌</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Info box */}
      <div className="card p-4 mb-4 bg-blue-500/5 border-blue-500/20">
        <h3 className="text-sm font-semibold text-blue-400 mb-1">美股交易時間（台灣時間）</h3>
        <p className="text-xs text-gray-400">
          夏令時間：22:30 – 05:00（隔日）｜冬令時間：23:30 – 06:00（隔日）
          <span className="ml-2 text-yellow-400">美股無漲跌停板，有熔斷機制</span>
        </p>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <StockTable stocks={stocks} market="us" />
        )}
      </div>
    </div>
  )
}
