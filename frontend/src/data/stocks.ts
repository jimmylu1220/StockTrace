export interface StockInfo {
  symbol: string
  name: string
  market: 'tw' | 'us'
  sector?: string
}

export const TW_STOCKS: StockInfo[] = [
  // 晶圓代工
  { symbol: '2330.TW', name: '台積電', market: 'tw', sector: '晶圓代工' },
  { symbol: '2303.TW', name: '聯電', market: 'tw', sector: '晶圓代工' },
  { symbol: '5347.TW', name: '世界先進', market: 'tw', sector: '晶圓代工' },
  { symbol: '6770.TW', name: '力積電', market: 'tw', sector: '晶圓代工' },
  { symbol: '3105.TW', name: '穩懋', market: 'tw', sector: '晶圓代工' },
  // IC設計
  { symbol: '2454.TW', name: '聯發科', market: 'tw', sector: 'IC設計' },
  { symbol: '2379.TW', name: '瑞昱', market: 'tw', sector: 'IC設計' },
  { symbol: '3034.TW', name: '聯詠', market: 'tw', sector: 'IC設計' },
  { symbol: '4966.TW', name: '譜瑞-KY', market: 'tw', sector: 'IC設計' },
  { symbol: '5274.TW', name: '信驊', market: 'tw', sector: 'IC設計' },
  { symbol: '3443.TW', name: '創意', market: 'tw', sector: 'IC設計' },
  { symbol: '4919.TW', name: '新唐', market: 'tw', sector: 'IC設計' },
  { symbol: '3529.TW', name: '力旺', market: 'tw', sector: 'IC設計' },
  { symbol: '2388.TW', name: '威盛', market: 'tw', sector: 'IC設計' },
  { symbol: '6643.TW', name: 'M31', market: 'tw', sector: 'IC設計' },
  // AI伺服器/雲端
  { symbol: '2382.TW', name: '廣達', market: 'tw', sector: 'AI伺服器' },
  { symbol: '2317.TW', name: '鴻海', market: 'tw', sector: 'AI伺服器' },
  { symbol: '2356.TW', name: '英業達', market: 'tw', sector: 'AI伺服器' },
  { symbol: '3231.TW', name: '緯創', market: 'tw', sector: 'AI伺服器' },
  { symbol: '2324.TW', name: '仁寶', market: 'tw', sector: 'AI伺服器' },
  { symbol: '4938.TW', name: '和碩', market: 'tw', sector: 'AI伺服器' },
  { symbol: '6669.TW', name: '緯穎', market: 'tw', sector: 'AI伺服器' },
  { symbol: '2301.TW', name: '光寶科', market: 'tw', sector: 'AI伺服器' },
  { symbol: '3706.TW', name: '神達', market: 'tw', sector: 'AI伺服器' },
  // 散熱/電源管理
  { symbol: '2308.TW', name: '台達電', market: 'tw', sector: '散熱電源' },
  { symbol: '3017.TW', name: '奇鋐', market: 'tw', sector: '散熱電源' },
  { symbol: '3324.TW', name: '雙鴻', market: 'tw', sector: '散熱電源' },
  { symbol: '6415.TW', name: '矽力-KY', market: 'tw', sector: '散熱電源' },
  { symbol: '3535.TW', name: '曜越', market: 'tw', sector: '散熱電源' },
  { symbol: '6230.TW', name: '超眾', market: 'tw', sector: '散熱電源' },
  { symbol: '3023.TW', name: '信邦', market: 'tw', sector: '散熱電源' },
  // 封裝測試
  { symbol: '3711.TW', name: '日月光投控', market: 'tw', sector: '封裝測試' },
  { symbol: '2449.TW', name: '京元電子', market: 'tw', sector: '封裝測試' },
  { symbol: '6278.TW', name: '台表科', market: 'tw', sector: '封裝測試' },
  { symbol: '8150.TW', name: '南茂', market: 'tw', sector: '封裝測試' },
  { symbol: '6271.TW', name: '同欣電', market: 'tw', sector: '封裝測試' },
  { symbol: '3162.TW', name: '精材', market: 'tw', sector: '封裝測試' },
  // PCB/載板
  { symbol: '3037.TW', name: '欣興', market: 'tw', sector: 'PCB載板' },
  { symbol: '8046.TW', name: '南電', market: 'tw', sector: 'PCB載板' },
  { symbol: '3044.TW', name: '健鼎', market: 'tw', sector: 'PCB載板' },
  { symbol: '2368.TW', name: '金像電', market: 'tw', sector: 'PCB載板' },
  { symbol: '2383.TW', name: '台光電', market: 'tw', sector: 'PCB載板' },
  { symbol: '4426.TW', name: '台燿', market: 'tw', sector: 'PCB載板' },
  { symbol: '6269.TW', name: '台郡', market: 'tw', sector: 'PCB載板' },
  // 網路/通訊設備
  { symbol: '2345.TW', name: '智邦', market: 'tw', sector: '網路通訊' },
  { symbol: '2395.TW', name: '研華', market: 'tw', sector: '網路通訊' },
  { symbol: '3596.TW', name: '智易', market: 'tw', sector: '網路通訊' },
  { symbol: '4906.TW', name: '正文', market: 'tw', sector: '網路通訊' },
  // AI PC/消費電子
  { symbol: '2357.TW', name: '華碩', market: 'tw', sector: 'AI PC' },
  { symbol: '2376.TW', name: '技嘉', market: 'tw', sector: 'AI PC' },
  { symbol: '2353.TW', name: '宏碁', market: 'tw', sector: 'AI PC' },
  { symbol: '2396.TW', name: '精英', market: 'tw', sector: 'AI PC' },
  { symbol: '2312.TW', name: '金寶', market: 'tw', sector: 'AI PC' },
]

export const US_STOCKS: StockInfo[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'us' },
  { symbol: 'MSFT', name: 'Microsoft', market: 'us' },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'us' },
  { symbol: 'GOOGL', name: 'Alphabet', market: 'us' },
  { symbol: 'AMZN', name: 'Amazon', market: 'us' },
  { symbol: 'META', name: 'Meta', market: 'us' },
  { symbol: 'TSLA', name: 'Tesla', market: 'us' },
  { symbol: 'AVGO', name: 'Broadcom', market: 'us' },
  { symbol: 'AMD', name: 'AMD', market: 'us' },
  { symbol: 'INTC', name: 'Intel', market: 'us' },
  { symbol: 'ORCL', name: 'Oracle', market: 'us' },
  { symbol: 'QCOM', name: 'Qualcomm', market: 'us' },
  { symbol: 'MU', name: 'Micron Technology', market: 'us' },
  { symbol: 'AMAT', name: 'Applied Materials', market: 'us' },
  { symbol: 'ASML', name: 'ASML Holding', market: 'us' },
]

export const ALL_STOCKS: StockInfo[] = [...TW_STOCKS, ...US_STOCKS]
