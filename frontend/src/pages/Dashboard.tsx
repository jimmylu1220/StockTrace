import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ChevronRight } from 'lucide-react'
import type { MarketOverview, PotentialStock, EducationContent, NewsItem } from '../types'
import { getMarketOverview, getPotentialStocks, getAllEducation, getMarketNews } from '../services/api'
import MarketIndexCard from '../components/MarketIndexCard'
import PotentialStockCard from '../components/PotentialStockCard'
import EducationCard from '../components/EducationCard'
import NewsCard from '../components/NewsCard'

export default function Dashboard() {
  const [overview, setOverview] = useState<MarketOverview | null>(null)
  const [potentials, setPotentials] = useState<PotentialStock[]>([])
  const [education, setEducation] = useState<EducationContent[]>([])
  const [news, setNews] = useState<{ tw: NewsItem[]; us: NewsItem[] }>({ tw: [], us: [] })
  const [activeNewsTab, setActiveNewsTab] = useState<'tw' | 'us'>('tw')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ovRes, potRes, eduRes, newsRes] = await Promise.all([
        getMarketOverview(),
        getPotentialStocks(),
        getAllEducation(),
        getMarketNews(),
      ])
      setOverview(ovRes)
      setPotentials(potRes.stocks ?? [])
      setEducation((eduRes.contents ?? []).slice(0, 3))
      setNews({ tw: newsRes.tw ?? [], us: newsRes.us ?? [] })
      setLastUpdated(new Date())
    } catch {
      setError('無法連線到後端服務，請確認後端伺服器是否已啟動（port 8080）')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const currentNews = news[activeNewsTab] ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">市場總覽</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdated ? `最後更新：${lastUpdated.toLocaleTimeString('zh-TW')}` : '載入中...'}
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

      {/* Two-column layout: main content + news sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-8">
          {/* TW Market */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">🇹🇼 台灣市場</h2>
              <Link to="/tw-stocks" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                查看台股 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-800" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(overview?.tw ?? []).map(idx => <MarketIndexCard key={idx.symbol} index={idx} />)}
              </div>
            )}
          </section>

          {/* US Market */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">🇺🇸 美國市場</h2>
              <Link to="/us-stocks" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                查看美股 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-800" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(overview?.us ?? []).map(idx => <MarketIndexCard key={idx.symbol} index={idx} />)}
              </div>
            )}
          </section>

          {/* Potential Stocks */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">⭐ 今日潛力股</h2>
              <Link to="/potential" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                查看更多 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <div key={i} className="card h-48 animate-pulse bg-gray-800" />)}
              </div>
            ) : potentials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {potentials.slice(0, 3).map(s => <PotentialStockCard key={s.symbol} stock={s} />)}
              </div>
            ) : (
              <div className="card p-8 text-center text-gray-500">今日暫無潛力股資料</div>
            )}
          </section>

          {/* Education */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">📚 投資學堂</h2>
              <Link to="/education" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                查看全部 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {education.map(c => <EducationCard key={c.id} content={c} />)}
            </div>
          </section>
        </div>

        {/* News Sidebar */}
        <div className="xl:col-span-1">
          <div className="card sticky top-6">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-base font-semibold text-white mb-3">📰 財經新聞</h2>
              <div className="flex gap-1">
                {(['tw', 'us'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveNewsTab(tab)}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                      activeNewsTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>
                    {tab === 'tw' ? '🇹🇼 台灣科技' : '🇺🇸 美國市場'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />)}
                </div>
              ) : currentNews.length > 0 ? (
                currentNews.map(n => <NewsCard key={n.uuid} news={n} />)
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">暫無新聞資料</div>
              )}
            </div>

            <div className="p-3 border-t border-gray-800">
              <p className="text-xs text-gray-600 text-center">新聞來源：Yahoo Finance · 每30分鐘更新</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
