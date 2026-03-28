import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { StockWithSector, Sector } from '../types'
import { getTaiwanStocks } from '../services/api'
import StockTable from '../components/StockTable'

export default function TaiwanStocks() {
  const [stocks, setStocks] = useState<StockWithSector[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [activeSector, setActiveSector] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTaiwanStocks()
      setStocks(res.stocks ?? [])
      setSectors(res.sectors ?? [])
    } catch {
      setError('無法取得台股資料')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = activeSector === 'all'
    ? stocks
    : stocks.filter(s => s.sectorId === activeSector)

  const activeSectorInfo = sectors.find(s => s.id === activeSector)

  const gainers = filtered.filter(s => s.changePercent > 0).length
  const losers = filtered.filter(s => s.changePercent < 0).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🇹🇼 台灣 AI / 科技股
          </h1>
          <p className="text-sm text-gray-500 mt-1">聚焦 AI 供應鏈：晶圓代工、IC設計、AI伺服器、散熱電源等8大領域</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      {/* Sector tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveSector('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeSector === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          全部
        </button>
        {sectors.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSector(s.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeSector === s.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Sector description */}
      {activeSectorInfo && (
        <div className="card p-4 mb-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{activeSectorInfo.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-blue-400">
                {activeSectorInfo.name}
                <span className="ml-2 text-gray-500 font-normal text-xs">{activeSectorInfo.enName}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{activeSectorInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-white">{filtered.length}</p>
            <p className="text-xs text-gray-500">追蹤股票</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{gainers}</p>
            <p className="text-xs text-gray-500">上漲</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{losers}</p>
            <p className="text-xs text-gray-500">下跌</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>
      )}

      <div className="card p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}
          </div>
        ) : (
          <StockTable stocks={filtered} market="tw" />
        )}
      </div>
    </div>
  )
}
