import { useEffect, useState } from 'react'
import { RefreshCw, Info } from 'lucide-react'
import type { PotentialStock } from '../types'
import { getPotentialStocks } from '../services/api'
import PotentialStockCard from '../components/PotentialStockCard'
import StockDetailModal from '../components/StockDetailModal'

export default function PotentialStocks() {
  const [stocks, setStocks] = useState<PotentialStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PotentialStock | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPotentialStocks()
      setStocks(res.stocks ?? [])
    } catch {
      setError('無法取得潛力股資料')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            ⭐ 今日潛力股
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            透過量能、價格動能、均線與估值綜合評分篩選
          </p>
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

      {/* Algorithm explanation */}
      <div className="card p-4 mb-6 bg-yellow-500/5 border-yellow-500/20">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-400 mb-1">評分機制說明</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              潛力股評分綜合以下因素：
              <span className="text-white">量能爆發</span>（成交量 &gt; 均量1.5x）、
              <span className="text-white">價格動能</span>（當日漲幅）、
              <span className="text-white">52週位置</span>（近高點突破或低點反彈）、
              <span className="text-white">均線排列</span>（MA50 &gt; MA200黃金交叉）、
              <span className="text-white">估值</span>（低本益比）。
              評分60分以上入選，最高100分。
              <span className="text-red-400 ml-1">⚠️ 僅供參考，不構成投資建議</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 h-52 animate-pulse bg-gray-800" />
          ))}
        </div>
      ) : stocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock) => (
            <PotentialStockCard
              key={stock.symbol}
              stock={stock}
              onClick={() => setSelected(stock)}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg">今日暫無符合條件的潛力股</p>
          <p className="text-gray-600 text-sm mt-2">市場可能波動較小，明日再試</p>
        </div>
      )}

      {selected && (
        <StockDetailModal stock={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
