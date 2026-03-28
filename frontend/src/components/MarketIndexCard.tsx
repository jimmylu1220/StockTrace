import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { MarketIndex } from '../types'

interface Props {
  index: MarketIndex
}

export default function MarketIndexCard({ index }: Props) {
  const isUp = index.changePercent >= 0
  const trendChartData = index.trendData?.map((v, i) => ({ i, v })) ?? []

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{index.symbol}</p>
          <p className="text-sm font-semibold text-white mt-0.5">{index.name}</p>
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            isUp ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          }`}
        >
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? '+' : ''}{index.changePercent.toFixed(2)}%
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold text-white">
          {index.value.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}
        </p>
        <p className={`text-sm mt-0.5 ${isUp ? 'text-red-400' : 'text-green-400'}`}>
          {isUp ? '+' : ''}{index.change.toFixed(2)}
        </p>
      </div>

      {trendChartData.length > 0 && (
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={isUp ? '#f87171' : '#4ade80'}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
