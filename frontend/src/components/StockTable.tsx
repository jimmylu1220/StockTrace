import { useState } from 'react'
import { TrendingUp, TrendingDown, Search, ChevronUp, ChevronDown } from 'lucide-react'
import type { StockQuote } from '../types'
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

export default function StockTable({ stocks, market }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null)

  const filtered = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  )

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
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-blue-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-400" />
    )
  }

  const currency = market === 'tw' ? 'TWD' : 'USD'
  const symbol = market === 'tw' ? 'NT$' : '$'

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="搜尋股票代碼或名稱..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
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
              return (
                <tr
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {isUp ? (
                        <TrendingUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-white">{stock.symbol}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{stock.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono text-white">
                      {symbol}{stock.price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-medium ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                    <p className={`text-xs ${isUp ? 'text-red-400/70' : 'text-green-400/70'}`}>
                      {isUp ? '+' : ''}{stock.change.toFixed(2)}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-400 hidden md:table-cell font-mono text-xs">
                    {formatVolume(stock.volume)}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-400 hidden lg:table-cell font-mono text-xs">
                    {currency === 'TWD' ? 'NT$' : '$'}{formatMarketCap(stock.marketCap)}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-400 hidden lg:table-cell">
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
