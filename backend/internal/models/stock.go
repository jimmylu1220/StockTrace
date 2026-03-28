package models

// StockQuote represents a stock's current quote data
type StockQuote struct {
	Symbol            string  `json:"symbol"`
	Name              string  `json:"name"`
	Price             float64 `json:"price"`
	Change            float64 `json:"change"`
	ChangePercent     float64 `json:"changePercent"`
	Volume            int64   `json:"volume"`
	AvgVolume         int64   `json:"avgVolume"`
	MarketCap         int64   `json:"marketCap"`
	PERatio           float64 `json:"peRatio"`
	High52Week        float64 `json:"high52Week"`
	Low52Week         float64 `json:"low52Week"`
	DayHigh           float64 `json:"dayHigh"`
	DayLow            float64 `json:"dayLow"`
	FiftyDayAvg       float64 `json:"fiftyDayAvg"`
	TwoHundredDayAvg  float64 `json:"twoHundredDayAvg"`
	DividendYield     float64 `json:"dividendYield"`
	Currency          string  `json:"currency"`
	Exchange          string  `json:"exchange"`
	MarketState       string  `json:"marketState"`
}

// MarketIndex represents a market index (e.g., TAIEX, S&P 500)
type MarketIndex struct {
	Symbol        string    `json:"symbol"`
	Name          string    `json:"name"`
	Value         float64   `json:"value"`
	Change        float64   `json:"change"`
	ChangePercent float64   `json:"changePercent"`
	TrendData     []float64 `json:"trendData"`
}

// MarketOverview contains overview of TW and US markets
type MarketOverview struct {
	TW []MarketIndex `json:"tw"`
	US []MarketIndex `json:"us"`
}

// ChartCandle represents a single candlestick data point
type ChartCandle struct {
	Timestamp int64   `json:"timestamp"`
	Open      float64 `json:"open"`
	High      float64 `json:"high"`
	Low       float64 `json:"low"`
	Close     float64 `json:"close"`
	Volume    int64   `json:"volume"`
}

// ChartData represents historical chart data for a stock
type ChartData struct {
	Symbol  string        `json:"symbol"`
	Name    string        `json:"name"`
	Candles []ChartCandle `json:"candles"`
}

// PotentialStock represents a stock with high potential
type PotentialStock struct {
	StockWithSector
	Score      int      `json:"score"`
	Reason     string   `json:"reason"`
	Tags       []string `json:"tags"`
	SignalType  string   `json:"signalType"` // "bullish", "oversold", "breakout", "volume_surge"
}

// Sector represents a market sector group
type Sector struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	EnName      string   `json:"enName"`
	Description string   `json:"description"`
	Icon        string   `json:"icon"`
	Symbols     []string `json:"symbols"`
}

// StockWithSector extends StockQuote with sector info
type StockWithSector struct {
	StockQuote
	SectorID   string `json:"sectorId"`
	SectorName string `json:"sectorName"`
}

// NewsItem represents a financial news article
type NewsItem struct {
	UUID        string   `json:"uuid"`
	Title       string   `json:"title"`
	Publisher   string   `json:"publisher"`
	Link        string   `json:"link"`
	PublishedAt int64    `json:"publishedAt"`
	Thumbnail   string   `json:"thumbnail"`
	Related     []string `json:"related"`
	Category    string   `json:"category"` // "tw" or "us"
}

// StatisticalSignal holds mean-reversion analysis for a stock
type StatisticalSignal struct {
	StockWithSector
	ZScore         float64 `json:"zScore"`
	RSI14          float64 `json:"rsi14"`
	BollingerPct   float64 `json:"bollingerPct"` // 0-100% position in band
	BollingerUpper float64 `json:"bollingerUpper"`
	BollingerLower float64 `json:"bollingerLower"`
	MA20           float64 `json:"ma20"`
	StdDev20       float64 `json:"stdDev20"`
	SignalScore    int     `json:"signalScore"`
	SignalType     string  `json:"signalType"` // "strong_buy","buy","neutral","caution","sell"
	Analysis       string  `json:"analysis"`
}

// YFNewsSearchResponse is the raw response from Yahoo Finance news search
type YFNewsSearchResponse struct {
	News []struct {
		UUID                string `json:"uuid"`
		Title               string `json:"title"`
		Publisher           string `json:"publisher"`
		Link                string `json:"link"`
		ProviderPublishTime int64  `json:"providerPublishTime"`
		Type                string `json:"type"`
		Thumbnail           *struct {
			Resolutions []struct {
				URL    string `json:"url"`
				Width  int    `json:"width"`
				Height int    `json:"height"`
			} `json:"resolutions"`
		} `json:"thumbnail"`
		RelatedTickers []string `json:"relatedTickers"`
	} `json:"news"`
}

// YFChartResponse is the raw response from Yahoo Finance chart API
type YFChartResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Currency           string  `json:"currency"`
				Symbol             string  `json:"symbol"`
				ExchangeName       string  `json:"exchangeName"`
				RegularMarketPrice float64 `json:"regularMarketPrice"`
				ChartPreviousClose float64 `json:"chartPreviousClose"`
				Timezone           string  `json:"timezone"`
			} `json:"meta"`
			Timestamp  []int64 `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Open   []*float64 `json:"open"`
					High   []*float64 `json:"high"`
					Low    []*float64 `json:"low"`
					Close  []*float64 `json:"close"`
					Volume []*int64   `json:"volume"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"chart"`
}

// YFQuoteResponse is the raw response from Yahoo Finance quote API
type YFQuoteResponse struct {
	QuoteResponse struct {
		Result []struct {
			Symbol                     string  `json:"symbol"`
			ShortName                  string  `json:"shortName"`
			LongName                   string  `json:"longName"`
			Currency                   string  `json:"currency"`
			Exchange                   string  `json:"exchange"`
			RegularMarketPrice         float64 `json:"regularMarketPrice"`
			RegularMarketChange        float64 `json:"regularMarketChange"`
			RegularMarketChangePercent float64 `json:"regularMarketChangePercent"`
			RegularMarketVolume        int64   `json:"regularMarketVolume"`
			RegularMarketDayHigh       float64 `json:"regularMarketDayHigh"`
			RegularMarketDayLow        float64 `json:"regularMarketDayLow"`
			FiftyTwoWeekHigh           float64 `json:"fiftyTwoWeekHigh"`
			FiftyTwoWeekLow            float64 `json:"fiftyTwoWeekLow"`
			MarketCap                  int64   `json:"marketCap"`
			TrailingPE                 float64 `json:"trailingPE"`
			AverageDailyVolume3Month   int64   `json:"averageDailyVolume3Month"`
			AverageDailyVolume10Day    int64   `json:"averageDailyVolume10Day"`
			FiftyDayAverage            float64 `json:"fiftyDayAverage"`
			TwoHundredDayAverage       float64 `json:"twoHundredDayAverage"`
			TrailingAnnualDividendYield float64 `json:"trailingAnnualDividendYield"`
			MarketState                string  `json:"marketState"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"quoteResponse"`
}
