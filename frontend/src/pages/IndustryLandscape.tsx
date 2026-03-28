import { useEffect, useState } from 'react'
import { RefreshCw, ChevronRight } from 'lucide-react'
import type { Sector } from '../types'
import { getSectors } from '../services/api'

// Static Chinese name lookup — mirrors backend twStocks map
const TW_NAMES: Record<string, string> = {
  // 晶圓代工
  '2330.TW': '台積電',
  '2303.TW': '聯電',
  '5347.TW': '世界先進',
  '6770.TW': '力積電',
  '3105.TW': '穩懋',
  // IC設計
  '2454.TW': '聯發科',
  '2379.TW': '瑞昱',
  '3034.TW': '聯詠',
  '4966.TW': '譜瑞-KY',
  '5274.TW': '信驊',
  '3443.TW': '創意',
  '4919.TW': '新唐',
  '3529.TW': '力旺',
  '2388.TW': '威盛',
  '6643.TW': 'M31',
  // AI伺服器/雲端
  '2382.TW': '廣達',
  '2317.TW': '鴻海',
  '2356.TW': '英業達',
  '3231.TW': '緯創',
  '2324.TW': '仁寶',
  '4938.TW': '和碩',
  '6669.TW': '緯穎',
  '2301.TW': '光寶科',
  '3706.TW': '神達',
  // 散熱/電源管理
  '2308.TW': '台達電',
  '3017.TW': '奇鋐',
  '3324.TW': '雙鴻',
  '6415.TW': '矽力-KY',
  '3535.TW': '曜越',
  '6230.TW': '超眾',
  '3023.TW': '信邦',
  // 封裝測試
  '3711.TW': '日月光投控',
  '2449.TW': '京元電子',
  '6278.TW': '台表科',
  '8150.TW': '南茂',
  '6271.TW': '同欣電',
  '3162.TW': '精材',
  // PCB/載板
  '3037.TW': '欣興',
  '8046.TW': '南電',
  '3044.TW': '健鼎',
  '2368.TW': '金像電',
  '2383.TW': '台光電',
  '4426.TW': '台燿',
  '6269.TW': '台郡',
  // 網路/通訊設備
  '2345.TW': '智邦',
  '2395.TW': '研華',
  '3596.TW': '智易',
  '4906.TW': '正文',
  // AI PC/消費電子
  '2357.TW': '華碩',
  '2376.TW': '技嘉',
  '2353.TW': '宏碁',
  '2396.TW': '精英',
  '2312.TW': '金寶',
}

// Supply chain position per sector
const CHAIN_ROLE: Record<string, { label: string; tier: 'upstream' | 'midstream' | 'downstream' }> = {
  chip_design:   { label: '上游 — 晶片設計', tier: 'upstream' },
  foundry:       { label: '上游 — 晶圓製造', tier: 'upstream' },
  osat:          { label: '中游 — 封裝測試', tier: 'midstream' },
  pcb_substrate: { label: '中游 — 基板材料', tier: 'midstream' },
  ai_server:     { label: '下游 — 系統整合', tier: 'downstream' },
  thermal_power: { label: '下游 — 配套元件', tier: 'downstream' },
  network:       { label: '下游 — 網路建設', tier: 'downstream' },
  ai_pc:         { label: '下游 — 終端裝置', tier: 'downstream' },
}

const TIER_COLOR: Record<string, string> = {
  upstream:   'text-purple-400 bg-purple-500/10 border-purple-500/30',
  midstream:  'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  downstream: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
}

// Supply chain flow order (sector IDs in physical order)
const FLOW_ORDER = [
  'chip_design', 'foundry', 'osat', 'pcb_substrate',
  'ai_server', 'thermal_power', 'network', 'ai_pc',
]

function SectorCard({ sector }: { sector: Sector }) {
  const role = CHAIN_ROLE[sector.id]
  const tierColor = role ? TIER_COLOR[role.tier] : TIER_COLOR.downstream
  const tickerCode = (sym: string) => sym.replace('.TW', '')

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sector.icon}</span>
          <div>
            <h3 className="text-sm font-bold text-white">{sector.name}</h3>
            <p className="text-xs text-gray-500">{sector.enName}</p>
          </div>
        </div>
        {role && (
          <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${tierColor}`}>
            {role.label}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed">{sector.description}</p>

      {/* Stocks */}
      <div>
        <p className="text-xs text-gray-600 mb-2 font-medium">追蹤標的</p>
        <div className="flex flex-wrap gap-1.5">
          {sector.symbols.map(sym => (
            <div key={sym} className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
              <span className="text-xs font-mono text-blue-400">{tickerCode(sym)}</span>
              <span className="text-xs text-gray-400">{TW_NAMES[sym] ?? sym}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SupplyChainFlow({ sectors }: { sectors: Sector[] }) {
  // Sort sectors by FLOW_ORDER
  const ordered = FLOW_ORDER
    .map(id => sectors.find(s => s.id === id))
    .filter((s): s is Sector => !!s)

  const tierBg: Record<string, string> = {
    upstream:   'bg-purple-500/10 border-purple-500/30 text-purple-300',
    midstream:  'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    downstream: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  }

  return (
    <div className="card p-4 mb-6">
      <p className="text-xs text-gray-500 font-medium mb-3">AI 晶片供應鏈流程</p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {ordered.map((sector, i) => {
          const role = CHAIN_ROLE[sector.id]
          const bg = role ? tierBg[role.tier] : tierBg.downstream
          return (
            <div key={sector.id} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border ${bg}`}>
                <span className="text-base">{sector.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap">{sector.name}</span>
              </div>
              {i < ordered.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span className="text-xs text-gray-500">上游（設計/製造）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-xs text-gray-500">中游（封裝/基板）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span className="text-xs text-gray-500">下游（整合/終端）</span>
        </div>
      </div>
    </div>
  )
}

export default function IndustryLandscape() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSectors()
      setSectors(res.sectors ?? [])
    } catch {
      setError('無法取得產業資料')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Sort by FLOW_ORDER for the grid too
  const ordered = FLOW_ORDER
    .map(id => sectors.find(s => s.id === id))
    .filter((s): s is Sector => !!s)
  // Append any sectors not in FLOW_ORDER (future-proof)
  const rest = sectors.filter(s => !FLOW_ORDER.includes(s.id))
  const sorted = [...ordered, ...rest]

  const totalStocks = sectors.reduce((acc, s) => acc + s.symbols.length, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🗺️ 台灣 AI 科技產業版圖
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            追蹤 {totalStocks} 支台灣 AI 供應鏈個股，橫跨 {sectors.length} 大領域
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="card h-28 animate-pulse bg-gray-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="card h-56 animate-pulse bg-gray-800" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Supply chain flow */}
          <SupplyChainFlow sectors={sectors} />

          {/* Tier summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { tier: 'upstream',   label: '上游',  desc: '晶片設計、晶圓製造', color: 'border-purple-500/30 bg-purple-500/5' },
              { tier: 'midstream',  label: '中游',  desc: '封裝測試、PCB/載板', color: 'border-cyan-500/30 bg-cyan-500/5' },
              { tier: 'downstream', label: '下游',  desc: 'AI伺服器、散熱、網路、終端', color: 'border-orange-500/30 bg-orange-500/5' },
            ].map(({ label, desc, color, tier }) => {
              const count = sectors.filter(s => CHAIN_ROLE[s.id]?.tier === tier).length
              const stocks = sectors
                .filter(s => CHAIN_ROLE[s.id]?.tier === tier)
                .reduce((a, s) => a + s.symbols.length, 0)
              return (
                <div key={tier} className={`card p-4 border ${color}`}>
                  <p className="text-base font-bold text-white">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  <p className="text-xs text-gray-400 mt-2">{count} 領域 · {stocks} 支股票</p>
                </div>
              )
            })}
          </div>

          {/* Sector cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {sorted.map(s => <SectorCard key={s.id} sector={s} />)}
          </div>
        </>
      )}
    </div>
  )
}
