package services

import "stocktrace/backend/internal/models"

// ── Taiwan AI/Tech stocks by sector ─────────────────────────────────────────

var twSectors = []models.Sector{
	{
		ID:     "foundry",
		Name:   "晶圓代工",
		EnName: "Wafer Foundry",
		Icon:   "🔬",
		Description: "台灣是全球晶圓代工的心臟地帶，台積電掌握全球超過60%先進製程市占率。" +
			"AI晶片（NVIDIA H100/B200、Apple Silicon）全由台積電代工，需求持續爆發。" +
			"聯電、世界先進、力積電則聚焦成熟製程，穩懋專攻化合物半導體（GaAs/GaN）。",
		Symbols: []string{"2330.TW", "2303.TW", "5347.TW", "6770.TW", "3105.TW"},
	},
	{
		ID:     "chip_design",
		Name:   "IC設計",
		EnName: "Chip Design (Fabless)",
		Icon:   "💡",
		Description: "IC設計公司不自建晶圓廠，委由台積電等代工製造。" +
			"聯發科在手機SoC、WiFi 7、AI邊緣推論晶片領先全球；信驊專攻伺服器BMC管理晶片；" +
			"創意為ASIC設計龍頭；力旺提供嵌入式非揮發性記憶體IP；新唐聚焦微控制器與安全晶片。",
		Symbols: []string{"2454.TW", "2379.TW", "3034.TW", "4966.TW", "5274.TW", "3443.TW", "4919.TW", "3529.TW", "2388.TW", "6643.TW"},
	},
	{
		ID:     "ai_server",
		Name:   "AI伺服器/雲端",
		EnName: "AI Server & Cloud Infrastructure",
		Icon:   "🖥️",
		Description: "ChatGPT等AI服務帶動GPU伺服器需求暴增。廣達、英業達是NVIDIA DGX/HGX伺服器的主要代工廠；" +
			"鴻海積極切入AI伺服器與電動車；緯穎專攻超大規模雲端客製伺服器（Meta、Microsoft）；" +
			"仁寶、和碩為全球前三大筆電代工廠，同步切入AI伺服器；光寶科是電源供應器與光通訊模組要角。",
		Symbols: []string{"2382.TW", "2317.TW", "2356.TW", "3231.TW", "2324.TW", "4938.TW", "6669.TW", "2301.TW", "3706.TW"},
	},
	{
		ID:     "thermal_power",
		Name:   "散熱/電源管理",
		EnName: "Thermal & Power Management",
		Icon:   "⚡",
		Description: "AI GPU耗電量是一般伺服器的5-10倍，散熱與電源需求急劇提升。" +
			"台達電是全球最大電源供應器廠商；奇鋐、雙鴻、超眾是液冷/均溫板散熱模組核心供應商；" +
			"矽力專注類比IC與電源管理晶片；曜越（Thermaltake）主攻高效能PC散熱市場。",
		Symbols: []string{"2308.TW", "3017.TW", "3324.TW", "6415.TW", "3535.TW", "6230.TW", "3023.TW"},
	},
	{
		ID:     "osat",
		Name:   "封裝測試",
		EnName: "OSAT (Semiconductor Packaging & Test)",
		Icon:   "📦",
		Description: "AI時代對先進封裝（CoWoS、SoIC）需求激增，CoWoS整合HBM記憶體與GPU。" +
			"日月光投控是全球最大封裝測試廠；京元電子、南茂、台表科提供專業測試服務；" +
			"同欣電聚焦感測器與高頻元件封裝；精材提供晶片薄化與重佈線層（RDL）技術。",
		Symbols: []string{"3711.TW", "2449.TW", "6278.TW", "8150.TW", "6271.TW", "3162.TW"},
	},
	{
		ID:     "pcb_substrate",
		Name:   "PCB/載板",
		EnName: "PCB & ABF Substrate",
		Icon:   "🔌",
		Description: "ABF載板是高階AI晶片封裝不可或缺的基板材料，AI晶片面積越大用量越多。" +
			"欣興電子是全球ABF載板龍頭；南電（南亞電路板）為台塑集團旗下載板廠；" +
			"台光電材專產高頻高速CCL覆銅板；健鼎、金像電為高密度多層PCB大廠；" +
			"台燿提供高頻天線PCB材料；台郡生產軟性電路板（FPC）。",
		Symbols: []string{"3037.TW", "8046.TW", "3044.TW", "2368.TW", "2383.TW", "4426.TW", "6269.TW"},
	},
	{
		ID:     "network",
		Name:   "網路/通訊設備",
		EnName: "Network & Telecom Equipment",
		Icon:   "📡",
		Description: "AI資料中心需要400G/800G高速乙太網路交換器連接GPU叢集。" +
			"智邦科技是全球前三大企業級交換器廠，為AWS、Meta等超大規模雲端客製白牌交換器；" +
			"研華是工業電腦與邊緣AI運算全球領導廠商；智易、正文生產無線路由器與CPE設備。",
		Symbols: []string{"2345.TW", "2395.TW", "3596.TW", "4906.TW"},
	},
	{
		ID:     "ai_pc",
		Name:   "AI PC/消費電子",
		EnName: "AI PC & Consumer Electronics",
		Icon:   "💻",
		Description: "Intel Core Ultra、AMD Ryzen AI系列帶動AI PC換機潮，搭載NPU可在本地執行生成式AI。" +
			"華碩積極布局AI PC、AI ROG顯卡與商用NUC市場；技嘉深耕AI伺服器主機板與高階顯卡；" +
			"宏碁（Acer）為全球第四大PC品牌，積極拓展AI教育與企業市場；" +
			"精英（ECS）與金寶主攻ODM主機板與消費電子代工。",
		Symbols: []string{"2357.TW", "2376.TW", "2353.TW", "2396.TW", "2312.TW"},
	},
}

// twStocks is a flat map of symbol → Chinese name (all TW AI/tech stocks)
var twStocks = func() map[string]string {
	m := map[string]string{
		// 晶圓代工
		"2330.TW": "台積電",
		"2303.TW": "聯電",
		"5347.TW": "世界先進",
		"6770.TW": "力積電",
		"3105.TW": "穩懋",
		// IC設計
		"2454.TW": "聯發科",
		"2379.TW": "瑞昱",
		"3034.TW": "聯詠",
		"4966.TW": "譜瑞-KY",
		"5274.TW": "信驊",
		"3443.TW": "創意",
		"4919.TW": "新唐",
		"3529.TW": "力旺",
		"2388.TW": "威盛",
		"6643.TW": "M31",
		// AI伺服器/雲端
		"2382.TW": "廣達",
		"2317.TW": "鴻海",
		"2356.TW": "英業達",
		"3231.TW": "緯創",
		"2324.TW": "仁寶",
		"4938.TW": "和碩",
		"6669.TW": "緯穎",
		"2301.TW": "光寶科",
		"3706.TW": "神達",
		// 散熱/電源管理
		"2308.TW": "台達電",
		"3017.TW": "奇鋐",
		"3324.TW": "雙鴻",
		"6415.TW": "矽力-KY",
		"3535.TW": "曜越",
		"6230.TW": "超眾",
		"3023.TW": "信邦",
		// 封裝測試
		"3711.TW": "日月光投控",
		"2449.TW": "京元電子",
		"6278.TW": "台表科",
		"8150.TW": "南茂",
		"6271.TW": "同欣電",
		"3162.TW": "精材",
		// PCB/載板
		"3037.TW": "欣興",
		"8046.TW": "南電",
		"3044.TW": "健鼎",
		"2368.TW": "金像電",
		"2383.TW": "台光電",
		"4426.TW": "台燿",
		"6269.TW": "台郡",
		// 網路/通訊設備
		"2345.TW": "智邦",
		"2395.TW": "研華",
		"3596.TW": "智易",
		"4906.TW": "正文",
		// AI PC/消費電子
		"2357.TW": "華碩",
		"2376.TW": "技嘉",
		"2353.TW": "宏碁",
		"2396.TW": "精英",
		"2312.TW": "金寶",
	}
	return m
}()

// twSymbolSector maps symbol → sectorID
var twSymbolSector = func() map[string]string {
	m := make(map[string]string)
	for _, s := range twSectors {
		for _, sym := range s.Symbols {
			m[sym] = s.ID
		}
	}
	return m
}()

// US AI/Tech stocks only — no financials, retail, healthcare, or entertainment
var usStocks = map[string]string{
	"AAPL":  "Apple Inc.",
	"MSFT":  "Microsoft",
	"NVDA":  "NVIDIA",
	"GOOGL": "Alphabet",
	"AMZN":  "Amazon",
	"META":  "Meta",
	"TSLA":  "Tesla",
	"AVGO":  "Broadcom",
	"AMD":   "AMD",
	"INTC":  "Intel",
	"ORCL":  "Oracle",
	"QCOM":  "Qualcomm",
	"MU":    "Micron Technology",
	"AMAT":  "Applied Materials",
	"ASML":  "ASML Holding",
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
