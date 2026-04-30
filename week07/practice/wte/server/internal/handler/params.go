package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"wte/server/internal/service"
)

func parseUintParam(c *gin.Context, key string) (uint, bool) {
	raw := c.Param(key)
	value, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || value == 0 {
		respondError(c, service.NewBadRequest("invalid_parameter", "invalid path parameter"))
		return 0, false
	}
	return uint(value), true
}
