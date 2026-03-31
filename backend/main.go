package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"stocktrace/backend/internal/handlers"
)

func main() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "StockTrace API"})
	})

	api := r.Group("/api")
	{
		api.GET("/market/overview", handlers.GetMarketOverview)
		api.GET("/news", handlers.GetMarketNews)

		stocks := api.Group("/stocks")
		{
			stocks.GET("/tw", handlers.GetTaiwanStocks)
			stocks.GET("/us", handlers.GetUSStocks)
			stocks.GET("/potential", handlers.GetPotentialStocks)
			stocks.GET("/:symbol/quote", handlers.GetStockQuote)
			stocks.GET("/:symbol/chart", handlers.GetStockChart)
		}

		analysis := api.Group("/analysis")
		{
			analysis.GET("/signals", handlers.GetStatisticalSignals)
			analysis.GET("/sectors", handlers.GetSectors)
		}

		education := api.Group("/education")
		{
			education.GET("", handlers.GetAllEducation)
			education.GET("/:id", handlers.GetEducationByID)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8888"
	}
	log.Printf("StockTrace API server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
