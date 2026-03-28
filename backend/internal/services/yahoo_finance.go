package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"strings"
	"sync"
	"time"

	"stocktrace/backend/internal/models"
)

const (
	yahooFinanceQuoteURL = "https://query2.finance.yahoo.com/v7/finance/quote?symbols=%s&crumb=%s"
	yahooFinanceChartURL = "https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=%s&range=%s&crumb=%s"
	yahooNewsSearchURL   = "https://query1.finance.yahoo.com/v1/finance/search?q=%s&newsCount=10&crumb=%s"
	yahooCrumbURL        = "https://query2.finance.yahoo.com/v1/test/getcrumb"
	yahooConsentURL      = "https://finance.yahoo.com/"
	userAgent            = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

type cacheEntry struct {
	data      interface{}
	expiresAt time.Time
}

var (
	cache    sync.Map
	cacheTTL = 5 * time.Minute

	httpClient *http.Client
	crumb      string
	crumbMu    sync.Mutex
	clientOnce sync.Once
)

// ── Taiwan AI/Tech stocks by sector ─────────────────────────────────────────

var twSectors = []models.Sector{
	{
		ID:     "foundry",
		Name:   "晶圓代工",
		EnName: "Wafer Foundry",
		Icon:   "🔬",
		Description: "台灣是全球晶圓代工的心臟地帶，台積電掌握全球超過60%先進製程市占率。" +
			"AI晶片（NVIDIA H100/B200、Apple Silicon）全由台積電代工，需求持續爆發。",
		Symbols: []string{"2330.TW", "2303.TW"},
	},
	{
		ID:     "chip_design",
		Name:   "IC設計",
		EnName: "Chip Design (Fabless)",
		Icon:   "💡",
		Description: "IC設計公司不自建晶圓廠，委由台積電等代工。" +
			"聯發科在手機SoC、WiFi 7晶片、AI邊緣推論晶片等市場持續領先，積極切入車用AI與資料中心市場。",
		Symbols: []string{"2454.TW", "2379.TW", "3034.TW"},
	},
	{
		ID:     "ai_server",
		Name:   "AI伺服器/雲端",
		EnName: "AI Server & Cloud Infrastructure",
		Icon:   "🖥️",
		Description: "ChatGPT等AI服務帶動GPU伺服器需求暴增。廣達、英業達是NVIDIA DGX/HGX伺服器的主要代工廠，" +
			"鴻海則積極切入AI伺服器與電動車市場，為台灣AI供應鏈的核心製造商。",
		Symbols: []string{"2382.TW", "2317.TW", "2356.TW", "3231.TW"},
	},
	{
		ID:     "thermal_power",
		Name:   "散熱/電源管理",
		EnName: "Thermal & Power Management",
		Icon:   "⚡",
		Description: "AI GPU耗電量是一般伺服器的5-10倍，散熱與電源需求急劇提升。" +
			"台達電是全球最大電源供應器廠，奇鋐、雙鴻則是液冷/氣冷散熱模組的重要供應商。",
		Symbols: []string{"2308.TW", "3017.TW", "3324.TW"},
	},
	{
		ID:     "osat",
		Name:   "封裝測試",
		EnName: "OSAT (Semiconductor Packaging & Test)",
		Icon:   "📦",
		Description: "AI時代對先進封裝（CoWoS、SoIC）需求激增，CoWoS用於整合HBM記憶體與GPU。" +
			"日月光投控是全球最大封裝測試廠，直接受益AI晶片封裝需求浪潮。",
		Symbols: []string{"3711.TW", "2449.TW"},
	},
	{
		ID:     "pcb_substrate",
		Name:   "PCB/載板",
		EnName: "PCB & ABF Substrate",
		Icon:   "🔌",
		Description: "ABF載板（Ajinomoto Build-up Film）是高階AI晶片封裝不可或缺的材料，" +
			"AI晶片封裝面積越大、ABF用量越多。欣興電子是全球ABF載板龍頭，供應嚴重短缺。",
		Symbols: []string{"3037.TW", "8046.TW"},
	},
	{
		ID:     "network",
		Name:   "網路/通訊設備",
		EnName: "Network & Telecom Equipment",
		Icon:   "📡",
		Description: "AI資料中心需要高速乙太網路交換器（400G/800G）連接GPU叢集。" +
			"智邦科技是全球前三大企業級交換器廠；研華則是工業電腦/邊緣AI運算的全球領導廠商。",
		Symbols: []string{"2345.TW", "2395.TW"},
	},
	{
		ID:     "ai_pc",
		Name:   "AI PC/消費電子",
		EnName: "AI PC & Consumer Electronics",
		Icon:   "💻",
		Description: "Intel、AMD、高通推出AI PC晶片帶動換機潮，搭載NPU的AI PC能在本地執行生成式AI。" +
			"華碩積極布局AI PC與AI顯卡市場，技嘉則是AI伺服器主機板與高階顯卡的重要製造商。",
		Symbols: []string{"2357.TW", "2376.TW"},
	},
}

// flat map of symbol → Chinese name (all TW AI/tech stocks)
var twStocks = func() map[string]string {
	m := map[string]string{
		"2330.TW": "台積電",
		"2303.TW": "聯電",
		"2454.TW": "聯發科",
		"2379.TW": "瑞昱",
		"3034.TW": "聯詠",
		"2382.TW": "廣達",
		"2317.TW": "鴻海",
		"2356.TW": "英業達",
		"3231.TW": "緯創",
		"2308.TW": "台達電",
		"3017.TW": "奇鋐",
		"3324.TW": "雙鴻",
		"3711.TW": "日月光投控",
		"2449.TW": "京元電子",
		"3037.TW": "欣興",
		"8046.TW": "南電",
		"2345.TW": "智邦",
		"2395.TW": "研華",
		"2357.TW": "華碩",
		"2376.TW": "技嘉",
	}
	return m
}()

// symbol → sectorID lookup
var twSymbolSector = func() map[string]string {
	m := make(map[string]string)
	for _, s := range twSectors {
		for _, sym := range s.Symbols {
			m[sym] = s.ID
		}
	}
	return m
}()

var usStocks = map[string]string{
	"AAPL":  "Apple Inc.",
	"MSFT":  "Microsoft",
	"NVDA":  "NVIDIA",
	"GOOGL": "Alphabet",
	"AMZN":  "Amazon",
	"META":  "Meta",
	"TSLA":  "Tesla",
	"BRK-B": "Berkshire Hathaway",
	"JPM":   "JPMorgan Chase",
	"V":     "Visa",
	"WMT":   "Walmart",
	"JNJ":   "Johnson & Johnson",
	"MA":    "Mastercard",
	"HD":    "Home Depot",
	"AVGO":  "Broadcom",
	"ORCL":  "Oracle",
	"AMD":   "AMD",
	"INTC":  "Intel",
	"NFLX":  "Netflix",
	"DIS":   "Disney",
}

var twIndices = map[string]string{
	"^TWII":  "台灣加權指數",
	"^TWOII": "台灣OTC指數",
}

var usIndices = map[string]string{
	"^GSPC": "S&P 500",
	"^IXIC": "那斯達克",
	"^DJI":  "道瓊工業指數",
}

// ── HTTP client & crumb ──────────────────────────────────────────────────────

func initClient() {
	jar, _ := cookiejar.New(nil)
	httpClient = &http.Client{Timeout: 15 * time.Second, Jar: jar}
}

func getCrumb() (string, error) {
	crumbMu.Lock()
	defer crumbMu.Unlock()
	if crumb != "" {
		return crumb, nil
	}
	clientOnce.Do(initClient)

	req, _ := http.NewRequest("GET", yahooConsentURL, nil)
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to init session: %w", err)
	}
	resp.Body.Close()

	req2, _ := http.NewRequest("GET", yahooCrumbURL, nil)
	req2.Header.Set("User-Agent", userAgent)
	resp2, err := httpClient.Do(req2)
	if err != nil {
		return "", fmt.Errorf("failed to fetch crumb: %w", err)
	}
	defer resp2.Body.Close()
	body, _ := io.ReadAll(resp2.Body)
	c := strings.TrimSpace(string(body))
	if c == "" || resp2.StatusCode != 200 {
		return "", fmt.Errorf("empty crumb (status %d)", resp2.StatusCode)
	}
	crumb = c
	return crumb, nil
}

func resetCrumb() {
	crumbMu.Lock()
	crumb = ""
	crumbMu.Unlock()
}

func doRequest(url string) ([]byte, error) {
	clientOnce.Do(initClient)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yahoo returned status %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

func fetchWithCrumb(buildURL func(c string) string, target interface{}) error {
	c, err := getCrumb()
	if err != nil {
		return err
	}
	body, err := doRequest(buildURL(c))
	if err != nil {
		resetCrumb()
		c2, err2 := getCrumb()
		if err2 != nil {
			return err2
		}
		body, err = doRequest(buildURL(c2))
		if err != nil {
			return err
		}
	}
	return json.Unmarshal(body, target)
}

// ── Cache helpers ────────────────────────────────────────────────────────────

func getFromCache(key string) (interface{}, bool) {
	if val, ok := cache.Load(key); ok {
		entry := val.(cacheEntry)
		if time.Now().Before(entry.expiresAt) {
			return entry.data, true
		}
		cache.Delete(key)
	}
	return nil, false
}

func setCache(key string, data interface{}, ttl ...time.Duration) {
	d := cacheTTL
	if len(ttl) > 0 {
		d = ttl[0]
	}
	cache.Store(key, cacheEntry{data: data, expiresAt: time.Now().Add(d)})
}

// ── Public API ───────────────────────────────────────────────────────────────

func FetchQuotes(symbols []string) ([]models.StockQuote, error) {
	cacheKey := "quotes_" + strings.Join(symbols, ",")
	if cached, ok := getFromCache(cacheKey); ok {
		return cached.([]models.StockQuote), nil
	}
	var yfResp models.YFQuoteResponse
	err := fetchWithCrumb(func(c string) string {
		return fmt.Sprintf(yahooFinanceQuoteURL, strings.Join(symbols, ","), c)
	}, &yfResp)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch quotes: %w", err)
	}
	var quotes []models.StockQuote
	for _, r := range yfResp.QuoteResponse.Result {
		name := r.LongName
		if name == "" {
			name = r.ShortName
		}
		if chName, ok := twStocks[r.Symbol]; ok {
			name = chName
		}
		quotes = append(quotes, models.StockQuote{
			Symbol:           r.Symbol,
			Name:             name,
			Price:            r.RegularMarketPrice,
			Change:           r.RegularMarketChange,
			ChangePercent:    r.RegularMarketChangePercent,
			Volume:           r.RegularMarketVolume,
			AvgVolume:        r.AverageDailyVolume3Month,
			MarketCap:        r.MarketCap,
			PERatio:          r.TrailingPE,
			High52Week:       r.FiftyTwoWeekHigh,
			Low52Week:        r.FiftyTwoWeekLow,
			DayHigh:          r.RegularMarketDayHigh,
			DayLow:           r.RegularMarketDayLow,
			FiftyDayAvg:      r.FiftyDayAverage,
			TwoHundredDayAvg: r.TwoHundredDayAverage,
			DividendYield:    r.TrailingAnnualDividendYield,
			Currency:         r.Currency,
			Exchange:         r.Exchange,
			MarketState:      r.MarketState,
		})
	}
	setCache(cacheKey, quotes)
	return quotes, nil
}

func FetchTWStocks() ([]models.StockQuote, error) {
	syms := make([]string, 0, len(twStocks))
	for s := range twStocks {
		syms = append(syms, s)
	}
	return FetchQuotes(syms)
}

func FetchUSStocks() ([]models.StockQuote, error) {
	syms := make([]string, 0, len(usStocks))
	for s := range usStocks {
		syms = append(syms, s)
	}
	return FetchQuotes(syms)
}

func FetchTWStocksWithSector() ([]models.StockWithSector, error) {
	quotes, err := FetchTWStocks()
	if err != nil {
		return nil, err
	}
	// Build sector name lookup
	sectorNames := make(map[string]string)
	for _, s := range twSectors {
		sectorNames[s.ID] = s.Name
	}
	var result []models.StockWithSector
	for _, q := range quotes {
		sid := twSymbolSector[q.Symbol]
		result = append(result, models.StockWithSector{
			StockQuote: q,
			SectorID:   sid,
			SectorName: sectorNames[sid],
		})
	}
	return result, nil
}

func FetchMarketOverview() (*models.MarketOverview, error) {
	cacheKey := "market_overview"
	if cached, ok := getFromCache(cacheKey); ok {
		return cached.(*models.MarketOverview), nil
	}
	allIdx := make([]string, 0)
	for s := range twIndices {
		allIdx = append(allIdx, s)
	}
	for s := range usIndices {
		allIdx = append(allIdx, s)
	}
	var yfResp models.YFQuoteResponse
	err := fetchWithCrumb(func(c string) string {
		return fmt.Sprintf(yahooFinanceQuoteURL, strings.Join(allIdx, ","), c)
	}, &yfResp)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch market overview: %w", err)
	}
	overview := &models.MarketOverview{}
	for _, r := range yfResp.QuoteResponse.Result {
		idx := models.MarketIndex{
			Symbol:        r.Symbol,
			Value:         r.RegularMarketPrice,
			Change:        r.RegularMarketChange,
			ChangePercent: r.RegularMarketChangePercent,
		}
		if name, ok := twIndices[r.Symbol]; ok {
			idx.Name = name
			overview.TW = append(overview.TW, idx)
		} else if name, ok := usIndices[r.Symbol]; ok {
			idx.Name = name
			overview.US = append(overview.US, idx)
		}
	}
	overview.TW = fetchTrendData(overview.TW)
	overview.US = fetchTrendData(overview.US)
	setCache(cacheKey, overview)
	return overview, nil
}

func fetchTrendData(indices []models.MarketIndex) []models.MarketIndex {
	for i, idx := range indices {
		var chartResp models.YFChartResponse
		err := fetchWithCrumb(func(c string) string {
			return fmt.Sprintf(yahooFinanceChartURL, idx.Symbol, "1d", "1mo", c)
		}, &chartResp)
		if err != nil || len(chartResp.Chart.Result) == 0 {
			continue
		}
		result := chartResp.Chart.Result[0]
		if len(result.Indicators.Quote) == 0 {
			continue
		}
		var trend []float64
		for _, c := range result.Indicators.Quote[0].Close {
			if c != nil {
				trend = append(trend, *c)
			}
		}
		indices[i].TrendData = trend
	}
	return indices
}

func FetchChartData(symbol, interval, rangeParam string) (*models.ChartData, error) {
	cacheKey := fmt.Sprintf("chart_%s_%s_%s", symbol, interval, rangeParam)
	if cached, ok := getFromCache(cacheKey); ok {
		return cached.(*models.ChartData), nil
	}
	var chartResp models.YFChartResponse
	err := fetchWithCrumb(func(c string) string {
		return fmt.Sprintf(yahooFinanceChartURL, symbol, interval, rangeParam, c)
	}, &chartResp)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch chart: %w", err)
	}
	if len(chartResp.Chart.Result) == 0 {
		return nil, fmt.Errorf("no data for %s", symbol)
	}
	result := chartResp.Chart.Result[0]
	if len(result.Indicators.Quote) == 0 || len(result.Timestamp) == 0 {
		return nil, fmt.Errorf("empty chart for %s", symbol)
	}
	quote := result.Indicators.Quote[0]
	var candles []models.ChartCandle
	for idx, ts := range result.Timestamp {
		if idx >= len(quote.Close) || quote.Close[idx] == nil {
			continue
		}
		c := models.ChartCandle{Timestamp: ts, Close: *quote.Close[idx]}
		if idx < len(quote.Open) && quote.Open[idx] != nil {
			c.Open = *quote.Open[idx]
		}
		if idx < len(quote.High) && quote.High[idx] != nil {
			c.High = *quote.High[idx]
		}
		if idx < len(quote.Low) && quote.Low[idx] != nil {
			c.Low = *quote.Low[idx]
		}
		if idx < len(quote.Volume) && quote.Volume[idx] != nil {
			c.Volume = *quote.Volume[idx]
		}
		candles = append(candles, c)
	}
	name := symbol
	if cn, ok := twStocks[symbol]; ok {
		name = cn
	} else if en, ok := usStocks[symbol]; ok {
		name = en
	}
	data := &models.ChartData{Symbol: symbol, Name: name, Candles: candles}
	setCache(cacheKey, data, 2*time.Hour)
	return data, nil
}

// FetchNews fetches financial news for a given query
func FetchNews(query string) ([]models.NewsItem, error) {
	cacheKey := "news_" + query
	if cached, ok := getFromCache(cacheKey); ok {
		return cached.([]models.NewsItem), nil
	}
	var resp models.YFNewsSearchResponse
	err := fetchWithCrumb(func(c string) string {
		return fmt.Sprintf(yahooNewsSearchURL, query, c)
	}, &resp)
	if err != nil {
		return nil, err
	}
	var items []models.NewsItem
	seen := make(map[string]bool)
	for _, n := range resp.News {
		if seen[n.UUID] || n.Type != "STORY" {
			continue
		}
		seen[n.UUID] = true
		thumb := ""
		if n.Thumbnail != nil && len(n.Thumbnail.Resolutions) > 0 {
			thumb = n.Thumbnail.Resolutions[0].URL
		}
		items = append(items, models.NewsItem{
			UUID:        n.UUID,
			Title:       n.Title,
			Publisher:   n.Publisher,
			Link:        n.Link,
			PublishedAt: n.ProviderPublishTime,
			Thumbnail:   thumb,
			Related:     n.RelatedTickers,
		})
	}
	setCache(cacheKey, items, 30*time.Minute)
	return items, nil
}

// GetTWSectors returns all TW sector definitions
func GetTWSectors() []models.Sector { return twSectors }

// GetTWSymbolSector returns the sector ID for a TW symbol
func GetTWSymbolSector(symbol string) string { return twSymbolSector[symbol] }

func GetTWStockNames() map[string]string { return twStocks }
func GetUSStockNames() map[string]string { return usStocks }
