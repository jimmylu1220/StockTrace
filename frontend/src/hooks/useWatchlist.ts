import { useState, useCallback } from 'react'

const STORAGE_KEY = 'stocktrace_watchlist'

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function save(symbols: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols))
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(load)

  const toggle = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
      save(next)
      return next
    })
  }, [])

  const isWatched = useCallback(
    (symbol: string) => watchlist.includes(symbol),
    [watchlist]
  )

  const clear = useCallback(() => {
    save([])
    setWatchlist([])
  }, [])

  return { watchlist, toggle, isWatched, clear }
}
