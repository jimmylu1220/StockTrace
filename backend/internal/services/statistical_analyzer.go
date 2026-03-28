package services

import (
	"fmt"
	"math"
	"sort"
	"sync"

	"stocktrace/backend/internal/models"
)

// AnalyzeStatisticalSignals fetches historical data for all stocks and
// computes Z-score / RSI / Bollinger Band signals.
func AnalyzeStatisticalSignals() ([]models.StatisticalSignal, error) {
	// Build symbol list: TW + US
	var allSymbols []string
	for s := range GetTWStockNames() {
		allSymbols = append(allSymbols, s)
	}
	for s := range GetUSStockNames() {
		allSymbols = append(allSymbols, s)
	}

	// Fetch quotes for all symbols
	quotes, err := FetchQuotes(allSymbols)
	if err != nil {
		return nil, err
	}
	quoteMap := make(map[string]models.StockQuote, len(quotes))
	for _, q := range quotes {
		quoteMap[q.Symbol] = q
	}

	// Build sector info
	sectorNames := make(map[string]string)
	for _, s := range GetTWSectors() {
		sectorNames[s.ID] = s.Name
	}

	type result struct {
		signal models.StatisticalSignal
		err    error
	}

	resultCh := make(chan result, len(allSymbols))
	sem := make(chan struct{}, 4) // max 4 concurrent chart requests
	var wg sync.WaitGroup

	for _, sym := range allSymbols {
		wg.Add(1)
		go func(s string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			chart, err := FetchChartData(s, "1d", "3mo")
			if err != nil {
				resultCh <- result{err: err}
				return
			}
			q, ok := quoteMap[s]
			if !ok {
				resultCh <- result{err: fmt.Errorf("no quote for %s", s)}
				return
			}
			sig := calcSignal(q, chart, sectorNames)
			resultCh <- result{signal: sig}
		}(sym)
	}

	wg.Wait()
	close(resultCh)

	var signals []models.StatisticalSignal
	for r := range resultCh {
		if r.err == nil {
			signals = append(signals, r.signal)
		}
	}

	sort.Slice(signals, func(i, j int) bool {
		return signals[i].SignalScore > signals[j].SignalScore
	})
	return signals, nil
}

func calcSignal(q models.StockQuote, chart *models.ChartData, sectorNames map[string]string) models.StatisticalSignal {
	sectorID := GetTWSymbolSector(q.Symbol)
	sectorName := sectorNames[sectorID]

	base := models.StockWithSector{StockQuote: q, SectorID: sectorID, SectorName: sectorName}

	if len(chart.Candles) < 5 {
		return models.StatisticalSignal{StockWithSector: base, SignalType: "neutral", SignalScore: 50}
	}

	closes := make([]float64, len(chart.Candles))
	for i, c := range chart.Candles {
		closes[i] = c.Close
	}

	// Use 20-day window for BB / Z-score
	window := 20
	if len(closes) < window {
		window = len(closes)
	}
	recent := closes[len(closes)-window:]

	mean := calcMean(recent)
	stdDev := calcStdDev(recent, mean)

	current := q.Price
	if current == 0 {
		current = closes[len(closes)-1]
	}

	var zScore float64
	if stdDev > 0 {
		zScore = (current - mean) / stdDev
	}

	upper := mean + 2*stdDev
	lower := mean - 2*stdDev
	var bbPct float64
	if upper > lower {
		bbPct = (current - lower) / (upper - lower) * 100
	}

	rsi := calcRSI(closes, 14)

	// ── Scoring ──────────────────────────────────────────────────────────────
	score := 50
	var points []string

	// Z-score (mean reversion)
	switch {
	case zScore <= -2.0:
		score += 30
		points = append(points, fmt.Sprintf("Z-score極低(%.2f)，股價嚴重偏離均值，均值回歸機率高", zScore))
	case zScore <= -1.5:
		score += 20
		points = append(points, fmt.Sprintf("Z-score偏低(%.2f)，低於均值1.5個標準差", zScore))
	case zScore <= -1.0:
		score += 10
		points = append(points, fmt.Sprintf("Z-score略低(%.2f)，低於均值1個標準差", zScore))
	case zScore >= 2.0:
		score -= 20
		points = append(points, fmt.Sprintf("Z-score偏高(%.2f)，股價嚴重超漲，注意風險", zScore))
	case zScore >= 1.5:
		score -= 10
		points = append(points, fmt.Sprintf("Z-score偏高(%.2f)，股價超漲", zScore))
	}

	// RSI
	switch {
	case rsi < 30:
		score += 25
		points = append(points, fmt.Sprintf("RSI超賣(%.1f)，技術面嚴重超賣，反彈機率高", rsi))
	case rsi < 40:
		score += 15
		points = append(points, fmt.Sprintf("RSI偏低(%.1f)，接近超賣區間", rsi))
	case rsi > 70:
		score -= 15
		points = append(points, fmt.Sprintf("RSI超買(%.1f)，注意回調風險", rsi))
	}

	// Bollinger Band position
	switch {
	case bbPct < 10:
		score += 20
		points = append(points, "股價觸及布林通道下軌，歷史支撐區間")
	case bbPct < 25:
		score += 10
		points = append(points, fmt.Sprintf("股價位於布林通道下方區間(%.0f%%)", bbPct))
	case bbPct > 90:
		score -= 15
		points = append(points, "股價觸及布林通道上軌，注意超買回調")
	}

	// 200-day MA filter
	if q.TwoHundredDayAvg > 0 {
		if current > q.TwoHundredDayAvg {
			score += 8
			points = append(points, "股價在200日均線之上，長期趨勢向上")
		} else {
			score -= 5
			points = append(points, "股價跌破200日均線，長期趨勢偏弱")
		}
	}

	if score > 100 {
		score = 100
	}
	if score < 0 {
		score = 0
	}

	var signalType string
	switch {
	case score >= 85:
		signalType = "strong_buy"
	case score >= 65:
		signalType = "buy"
	case score <= 25:
		signalType = "sell"
	case score <= 40:
		signalType = "caution"
	default:
		signalType = "neutral"
	}

	analysis := ""
	if len(points) > 0 {
		analysis = points[0]
		if len(points) > 1 {
			analysis += "；" + points[1]
		}
	}

	return models.StatisticalSignal{
		StockWithSector: base,
		ZScore:          zScore,
		RSI14:           rsi,
		BollingerPct:    bbPct,
		BollingerUpper:  upper,
		BollingerLower:  lower,
		MA20:            mean,
		StdDev20:        stdDev,
		SignalScore:     score,
		SignalType:      signalType,
		Analysis:        analysis,
	}
}

func calcMean(prices []float64) float64 {
	if len(prices) == 0 {
		return 0
	}
	sum := 0.0
	for _, p := range prices {
		sum += p
	}
	return sum / float64(len(prices))
}

func calcStdDev(prices []float64, mean float64) float64 {
	if len(prices) < 2 {
		return 0
	}
	v := 0.0
	for _, p := range prices {
		d := p - mean
		v += d * d
	}
	return math.Sqrt(v / float64(len(prices)))
}

func calcRSI(prices []float64, period int) float64 {
	if len(prices) < period+1 {
		return 50
	}
	gains, losses := 0.0, 0.0
	start := len(prices) - period - 1
	for i := start + 1; i <= start+period; i++ {
		diff := prices[i] - prices[i-1]
		if diff > 0 {
			gains += diff
		} else {
			losses -= diff
		}
	}
	avgGain := gains / float64(period)
	avgLoss := losses / float64(period)
	if avgLoss == 0 {
		return 100
	}
	rs := avgGain / avgLoss
	return 100 - (100 / (1 + rs))
}
