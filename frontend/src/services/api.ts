import axios from 'axios'
import type {
  MarketOverview, StockQuote, StockWithSector, Sector,
  PotentialStock, ChartData, StatisticalSignal,
  NewsItem, EducationContent,
} from '../types'

const api = axios.create({ baseURL: '/api', timeout: 20000 })

export async function getMarketOverview(): Promise<MarketOverview> {
  const res = await api.get<MarketOverview>('/market/overview')
  return res.data
}

export async function getMarketNews(): Promise<{ tw: NewsItem[]; us: NewsItem[]; total: number }> {
  const res = await api.get<{ tw: NewsItem[]; us: NewsItem[]; total: number }>('/news')
  return res.data
}

export async function getTaiwanStocks(): Promise<{ stocks: StockWithSector[]; sectors: Sector[]; total: number }> {
  const res = await api.get<{ stocks: StockWithSector[]; sectors: Sector[]; total: number }>('/stocks/tw')
  return res.data
}

export async function getUSStocks(): Promise<{ stocks: StockQuote[]; total: number }> {
  const res = await api.get<{ stocks: StockQuote[]; total: number }>('/stocks/us')
  return res.data
}

export async function getPotentialStocks(): Promise<{ stocks: PotentialStock[]; total: number }> {
  const res = await api.get<{ stocks: PotentialStock[]; total: number }>('/stocks/potential')
  return res.data
}

export async function getStockChart(symbol: string, interval = '1d', range = '3mo'): Promise<ChartData> {
  const res = await api.get<ChartData>(`/stocks/${symbol}/chart`, { params: { interval, range } })
  return res.data
}

export async function getStatisticalSignals(): Promise<{ signals: StatisticalSignal[]; total: number }> {
  const res = await api.get<{ signals: StatisticalSignal[]; total: number }>('/analysis/signals')
  return res.data
}

export async function getAllEducation(category?: string): Promise<{ contents: EducationContent[]; total: number }> {
  const res = await api.get<{ contents: EducationContent[]; total: number }>('/education', {
    params: category ? { category } : {},
  })
  return res.data
}

export async function getEducationById(id: string): Promise<EducationContent> {
  const res = await api.get<EducationContent>(`/education/${id}`)
  return res.data
}
