import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Search, ChevronUp, ChevronDown, Star, SlidersHorizontal, X } from 'lucide-react'
import type { StockQuote, StockWithSector } from '../types'
import { useWatchlist } from '../hooks/useWatchlist'
import StockDetailModal from './StockDetailModal'

interface Props {
  stocks: StockQuote[]
  market: 'tw' | 'us'
}

type SortKey = 'name' | 'price' | 'changePercent' | 'volume' | 'marketCap' | 'peRatio'

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toString()
}

function formatMarketCap(v: number): string {
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(2)}T`
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  return v > 0 ? v.toLocaleString() : '-'
}

interface Filters {
  changeMin: string
  changeMax: string
  peMin: string
  peMax: string
  watchlistOnly: boolean
  sector: string
}

const defaultFilters: Filters = { changeMin: '', changeMax: '', peMin: '', peMax: '', watchlistOnly: false, sector: '' }

export default function StockTable({ stocks, market }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const { isWatched, toggle } = useWatchlist()
  const navigate = useNavigate()

  // Collect unique sectors for TW stocks
  const sectors = Array.from(
    new Set(stocks.map((s) => (s as StockWithSector).sectorName).filter(Boolean))
  ) as string[]

  const activeFilterCount = [
    filters.changeMin, filters.changeMax, filters.peMin, filters.peMax,
    filters.watchlistOnly ? '1' : '', filters.sector,
  ].filter(Boolean).length

  const filtered = stocks.filter((s) => {
    const q = search.toLowerCase()
    if (q && !s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false
    if (filters.watchlistOnly && !isWatched(s.symbol)) return false
    if (filters.sector && (s as StockWithSector).sectorName !== filters.sector) return false
    if (filters.changeMin !== '' && s.changePercent < parseFloat(filters.changeMin)) return false
    if (filters.changeMax !== '' && s.changePercent > parseFloat(filters.changeMax)) return false
    if (filters.peMin !== '' && s.peRatio < parseFloat(filters.peMin)) return false
    if (filters.peMax !== '' && (s.peRatio <= 0 || s.peRatio > parseFloat(filters.peMax))) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey] as number
    let vb = b[sortKey] as number
    if (sortKey === 'name') {
      va = a.name.charCodeAt(0)
      vb = b.name.charCodeAt(0)
    }
    return sortDir === 'asc' ? va - vb : vb - va
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
  }

  const currency = market === 'tw' ? 'TWD' : 'USD'
  const sym = market === 'tw' ? 'NT$' : '$'

  return (
    <div>
      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜尋股票代碼或名稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeFilterCount > 0
              ? 'bg-blue-600/30 border border-blue-600/50 text-blue-400'
              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          篩選{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">進階篩選</span>
            <button
              onClick={() => setFilters(defaultFilters)}
              className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
            >
              <X className="w-3 h-3" /> 清除篩選
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">漲跌幅 最小 (%)</label>
              <input
                type="number"
                value={filters.changeMin}
                onChange={(e) => setFilters((f) => ({ ...f, changeMin: e.target.value }))}
                placeholder="-10"
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">漲跌幅 最大 (%)</label>
              <input
                type="number"
                value={filters.changeMax}
                onChange={(e) => setFilters((f) => ({ ...f, changeMax: e.target.value }))}
                placeholder="10"
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">本益比 最小</label>
              <input
                type="number"
                value={filters.peMin}
                onChange={(e) => setFilters((f) => ({ ...f, peMin: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">本益比 最大</label>
              <input
                type="number"
                value={filters.peMax}
                onChange={(e) => setFilters((f) => ({ ...f, peMax: e.target.value }))}
                placeholder="100"
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {sectors.length > 0 && (
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-500 mb-1 block">產業別</label>
                <select
                  value={filters.sector}
                  onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">全部</option>
                  {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer pb-1.5">
                <input
                  type="checkbox"
                  checked={filters.watchlistOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, watchlistOnly: e.target.checked }))}
                  className="accent-yellow-400"
                />
                僅顯示自選
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="w-6 py-3 px-2" />
              <th className="text-left py-3 px-3 text-gray-500 font-medium">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-white">
                  股票 <SortIcon col="name" />
                </button>
              </th>
              <th className="text-right py-3 px-3 text-gray-500 font-medium">
                <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-white ml-auto">
                  股價 <SortIcon col="price" />
                </button>
              </th>
              <th className="text-right py-3 px-3 text-gray-500 font-medium">
                <button onClick={() => handleSort('changePercent')} className="flex items-center gap-1 hover:text-white ml-auto">
                  漲跌幅 <SortIcon col="changePercent" />
                </button>
              </th>
              <th className="text-right py-3 px-3 text-gray-500 font-medium hidden md:table-cell">
                <button onClick={() => handleSort('volume')} className="flex items-center gap-1 hover:text-white ml-auto">
                  成交量 <SortIcon col="volume" />
                </button>
              </th>
              <th className="text-right py-3 px-3 text-gray-500 font-medium hidden lg:table-cell">
                <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 hover:text-white ml-auto">
                  市值 <SortIcon col="marketCap" />
                </button>
              </th>
              <th className="text-right py-3 px-3 text-gray-500 font-medium hidden lg:table-cell">
                <button onClick={() => handleSort('peRatio')} className="flex items-center gap-1 hover:text-white ml-auto">
                  本益比 <SortIcon col="peRatio" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock) => {
              const isUp = stock.changePercent >= 0
              const watched = isWatched(stock.symbol)
              return (
                <tr
                  key={stock.symbol}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  {/* Star button */}
                  <td className="py-3 pl-2 pr-0" onClick={(e) => { e.stopPropagation(); toggle(stock.symbol) }}>
                    <Star
                      className={`w-3.5 h-3.5 transition-colors ${watched ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700 hover:text-yellow-400'}`}
                    />
                  </td>
                  <td className="py-3 px-3" onClick={() => setSelectedStock(stock)}>
                    <div className="flex items-center gap-2">
                      {isUp ? (
                        <TrendingUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      )}
                      <div>
                        <p
                          className="font-medium text-white hover:text-blue-400 transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/stocks/${encodeURIComponent(stock.symbol)}`) }}
                        >
                          {stock.symbol}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{stock.name}</p>
                        {(stock as StockWithSector).sectorName && (
                          <p className="text-xs text-blue-400/70 truncate max-w-[120px]">{(stock as StockWithSector).sectorName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right" onClick={() => setSelectedStock(stock)}>
                    <span className="font-mono text-white">
                      {sym}{stock.price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right" onClick={() => setSelectedStock(stock)}>
                    <span className={`font-medium ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                    <p className={`text-xs ${isUp ? 'text-red-400/70' : 'text-green-400/70'}`}>
                      {isUp ? '+' : ''}{stock.change.toFixed(2)}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-400 hidden md:table-cell font-mono text-xs" onClick={() => setSelectedStock(stock)}>
                    {formatVolume(stock.volume)}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-400 hidden lg:table-cell font-mono text-xs" onClick={() => setSelectedStock(stock)}>
                    {currency === 'TWD' ? 'NT$' : '$'}{formatMarketCap(stock.marketCap)}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-400 hidden lg:table-cell" onClick={() => setSelectedStock(stock)}>
                    {stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-500">找不到符合的股票</div>
      )}

      {selectedStock && (
        <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
      )}
    </div>
  )
}
