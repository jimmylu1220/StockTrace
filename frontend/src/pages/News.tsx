import { useEffect, useState } from 'react'
import { RefreshCw, ExternalLink, Clock, Search } from 'lucide-react'
import type { NewsItem } from '../types'
import { getMarketNews } from '../services/api'

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60)    return '剛剛'
  if (diff < 3600)  return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
}

function NewsCard({ news }: { news: NewsItem }) {
  return (
    <a
      href={news.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 p-4 rounded-xl hover:bg-gray-800/60 transition-colors group border border-transparent hover:border-gray-700"
    >
      {news.thumbnail ? (
        <img
          src={news.thumbnail}
          alt=""
          className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-800"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-24 h-16 rounded-lg flex-shrink-0 bg-gray-800 flex items-center justify-center text-2xl">
          {news.category === 'tw' ? '🇹🇼' : '🇺🇸'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 leading-snug group-hover:text-blue-400 transition-colors line-clamp-2 mb-1.5">
          {news.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">{news.publisher}</span>
          <span className="text-gray-700">·</span>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            {timeAgo(news.publishedAt)}
          </span>
          {news.related?.length > 0 && (
            <>
              <span className="text-gray-700">·</span>
              <div className="flex gap-1 flex-wrap">
                {news.related.slice(0, 3).map(ticker => (
                  <span key={ticker} className="text-xs px-1.5 py-0.5 bg-gray-800 text-blue-400 rounded font-mono">{ticker}</span>
                ))}
              </div>
            </>
          )}
          <ExternalLink className="w-3 h-3 text-gray-700 group-hover:text-blue-500 ml-auto flex-shrink-0" />
        </div>
      </div>
    </a>
  )
}

export default function News() {
  const [tw, setTw] = useState<NewsItem[]>([])
  const [us, setUs] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tw' | 'us'>('tw')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMarketNews()
      setTw(res.tw ?? [])
      setUs(res.us ?? [])
      setLastUpdated(new Date())
    } catch {
      setError('無法取得新聞資料，請確認後端服務是否啟動')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const allNews = activeTab === 'tw' ? tw : us
  const filtered = search.trim()
    ? allNews.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.publisher.toLowerCase().includes(search.toLowerCase()) ||
        n.related?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : allNews

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📰 財經新聞
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdated
              ? `最後更新：${lastUpdated.toLocaleTimeString('zh-TW')} · 來源：Yahoo Finance`
              : '載入中...'}
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      {/* Tabs + search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-gray-900 p-1 rounded-lg">
          {(['tw', 'us'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'tw'
                ? `🇹🇼 台灣科技 (${tw.length})`
                : `🇺🇸 美國市場 (${us.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="搜尋標題或股票代碼..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>
      )}

      {/* News list */}
      <div className="card divide-y divide-gray-800/50">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-24 h-16 bg-gray-800 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-2 bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="p-2">
            {filtered.map(n => <NewsCard key={n.uuid} news={n} />)}
          </div>
        ) : (
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg mb-2">
              {search ? '找不到符合的新聞' : '暫無新聞資料'}
            </p>
            {!search && (
              <p className="text-gray-600 text-sm">
                Yahoo Finance 新聞 API 目前無法連線，請稍後重試
              </p>
            )}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-center mt-4">
          顯示 {filtered.length} 則新聞 · 每次整理時自動去除重複
        </p>
      )}
    </div>
  )
}
