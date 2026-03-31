import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { ALL_STOCKS } from '../data/stocks'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const results = query.length > 0
    ? ALL_STOCKS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go = (symbol: string) => {
    navigate(`/stocks/${encodeURIComponent(symbol)}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative px-3 pb-2">
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors">
        <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="搜尋股票..."
          className="bg-transparent text-xs text-white placeholder-gray-600 outline-none w-full"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map((s) => (
            <button
              key={s.symbol}
              onMouseDown={() => go(s.symbol)}
              className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <div>
                <p className="text-xs font-medium text-white">{s.symbol.replace('.TW', '')}</p>
                <p className="text-xs text-gray-500 truncate">{s.name}</p>
              </div>
              <span className="ml-auto text-xs text-gray-600">{s.market.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
