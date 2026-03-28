package handlers

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"stocktrace/backend/internal/models"
	"stocktrace/backend/internal/services"
)

// GetMarketNews fetches TW and US financial news in parallel.
// Yahoo Finance is tried first; if it returns nothing, RSS feeds are used as fallback.
func GetMarketNews(c *gin.Context) {
	type categoryResult struct {
		items  []models.NewsItem
		source string // "yahoo", "rss", or "empty"
	}

	var (
		twResult, usResult categoryResult
		wg                 sync.WaitGroup
	)

	wg.Add(2)
	go func() {
		defer wg.Done()
		twResult = fetchCategoryNews(
			[]string{"台積電 AI 半導體", "台股 科技股"},
			"tw",
		)
	}()
	go func() {
		defer wg.Done()
		usResult = fetchCategoryNews(
			[]string{"NVIDIA AI semiconductor", "technology stocks nasdaq"},
			"us",
		)
	}()
	wg.Wait()

	c.JSON(http.StatusOK, gin.H{
		"tw":        twResult.items,
		"us":        usResult.items,
		"total":     len(twResult.items) + len(usResult.items),
		"twSource":  twResult.source,
		"usSource":  usResult.source,
	})
}

// fetchCategoryNews tries Yahoo Finance with at most 2 concurrent queries.
// If Yahoo returns 0 results, it falls back to RSS feeds.
func fetchCategoryNews(queries []string, category string) struct {
	items  []models.NewsItem
	source string
} {
	// Semaphore: max 2 concurrent Yahoo requests to avoid triggering rate limits
	sem := make(chan struct{}, 2)

	type fetchResult struct{ items []models.NewsItem }
	ch := make(chan fetchResult, len(queries))

	var wg sync.WaitGroup
	for _, q := range queries {
		wg.Add(1)
		go func(query string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			items, err := services.FetchNews(query)
			if err != nil {
				ch <- fetchResult{}
				return
			}
			ch <- fetchResult{items: items}
		}(q)
	}
	wg.Wait()
	close(ch)

	seen := make(map[string]bool)
	var yahooItems []models.NewsItem
	for r := range ch {
		for _, item := range r.items {
			if !seen[item.UUID] {
				seen[item.UUID] = true
				item.Category = category
				yahooItems = append(yahooItems, item)
			}
		}
	}

	if len(yahooItems) > 20 {
		yahooItems = yahooItems[:20]
	}

	if len(yahooItems) > 0 {
		return struct {
			items  []models.NewsItem
			source string
		}{yahooItems, "yahoo"}
	}

	// Yahoo returned nothing — try RSS fallback
	rssItems, err := services.FetchRSSNews(category)
	if err == nil && len(rssItems) > 0 {
		return struct {
			items  []models.NewsItem
			source string
		}{rssItems, "rss"}
	}

	return struct {
		items  []models.NewsItem
		source string
	}{[]models.NewsItem{}, "empty"}
}
