package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"wte/server/internal/service"
)

func respondData(c *gin.Context, status int, data any) {
	c.JSON(status, gin.H{"data": data})
}

func respondList(c *gin.Context, status int, data any, page, pageSize int, total int64) {
	c.JSON(status, gin.H{
		"data": data,
		"meta": gin.H{
			"page":      page,
			"page_size": pageSize,
			"total":     total,
		},
	})
}

func respondError(c *gin.Context, err error) {
	appErr := service.AsAppError(err)
	c.JSON(appErr.HTTPStatus, gin.H{
		"error": gin.H{
			"code":    appErr.Code,
			"message": appErr.Message,
		},
	})
}

func parsePagination(c *gin.Context) (int, int) {
	page := service.NormalizePage(parseInt(c.Query("page"), 1))
	pageSize := service.NormalizePageSize(parseInt(c.Query("page_size"), 10))
	return page, pageSize
}

func parseInt(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	var value int
	if _, err := fmt.Sscanf(raw, "%d", &value); err != nil {
		return fallback
	}
	return value
}

func respondCreated(c *gin.Context, data any) {
	respondData(c, http.StatusCreated, data)
}
