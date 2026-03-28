package handlers

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"stocktrace/backend/internal/models"
	"stocktrace/backend/internal/services"
)

// GetMarketNews fetches TW and US financial news in parallel
func GetMarketNews(c *gin.Context) {
	twQueries := []string{"台積電 AI 半導體", "台股 科技股"}
	usQueries := []string{"semiconductor AI stocks", "NVIDIA AI market"}

	type fetchResult struct {
		items    []models.NewsItem
		category string
	}
	ch := make(chan fetchResult, 4)
	var wg sync.WaitGroup

	for _, q := range twQueries {
		wg.Add(1)
		go func(query string) {
			defer wg.Done()
			items, err := services.FetchNews(query)
			if err != nil {
				return
			}
			for i := range items {
				items[i].Category = "tw"
			}
			ch <- fetchResult{items: items, category: "tw"}
		}(q)
	}

	for _, q := range usQueries {
		wg.Add(1)
		go func(query string) {
			defer wg.Done()
			items, err := services.FetchNews(query)
			if err != nil {
				return
			}
			for i := range items {
				items[i].Category = "us"
			}
			ch <- fetchResult{items: items, category: "us"}
		}(q)
	}

	wg.Wait()
	close(ch)

	// Deduplicate by UUID, split by category
	seenTW := make(map[string]bool)
	seenUS := make(map[string]bool)
	var twNews, usNews []models.NewsItem

	for res := range ch {
		for _, item := range res.items {
			if res.category == "tw" && !seenTW[item.UUID] {
				seenTW[item.UUID] = true
				twNews = append(twNews, item)
			} else if res.category == "us" && !seenUS[item.UUID] {
				seenUS[item.UUID] = true
				usNews = append(usNews, item)
			}
		}
	}

	// Cap at 8 per category
	if len(twNews) > 8 {
		twNews = twNews[:8]
	}
	if len(usNews) > 8 {
		usNews = usNews[:8]
	}

	c.JSON(http.StatusOK, gin.H{
		"tw":    twNews,
		"us":    usNews,
		"total": len(twNews) + len(usNews),
	})
}
