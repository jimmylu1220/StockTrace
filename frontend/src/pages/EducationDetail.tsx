import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle2 } from 'lucide-react'
import type { EducationContent } from '../types'
import { getEducationById } from '../services/api'

const levelConfig = {
  beginner: { label: '入門', color: 'bg-green-500/10 text-green-400' },
  intermediate: { label: '進階', color: 'bg-blue-500/10 text-blue-400' },
  advanced: { label: '高階', color: 'bg-purple-500/10 text-purple-400' },
}

// Simple markdown-like renderer for the content
function renderContent(content: string): JSX.Element[] {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      // Bold heading
      elements.push(
        <h3 key={i} className="text-base font-semibold text-white mt-5 mb-2">
          {line.slice(2, -2)}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      // Bullet list
      const bullets: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        bullets.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 mb-3">
          {bullets.map((b, bi) => (
            <li key={bi} className="flex gap-2 text-sm text-gray-300">
              <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(b) }} />
            </li>
          ))}
        </ul>
      )
      continue
    } else if (line.startsWith('| ')) {
      // Table
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!lines[i].includes('---')) tableLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto mb-4">
          <table className="text-sm w-full border-collapse">
            <tbody>
              {tableLines.map((row, ri) => {
                const cells = row.split('|').filter((c) => c.trim())
                return (
                  <tr key={ri} className={ri === 0 ? 'bg-gray-800' : 'border-t border-gray-800'}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className={`px-3 py-2 ${ri === 0 ? 'font-medium text-white' : 'text-gray-300'}`}>
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
      continue
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="mb-2" />)
    } else {
      elements.push(
        <p key={i} className="text-sm text-gray-300 leading-relaxed mb-2"
           dangerouslySetInnerHTML={{ __html: boldify(line) }} />
      )
    }
    i++
  }

  return elements
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
}

export default function EducationDetail() {
  const { id } = useParams<{ id: string }>()
  const [content, setContent] = useState<EducationContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    getEducationById(id)
      .then(setContent)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/2" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link to="/education" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回投資學堂
        </Link>
        <div className="card p-8 text-center text-gray-500">找不到該文章</div>
      </div>
    )
  }

  const level = levelConfig[content.level]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/education" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回投資學堂
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{content.emoji}</span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`badge ${level.color}`}>{level.label}</span>
              <span className="badge bg-gray-800 text-gray-500">{content.category}</span>
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />{content.readTime} 分鐘
              </span>
            </div>
            <h1 className="text-xl font-bold text-white leading-snug">{content.title}</h1>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">{content.summary}</p>
          </div>
        </div>
      </div>

      {/* Key Points */}
      <div className="card p-5 mb-6 bg-blue-500/5 border-blue-500/20">
        <h2 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> 重點摘要
        </h2>
        <ul className="space-y-2">
          {content.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Content */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">詳細說明</h2>
        <div>{renderContent(content.content)}</div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {content.tags.map((tag) => (
          <span key={tag} className="badge bg-gray-800 text-gray-500">#{tag}</span>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-xl">
        <p className="text-xs text-gray-600 text-center">
          ⚠️ 本文章僅供教育用途，不構成任何投資建議。投資有風險，請根據自身財務狀況謹慎決策。
        </p>
      </div>
    </div>
  )
}
