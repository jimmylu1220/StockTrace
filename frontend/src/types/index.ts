export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  avgVolume: number
  marketCap: number
  peRatio: number
  high52Week: number
  low52Week: number
  dayHigh: number
  dayLow: number
  fiftyDayAvg: number
  twoHundredDayAvg: number
  dividendYield: number
  currency: string
  exchange: string
  marketState: string
}

export interface StockWithSector extends StockQuote {
  sectorId: string
  sectorName: string
}

export interface Sector {
  id: string
  name: string
  enName: string
  description: string
  icon: string
  symbols: string[]
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
  trendData: number[]
}

export interface MarketOverview {
  tw: MarketIndex[]
  us: MarketIndex[]
}

export interface ChartCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartData {
  symbol: string
  name: string
  candles: ChartCandle[]
}

export interface PotentialStock extends StockWithSector {
  score: number
  reason: string
  tags: string[]
  signalType: 'bullish' | 'oversold' | 'breakout' | 'volume_surge'
}

export interface StatisticalSignal extends StockWithSector {
  zScore: number
  rsi14: number
  bollingerPct: number
  bollingerUpper: number
  bollingerLower: number
  ma20: number
  stdDev20: number
  signalScore: number
  signalType: 'strong_buy' | 'buy' | 'neutral' | 'caution' | 'sell'
  analysis: string
}

export interface NewsItem {
  uuid: string
  title: string
  publisher: string
  link: string
  publishedAt: number
  thumbnail: string
  related: string[]
  category: 'tw' | 'us'
}

export interface EducationContent {
  id: string
  title: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  summary: string
  content: string
  keyPoints: string[]
  tags: string[]
  readTime: number
  emoji: string
}
