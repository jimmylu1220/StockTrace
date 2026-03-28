import { TrendingUp, TrendingDown, Zap, ArrowUpCircle, Activity } from 'lucide-react'
import type { PotentialStock } from '../types'

interface Props {
  stock: PotentialStock
  onClick?: () => void
}

const signalConfig = {
  bullish: { label: '強勢看漲', color: 'text-red-400 bg-red-500/10', icon: TrendingUp },
  oversold: { label: '超跌反彈', color: 'text-yellow-400 bg-yellow-500/10', icon: ArrowUpCircle },
  breakout: { label: '突破前高', color: 'text-blue-400 bg-blue-500/10', icon: Zap },
  volume_surge: { label: '量能爆發', color: 'text-purple-400 bg-purple-500/10', icon: Activity },
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-red-500' : score >= 70 ? 'bg-orange-500' : 'bg-yellow-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{score}</span>
    </div>
  )
}

export default function PotentialStockCard({ stock, onClick }: Props) {
  const isUp = stock.changePercent >= 0
  const isTW = stock.currency === 'TWD'
  const currencySymbol = isTW ? 'NT$' : '$'
  const signal = signalConfig[stock.signalType] ?? signalConfig.bullish
  const SignalIcon = signal.icon

  return (
    <div
      onClick={onClick}
      className="card p-4 hover:border-gray-600 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">{stock.symbol}</p>
            <span className={`badge ${signal.color}`}>
              <SignalIcon className="w-2.5 h-2.5 mr-1" />
              {signal.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{stock.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-white">
            {currencySymbol}{stock.price.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs font-medium ${isUp ? 'text-red-400' : 'text-green-400'}`}>
            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Score */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>潛力評分</span>
        </div>
        <ScoreBar score={stock.score} />
      </div>

      {/* Reason */}
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{stock.reason}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {stock.tags.map((tag) => (
          <span key={tag} className="badge bg-gray-800 text-gray-400">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800">
        <div>
          <p className="text-xs text-gray-600">本益比</p>
          <p className="text-xs text-white">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">52週範圍</p>
          <p className="text-xs text-white">
            {stock.low52Week > 0
              ? `${((stock.price - stock.low52Week) / (stock.high52Week - stock.low52Week) * 100).toFixed(0)}%`
              : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">殖利率</p>
          <p className="text-xs text-white">
            {stock.dividendYield > 0 ? `${(stock.dividendYield * 100).toFixed(1)}%` : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}
