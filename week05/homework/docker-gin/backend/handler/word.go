package handler

import (
	"strconv"
	"strings"

	"backend/service"
	"backend/util"

	"github.com/gin-gonic/gin"
)

type WordHandler struct {
	WordService *service.WordService
}

type QueryWordReq struct {
	Word       string `json:"word" binding:"required"`
	AIProvider string `json:"ai_provider" binding:"required"`
}

type SaveWordReq struct {
	Word       string   `json:"word" binding:"required"`
	Meaning    string   `json:"meaning" binding:"required"`
	Examples   []string `json:"examples" binding:"required"`
	AIProvider string   `json:"ai_provider" binding:"required"`
}

func (h *WordHandler) QueryWord(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var req QueryWordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Fail(c, 400, "invalid params: "+err.Error())
		return
	}

	req.Word = strings.TrimSpace(req.Word)
	req.AIProvider = strings.TrimSpace(req.AIProvider)
	req.Word = strings.ToLower(req.Word)

	if req.Word == "" {
		util.Fail(c, 400, "word cannot be empty")
		return
	}

	result, err := h.WordService.QueryWord(userID, req.Word, req.AIProvider)
	if err != nil {
		util.Fail(c, 500, "query AI failed: "+err.Error())
		return
	}

	util.Success(c, gin.H{
		"source": result.Source,
		"saved":  result.Saved,
		"word":   result.Word,
	})
}

func (h *WordHandler) SaveWord(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var req SaveWordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Fail(c, 400, "invalid params: "+err.Error())
		return
	}

	req.Word = strings.TrimSpace(req.Word)
	req.AIProvider = strings.TrimSpace(req.AIProvider)
	req.Meaning = strings.TrimSpace(req.Meaning)
	req.Word = strings.ToLower(req.Word)

	if req.Word == "" || req.Meaning == "" {
		util.Fail(c, 400, "word and meaning cannot be empty")
		return
	}

	if len(req.Examples) == 0 {
		util.Fail(c, 400, "examples cannot be empty")
		return
	}

	if err := h.WordService.SaveWord(userID, req.Word, req.Meaning, req.Examples, req.AIProvider); err != nil {
		util.Fail(c, 500, "save word failed")
		return
	}

	util.Success(c, gin.H{
		"word": req.Word,
	})
}

func (h *WordHandler) ListWords(c *gin.Context) {
	userID := c.GetInt64("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	if page < 1 {
		page = 1
	}

	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	result, err := h.WordService.ListWords(userID, page, pageSize)
	if err != nil {
		util.Fail(c, 500, "list words failed")
		return
	}

	util.Success(c, gin.H{
		"list":      result.List,
		"total":     result.Total,
		"page":      result.Page,
		"page_size": result.PageSize,
	})
}

func (h *WordHandler) DeleteWord(c *gin.Context) {
	userID := c.GetInt64("user_id")

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		util.Fail(c, 400, "invalid word id")
		return
	}

	if err := h.WordService.DeleteWord(userID, id); err != nil {
		if err == service.ErrWordNotFound {
			util.Fail(c, 404, "word not found")
			return
		}

		util.Fail(c, 500, "delete word failed")
		return
	}

	util.Success(c, gin.H{
		"id": id,
	})
}
