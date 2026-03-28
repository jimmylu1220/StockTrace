package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"stocktrace/backend/internal/services"
)

// GetStatisticalSignals returns statistical buy/sell signals for all tracked stocks
func GetStatisticalSignals(c *gin.Context) {
	signals, err := services.AnalyzeStatisticalSignals()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"signals": signals, "total": len(signals)})
}

// GetSectors returns Taiwan sector definitions
func GetSectors(c *gin.Context) {
	sectors := services.GetTWSectors()
	c.JSON(http.StatusOK, gin.H{"sectors": sectors})
}
