import { ExternalLink, Clock } from 'lucide-react'
import type { NewsItem } from '../types'

interface Props {
  news: NewsItem
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
}

export default function NewsCard({ news }: Props) {
  return (
    <a
      href={news.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-lg hover:bg-gray-800/70 transition-colors group"
    >
      {news.thumbnail && (
        <img
          src={news.thumbnail}
          alt=""
          className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-gray-800"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
          {news.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-gray-500">{news.publisher}</span>
          <span className="text-gray-700">·</span>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            {timeAgo(news.publishedAt)}
          </span>
          <ExternalLink className="w-3 h-3 text-gray-700 group-hover:text-blue-500 ml-auto flex-shrink-0" />
        </div>
      </div>
    </a>
  )
}
