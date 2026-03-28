package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"stocktrace/backend/internal/services"
)

// GetAllEducation returns all education content
func GetAllEducation(c *gin.Context) {
	category := c.Query("category")
	if category != "" {
		contents := services.GetEducationByCategory(category)
		c.JSON(http.StatusOK, gin.H{"contents": contents, "total": len(contents)})
		return
	}
	contents := services.GetAllEducation()
	c.JSON(http.StatusOK, gin.H{"contents": contents, "total": len(contents)})
}

// GetEducationByID returns a specific education article
func GetEducationByID(c *gin.Context) {
	id := c.Param("id")
	content, found := services.GetEducationByID(id)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "content not found"})
		return
	}
	c.JSON(http.StatusOK, content)
}
