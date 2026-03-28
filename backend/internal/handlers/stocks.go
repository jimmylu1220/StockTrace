package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"stocktrace/backend/internal/services"
)

func GetMarketOverview(c *gin.Context) {
	overview, err := services.FetchMarketOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, overview)
}

func GetTaiwanStocks(c *gin.Context) {
	stocks, err := services.FetchTWStocksWithSector()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	sectors := services.GetTWSectors()
	c.JSON(http.StatusOK, gin.H{"stocks": stocks, "sectors": sectors, "total": len(stocks)})
}

func GetUSStocks(c *gin.Context) {
	quotes, err := services.FetchUSStocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stocks": quotes, "total": len(quotes)})
}

func GetPotentialStocks(c *gin.Context) {
	potentials, err := services.AnalyzePotentialStocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stocks": potentials, "total": len(potentials)})
}

func GetStockChart(c *gin.Context) {
	symbol := c.Param("symbol")
	interval := c.DefaultQuery("interval", "1d")
	rangeParam := c.DefaultQuery("range", "1mo")

	validIntervals := map[string]bool{"1m": true, "5m": true, "15m": true, "1h": true, "1d": true, "1wk": true, "1mo": true}
	if !validIntervals[interval] {
		interval = "1d"
	}
	validRanges := map[string]bool{"1d": true, "5d": true, "1mo": true, "3mo": true, "6mo": true, "1y": true, "2y": true, "5y": true}
	if !validRanges[rangeParam] {
		rangeParam = "1mo"
	}

	chartData, err := services.FetchChartData(symbol, interval, rangeParam)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, chartData)
}
