function getTaipeiNow(): { hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hour = parseInt(get('hour'), 10)
  const minute = parseInt(get('minute'), 10)
  const weekdayStr = get('weekday') // Mon, Tue, ...
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const weekday = weekdays[weekdayStr] ?? new Date().getDay()
  return { hour, minute, weekday }
}

export function isTWMarketOpen(): boolean {
  const { hour, minute, weekday } = getTaipeiNow()
  if (weekday === 0 || weekday === 6) return false
  const total = hour * 60 + minute
  return total >= 9 * 60 && total < 13 * 60 + 30
}

// US market is open 09:30–16:00 ET = 21:30–04:00 (summer) or 22:30–05:00 (winter) Taipei time
// We use a simplified window: 21:00 – 05:30 Taipei (Mon–Fri ET perspective)
export function isUSMarketOpen(): boolean {
  const { hour, minute, weekday } = getTaipeiNow()
  if (weekday === 0 || weekday === 6) return false
  const total = hour * 60 + minute
  // 21:00 (1260) to 05:30 (330) spans midnight
  return total >= 21 * 60 || total < 5 * 60 + 30
}

export function formatLastUpdated(d: Date): string {
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
