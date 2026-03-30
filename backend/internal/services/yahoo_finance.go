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
	yahooNewsSearchURL   = "https://query1.finance.yahoo.com/v1/finance/search?q=%s&newsCount=15&crumb=%s"
	yahooCrumbURL        = "https://query2.finance.yahoo.com/v1/test/getcrumb"
	yahooConsentURL      = "https://finance.yahoo.com/"
	userAgent            = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

// Cache TTL constants — centralised so all services stay consistent.
var (
	cacheTTLDefault = 5 * time.Minute
	cacheTTLQuotes  = 30 * time.Second // stock quotes: short TTL to support frequent polling
	cacheTTLChart   = 2 * time.Hour
	cacheTTLNews    = 30 * time.Minute
	cacheTTLSignals = 30 * time.Minute
)

type cacheEntry struct {
	data      interface{}
	expiresAt time.Time
}

var (
	cache sync.Map

	httpClient *http.Client
	clientMu   sync.Mutex
	crumb      string
	crumbMu    sync.Mutex
)

// ── HTTP client & crumb ──────────────────────────────────────────────────────

func getOrInitClient() *http.Client {
	clientMu.Lock()
	defer clientMu.Unlock()
	if httpClient == nil {
		jar, _ := cookiejar.New(nil)
		httpClient = &http.Client{Timeout: 15 * time.Second, Jar: jar}
	}
	return httpClient
}

func resetClientLocked() {
	clientMu.Lock()
	defer clientMu.Unlock()
	jar, _ := cookiejar.New(nil)
	httpClient = &http.Client{Timeout: 15 * time.Second, Jar: jar}
}

func getCrumb() (string, error) {
	crumbMu.Lock()
	defer crumbMu.Unlock()
	if crumb != "" {
		return crumb, nil
	}
	client := getOrInitClient()

	req, _ := http.NewRequest("GET", yahooConsentURL, nil)
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to init session: %w", err)
	}
	resp.Body.Close()

	req2, _ := http.NewRequest("GET", yahooCrumbURL, nil)
	req2.Header.Set("User-Agent", userAgent)
	resp2, err := client.Do(req2)
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
	resetClientLocked()
	crumbMu.Lock()
	crumb = ""
	crumbMu.Unlock()
}

func doRequest(url string) ([]byte, error) {
	client := getOrInitClient()
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	resp, err := client.Do(req)
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
	d := cacheTTLDefault
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
	setCache(cacheKey, quotes, cacheTTLQuotes)
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
	setCache(cacheKey, data, cacheTTLChart)
	return data, nil
}

// FetchNews fetches financial news for a given query from Yahoo Finance.
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
		if seen[n.UUID] || n.UUID == "" || (n.Type != "STORY" && n.Type != "VIDEO") {
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
	setCache(cacheKey, items, cacheTTLNews)
	return items, nil
}

// GetTWSectors returns all TW sector definitions
func GetTWSectors() []models.Sector { return twSectors }

var taipeiTZ = time.FixedZone("Asia/Taipei", 8*60*60)

// IsWeekend returns true if today is Saturday or Sunday in Taipei timezone.
func IsWeekend() bool {
	wd := time.Now().In(taipeiTZ).Weekday()
	return wd == time.Saturday || wd == time.Sunday
}

// LastTradingDate returns the most recent weekday date in Taipei timezone (YYYY-MM-DD).
func LastTradingDate() string {
	now := time.Now().In(taipeiTZ)
	for {
		wd := now.Weekday()
		if wd != time.Saturday && wd != time.Sunday {
			return now.Format("2006-01-02")
		}
		now = now.AddDate(0, 0, -1)
	}
}

// GetTWSymbolSector returns the sector ID for a TW symbol
func GetTWSymbolSector(symbol string) string { return twSymbolSector[symbol] }

func GetTWStockNames() map[string]string { return twStocks }
func GetUSStockNames() map[string]string { return usStocks }
