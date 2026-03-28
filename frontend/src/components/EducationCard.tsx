import { Clock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EducationContent } from '../types'

interface Props {
  content: EducationContent
}

const levelConfig = {
  beginner: { label: '入門', color: 'bg-green-500/10 text-green-400' },
  intermediate: { label: '進階', color: 'bg-blue-500/10 text-blue-400' },
  advanced: { label: '高階', color: 'bg-purple-500/10 text-purple-400' },
}

export default function EducationCard({ content }: Props) {
  const level = levelConfig[content.level]

  return (
    <Link to={`/education/${content.id}`} className="card p-4 flex flex-col gap-3 hover:border-gray-600 transition-all group">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{content.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge ${level.color}`}>{level.label}</span>
            <span className="badge bg-gray-800 text-gray-500">{content.category}</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug">
            {content.title}
          </h3>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{content.summary}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{content.readTime} 分鐘閱讀</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
      </div>
    </Link>
  )
}
