package services

import (
	"fmt"
	"math"
	"sort"

	"stocktrace/backend/internal/models"
)

// AnalyzePotentialStocks finds stocks with high potential from a combined pool
func AnalyzePotentialStocks() ([]models.PotentialStock, error) {
	// Only fetch TW AI/Tech stocks
	twQuotes, err := FetchTWStocks()
	if err != nil {
		return nil, err
	}

	// Build sector name lookup
	sectorNames := make(map[string]string)
	for _, s := range GetTWSectors() {
		sectorNames[s.ID] = s.Name
	}

	var potentials []models.PotentialStock
	for _, q := range twQuotes {
		if q.Price <= 0 {
			continue
		}
		score, reason, tags, signalType := scoreStock(q)
		if score >= 60 {
			sid := GetTWSymbolSector(q.Symbol)
			potentials = append(potentials, models.PotentialStock{
				StockWithSector: models.StockWithSector{
					StockQuote: q,
					SectorID:   sid,
					SectorName: sectorNames[sid],
				},
				Score:      score,
				Reason:     reason,
				Tags:       tags,
				SignalType:  signalType,
			})
		}
	}

	// Sort by score descending
	sort.Slice(potentials, func(i, j int) bool {
		return potentials[i].Score > potentials[j].Score
	})

	// Return top 10
	if len(potentials) > 10 {
		potentials = potentials[:10]
	}

	return potentials, nil
}

// scoreStock calculates a potential score (0-100) for a stock
func scoreStock(q models.StockQuote) (int, string, []string, string) {
	score := 50
	var reasons []string
	var tags []string
	signalType := "bullish"

	// 1. Volume surge analysis (volume > avg = momentum)
	if q.AvgVolume > 0 {
		volumeRatio := float64(q.Volume) / float64(q.AvgVolume)
		if volumeRatio >= 2.0 {
			score += 20
			reasons = append(reasons, fmt.Sprintf("成交量爆增 %.1fx 均量", volumeRatio))
			tags = append(tags, "量能爆發")
			signalType = "volume_surge"
		} else if volumeRatio >= 1.5 {
			score += 12
			reasons = append(reasons, fmt.Sprintf("成交量高於均量 %.1fx", volumeRatio))
			tags = append(tags, "量能放大")
		} else if volumeRatio < 0.5 {
			score -= 10
		}
	}

	// 2. Price momentum (today's change)
	if q.ChangePercent >= 3.0 {
		score += 15
		reasons = append(reasons, fmt.Sprintf("今日強漲 +%.2f%%", q.ChangePercent))
		tags = append(tags, "強勢上漲")
	} else if q.ChangePercent >= 1.5 {
		score += 8
		reasons = append(reasons, fmt.Sprintf("今日上漲 +%.2f%%", q.ChangePercent))
	} else if q.ChangePercent <= -3.0 {
		score -= 10
	}

	// 3. Oversold opportunity: price near 52-week low but starting to recover
	if q.High52Week > 0 && q.Low52Week > 0 {
		priceRange := q.High52Week - q.Low52Week
		if priceRange > 0 {
			positionInRange := (q.Price - q.Low52Week) / priceRange
			if positionInRange <= 0.2 && q.ChangePercent > 0 {
				score += 15
				reasons = append(reasons, "接近52週低點開始反彈，超跌反彈機會")
				tags = append(tags, "超跌反彈")
				signalType = "oversold"
			} else if positionInRange >= 0.85 {
				score += 10
				reasons = append(reasons, "接近52週高點，突破前高信號")
				tags = append(tags, "突破前高")
				if signalType == "bullish" {
					signalType = "breakout"
				}
			}
		}
	}

	// 4. Moving average analysis
	if q.FiftyDayAvg > 0 && q.TwoHundredDayAvg > 0 {
		// Golden cross region: 50MA > 200MA
		if q.FiftyDayAvg > q.TwoHundredDayAvg {
			score += 8
			reasons = append(reasons, "50日均線在200日均線之上（黃金交叉區域）")
			tags = append(tags, "均線多排")
		}
		// Price bouncing off 50MA
		distFromMA50 := math.Abs(q.Price-q.FiftyDayAvg) / q.FiftyDayAvg
		if distFromMA50 <= 0.02 && q.ChangePercent > 0 {
			score += 10
			reasons = append(reasons, "股價在50日均線附近獲得支撐")
			tags = append(tags, "均線支撐")
		}
	}

	// 5. Valuation (P/E ratio)
	if q.PERatio > 0 {
		if q.PERatio < 15 {
			score += 8
			reasons = append(reasons, fmt.Sprintf("本益比偏低 (P/E: %.1f)，具估值優勢", q.PERatio))
			tags = append(tags, "低估值")
		} else if q.PERatio > 50 {
			score -= 5
		}
	}

	// 6. Dividend yield bonus
	if q.DividendYield >= 0.04 {
		score += 5
		reasons = append(reasons, fmt.Sprintf("高股息殖利率 %.1f%%", q.DividendYield*100))
		tags = append(tags, "高股息")
	}

	// Cap score at 100
	if score > 100 {
		score = 100
	}
	if score < 0 {
		score = 0
	}

	var mainReason string
	if len(reasons) > 0 {
		mainReason = reasons[0]
		if len(reasons) > 1 {
			mainReason += "；" + reasons[1]
		}
	} else {
		mainReason = "綜合技術面與基本面評估具潛力"
	}

	return score, mainReason, tags, signalType
}
