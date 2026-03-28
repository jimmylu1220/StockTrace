package services

import (
	"crypto/md5"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"time"

	"stocktrace/backend/internal/models"
)

// rssFeedSource pairs a public RSS feed URL with a human-readable publisher name.
type rssFeedSource struct {
	URL       string
	Publisher string
}

// Taiwan stock RSS feeds — no authentication required.
var twRSSFeeds = []rssFeedSource{
	{"https://rssfeed.cnyes.com/rss/news/tw_stock", "鉅亨網"},
	{"https://rssfeed.cnyes.com/rss/news/headline", "鉅亨網"},
	{"https://money.udn.com/rssfeed/news/1001/5591?ch=money", "經濟日報"},
}

// US financial RSS feeds — no authentication required.
var usRSSFeeds = []rssFeedSource{
	{"https://finance.yahoo.com/rss/topfinstories", "Yahoo Finance"},
	{"https://feeds.reuters.com/reuters/businessNews", "Reuters"},
	{"https://feeds.marketwatch.com/marketwatch/topstories/", "MarketWatch"},
}

// ── RSS XML structures ───────────────────────────────────────────────────────

type rssFeed struct {
	XMLName xml.Name   `xml:"rss"`
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Items []rssItem `xml:"item"`
}

type rssItem struct {
	Title   string `xml:"title"`
	Link    string `xml:"link"`
	PubDate string `xml:"pubDate"`
	GUID    string `xml:"guid"`
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

func fetchRSSFeed(src rssFeedSource) ([]models.NewsItem, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", src.URL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/rss+xml, application/xml, text/xml")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("RSS %s returned status %d", src.URL, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var feed rssFeed
	if err := xml.Unmarshal(body, &feed); err != nil {
		return nil, fmt.Errorf("RSS parse error for %s: %w", src.URL, err)
	}

	var items []models.NewsItem
	for _, ri := range feed.Channel.Items {
		if ri.Title == "" {
			continue
		}
		// Derive stable UUID from GUID or link
		id := ri.GUID
		if id == "" {
			id = ri.Link
		}
		uuid := fmt.Sprintf("%x", md5.Sum([]byte(id)))

		ts := parseRSSDate(ri.PubDate)

		items = append(items, models.NewsItem{
			UUID:        uuid,
			Title:       ri.Title,
			Publisher:   src.Publisher,
			Link:        ri.Link,
			PublishedAt: ts,
		})
	}
	return items, nil
}

// parseRSSDate tries common RSS date formats and falls back to now.
func parseRSSDate(s string) int64 {
	formats := []string{
		time.RFC1123Z, // "Mon, 02 Jan 2006 15:04:05 -0700"
		time.RFC1123,  // "Mon, 02 Jan 2006 15:04:05 MST"
	}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t.Unix()
		}
	}
	return time.Now().Unix()
}

// ── Public API ───────────────────────────────────────────────────────────────

// FetchRSSNews fetches news from public RSS feeds for the given category ("tw" or "us").
// Results are cached for cacheTTLNews. It is used as a fallback when Yahoo Finance is unavailable.
func FetchRSSNews(category string) ([]models.NewsItem, error) {
	cacheKey := "rss_news_" + category
	if cached, ok := getFromCache(cacheKey); ok {
		return cached.([]models.NewsItem), nil
	}

	var feeds []rssFeedSource
	if category == "tw" {
		feeds = twRSSFeeds
	} else {
		feeds = usRSSFeeds
	}

	seen := make(map[string]bool)
	var items []models.NewsItem

	for _, src := range feeds {
		rssItems, err := fetchRSSFeed(src)
		if err != nil {
			// Non-fatal: try the next source
			continue
		}
		for _, item := range rssItems {
			if !seen[item.UUID] {
				seen[item.UUID] = true
				item.Category = category
				items = append(items, item)
			}
		}
	}

	if len(items) == 0 {
		return nil, fmt.Errorf("all RSS sources unavailable for category %q", category)
	}

	if len(items) > 20 {
		items = items[:20]
	}

	setCache(cacheKey, items, cacheTTLNews)
	return items, nil
}
