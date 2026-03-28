import { useEffect, useState } from 'react'
import type { EducationContent } from '../types'
import { getAllEducation } from '../services/api'
import EducationCard from '../components/EducationCard'

const CATEGORIES = ['全部', '股票基礎', '財務指標', '技術分析', '基本面分析', '台股特色', '美股特色', '投資工具', '投資策略']
const LEVELS = ['全部', 'beginner', 'intermediate', 'advanced']
const LEVEL_LABELS: Record<string, string> = {
  全部: '全部',
  beginner: '入門',
  intermediate: '進階',
  advanced: '高階',
}

export default function Education() {
  const [contents, setContents] = useState<EducationContent[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('全部')
  const [level, setLevel] = useState('全部')

  useEffect(() => {
    getAllEducation()
      .then((res) => setContents(res.contents ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = contents.filter((c) => {
    const catMatch = category === '全部' || c.category === category
    const lvlMatch = level === '全部' || c.level === level
    return catMatch && lvlMatch
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          📚 投資學堂
        </h1>
        <p className="text-sm text-gray-500 mt-1">股票投資新手必知的核心概念，從零開始學投資</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center mr-1">分類：</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center mr-1">程度：</span>
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                level === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {LEVEL_LABELS[lvl]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 h-36 animate-pulse bg-gray-800" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((content) => (
            <EducationCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-500">
          沒有符合篩選條件的文章
        </div>
      )}
    </div>
  )
}
