import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { StockWithSector, Sector } from '../types'
import { getTaiwanStocks } from '../services/api'
import StockTable from '../components/StockTable'

// Static fallback — mirrors backend twSectors; tabs always render even if API is slow
const STATIC_SECTORS: Sector[] = [
  { id: 'foundry',       name: '晶圓代工',       enName: 'Wafer Foundry',                    icon: '🔬', description: '', symbols: ['2330.TW','2303.TW','5347.TW','6770.TW','3105.TW'] },
  { id: 'chip_design',   name: 'IC設計',          enName: 'Chip Design (Fabless)',            icon: '💡', description: '', symbols: ['2454.TW','2379.TW','3034.TW','4966.TW','5274.TW','3443.TW','4919.TW','3529.TW','2388.TW','6643.TW'] },
  { id: 'ai_server',     name: 'AI伺服器/雲端',   enName: 'AI Server & Cloud Infrastructure', icon: '🖥️', description: '', symbols: ['2382.TW','2317.TW','2356.TW','3231.TW','2324.TW','4938.TW','6669.TW','2301.TW','3706.TW'] },
  { id: 'thermal_power', name: '散熱/電源管理',   enName: 'Thermal & Power Management',       icon: '⚡', description: '', symbols: ['2308.TW','3017.TW','3324.TW','6415.TW','3535.TW','6230.TW','3023.TW'] },
  { id: 'osat',          name: '封裝測試',         enName: 'OSAT',                             icon: '📦', description: '', symbols: ['3711.TW','2449.TW','6278.TW','8150.TW','6271.TW','3162.TW'] },
  { id: 'pcb_substrate', name: 'PCB/載板',         enName: 'PCB & ABF Substrate',              icon: '🔌', description: '', symbols: ['3037.TW','8046.TW','3044.TW','2368.TW','2383.TW','4426.TW','6269.TW'] },
  { id: 'network',       name: '網路/通訊設備',   enName: 'Network & Telecom Equipment',      icon: '📡', description: '', symbols: ['2345.TW','2395.TW','3596.TW','4906.TW'] },
  { id: 'ai_pc',         name: 'AI PC/消費電子',  enName: 'AI PC & Consumer Electronics',     icon: '💻', description: '', symbols: ['2357.TW','2376.TW','2353.TW','2396.TW','2312.TW'] },
]

export default function TaiwanStocks() {
  const [stocks, setStocks] = useState<StockWithSector[]>([])
  const [sectors, setSectors] = useState<Sector[]>(STATIC_SECTORS)
  const [activeSector, setActiveSector] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTaiwanStocks()
      setStocks(res.stocks ?? [])
      // Merge API descriptions/icons into static structure
      if (res.sectors && res.sectors.length > 0) setSectors(res.sectors)
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
  const losers  = filtered.filter(s => s.changePercent < 0).length

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

      {/* Sector tabs — rendered from static data so always visible */}
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

      {/* Active sector description (from API data) */}
      {activeSectorInfo && activeSectorInfo.description && (
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
