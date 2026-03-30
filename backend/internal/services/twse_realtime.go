package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"stocktrace/backend/internal/models"
)

// twseExchange maps stock code (no .TW suffix) → exchange prefix (tse / otc).
// TSE = 台灣證券交易所 (上市)
// OTC = 櫃買中心 (上櫃)
var twseExchange = map[string]string{
	// ── TSE 上市 ──────────────────────────────────────────────────────────────
	"2330": "tse", // 台積電
	"2303": "tse", // 聯電
	"2317": "tse", // 鴻海
	"2356": "tse", // 英業達
	"2382": "tse", // 廣達
	"2324": "tse", // 仁寶
	"2454": "tse", // 聯發科
	"4938": "tse", // 和碩
	"2308": "tse", // 台達電
	"2301": "tse", // 光寶科
	"2395": "tse", // 研華
	"2357": "tse", // 華碩
	"2376": "tse", // 技嘉
	"2353": "tse", // 宏碁
	"2396": "tse", // 精英
	"2312": "tse", // 金寶
	"2379": "tse", // 瑞昱
	"2388": "tse", // 威盛
	"2345": "tse", // 智邦
	"2449": "tse", // 京元電子
	"2383": "tse", // 台光電
	"2368": "tse", // 金像電
	"3711": "tse", // 日月光投控
	"3231": "tse", // 緯創
	"3037": "tse", // 欣興
	"3034": "tse", // 聯詠
	// ── OTC 上櫃 ──────────────────────────────────────────────────────────────
	"5347": "otc", // 世界先進
	"6770": "otc", // 力積電
	"3105": "otc", // 穩懋
	"4966": "otc", // 譜瑞-KY
	"5274": "otc", // 信驊
	"3443": "otc", // 創意
	"4919": "otc", // 新唐
	"3529": "otc", // 力旺
	"6643": "otc", // M31
	"6669": "otc", // 緯穎
	"3706": "otc", // 神達
	"3017": "otc", // 奇鋐
	"3324": "otc", // 雙鴻
	"6415": "otc", // 矽力-KY
	"3535": "otc", // 曜越
	"6230": "otc", // 超眾
	"3023": "otc", // 信邦
	"6278": "otc", // 台表科
	"8150": "otc", // 南茂
	"6271": "otc", // 同欣電
	"3162": "otc", // 精材
	"8046": "otc", // 南電
	"3044": "otc", // 健鼎
	"4426": "otc", // 台燿
	"6269": "otc", // 台郡
	"3596": "otc", // 智易
	"4906": "otc", // 正文
}

const (
	twseAPIURL   = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=%s"
	cacheTTLTWSE = 10 * time.Second
)

// IsTrading returns true during TWSE trading hours: weekdays 09:00-13:30 Taipei time.
func IsTrading() bool {
	now := time.Now().In(taipeiTZ)
	wd := now.Weekday()
	if wd == time.Saturday || wd == time.Sunday {
		return false
	}
	total := now.Hour()*60 + now.Minute()
	return total >= 9*60 && total < 13*60+30
}

// ── TWSE JSON structures ─────────────────────────────────────────────────────

type twseResponse struct {
	MsgArray []twseStock `json:"msgArray"`
}

type twseStock struct {
	Code      string `json:"c"` // stock code
	Name      string `json:"n"` // company name
	Price     string `json:"z"` // latest transaction price ("-" if no trade yet)
	Open      string `json:"o"` // open price
	High      string `json:"h"` // day high
	Low       string `json:"l"` // day low
	PrevClose string `json:"y"` // previous day close
	Volume    string `json:"v"` // cumulative volume in lots (張, 1 lot = 1000 shares)
}

func parseF64(s string) float64 {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" {
		return 0
	}
	f, _ := strconv.ParseFloat(s, 64)
	return f
}

func parseVolLots(s string) int64 {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" {
		return 0
	}
	// Volume may arrive as "1234.00"; strip decimals
	if i := strings.Index(s, "."); i != -1 {
		s = s[:i]
	}
	n, _ := strconv.ParseInt(s, 10, 64)
	return n * 1000 // convert lots → shares
}

// ── Public API ───────────────────────────────────────────────────────────────

// FetchTWSERealtime calls the TWSE/TPEx official real-time market data API.
// Should only be called during trading hours (use IsTrading() first).
// Results are cached for cacheTTLTWSE (10 s).
func FetchTWSERealtime() ([]models.StockQuote, error) {
	const cacheKey = "twse_realtime"
	if cached, ok := getFromCache(cacheKey); ok {
		return cached.([]models.StockQuote), nil
	}

	// Build ex_ch: "tse_2330.tw|otc_3017.tw|..."
	var parts []string
	for sym := range twStocks {
		code := strings.TrimSuffix(sym, ".TW")
		if ex, ok := twseExchange[code]; ok {
			parts = append(parts, fmt.Sprintf("%s_%s.tw", ex, code))
		}
	}
	if len(parts) == 0 {
		return nil, fmt.Errorf("no TWSE exchange mappings found")
	}

	url := fmt.Sprintf(twseAPIURL, strings.Join(parts, "|"))

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Referer", "https://mis.twse.com.tw/stock/index.jsp")
	req.Header.Set("Accept", "application/json, text/javascript, */*")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("TWSE request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("TWSE returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var twseResp twseResponse
	if err := json.Unmarshal(body, &twseResp); err != nil {
		return nil, fmt.Errorf("TWSE parse error: %w", err)
	}
	if len(twseResp.MsgArray) == 0 {
		return nil, fmt.Errorf("TWSE returned empty msgArray")
	}

	twNames := GetTWStockNames()
	var quotes []models.StockQuote

	for _, s := range twseResp.MsgArray {
		symbol := s.Code + ".TW"
		name := twNames[symbol]
		if name == "" {
			name = s.Name
		}

		price := parseF64(s.Price)
		prevClose := parseF64(s.PrevClose)

		// No transaction yet today — use yesterday's close as display price
		if price == 0 {
			price = prevClose
		}

		change := price - prevClose
		changePct := 0.0
		if prevClose > 0 {
			changePct = change / prevClose * 100
		}

		quotes = append(quotes, models.StockQuote{
			Symbol:        symbol,
			Name:          name,
			Price:         price,
			Change:        change,
			ChangePercent: changePct,
			Volume:        parseVolLots(s.Volume),
			DayHigh:       parseF64(s.High),
			DayLow:        parseF64(s.Low),
			Currency:      "TWD",
			Exchange:      "TPE",
			MarketState:   "REGULAR",
		})
	}

	setCache(cacheKey, quotes, cacheTTLTWSE)
	return quotes, nil
}
