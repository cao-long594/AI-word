package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"wte/server/internal/middleware"
	"wte/server/internal/model"
	"wte/server/internal/service"
)

type PostHandler struct {
	posts *service.PostService
}

type createPostRequest struct {
	Title           string `json:"title"`
	ContentMarkdown string `json:"content_markdown"`
}

type postResponse struct {
	ID              uint          `json:"id"`
	TopicID         uint          `json:"topic_id"`
	Title           string        `json:"title"`
	ContentMarkdown string        `json:"content_markdown,omitempty"`
	CommentCount    int64         `json:"comment_count"`
	Author          userResponse  `json:"author"`
	Topic           *topicSummary `json:"topic,omitempty"`
	CreatedAt       string        `json:"created_at"`
	UpdatedAt       string        `json:"updated_at"`
}

type topicSummary struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func NewPostHandler(posts *service.PostService) *PostHandler {
	return &PostHandler{posts: posts}
}

func (h *PostHandler) Create(c *gin.Context) {
	var req createPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, service.NewBadRequest("invalid_json", "invalid request body"))
		return
	}

	topicID, ok := parseUintParam(c, "topicId")
	if !ok {
		return
	}

	post, err := h.posts.Create(topicID, middleware.MustUserID(c), req.Title, req.ContentMarkdown)
	if err != nil {
		respondError(c, err)
		return
	}

	respondCreated(c, toPostDetailResponse(*post))
}

func (h *PostHandler) ListByTopic(c *gin.Context) {
	topicID, ok := parseUintParam(c, "topicId")
	if !ok {
		return
	}

	page, pageSize := parsePagination(c)
	searchTerm := strings.TrimSpace(c.Query("q"))
	posts, total, err := h.posts.ListByTopicWithSearch(topicID, searchTerm, page, pageSize)
	if err != nil {
		respondError(c, err)
		return
	}

	result := make([]postResponse, 0, len(posts))
	for _, post := range posts {
		result = append(result, toPostListResponse(post))
	}
	respondList(c, http.StatusOK, result, page, pageSize, total)
}

func (h *PostHandler) Search(c *gin.Context) {
	page, pageSize := parsePagination(c)
	searchTerm := strings.TrimSpace(c.Query("q"))

	posts, total, err := h.posts.Search(searchTerm, page, pageSize)
	if err != nil {
		respondError(c, err)
		return
	}

	result := make([]postResponse, 0, len(posts))
	for _, post := range posts {
		result = append(result, toPostListResponse(post))
	}
	respondList(c, http.StatusOK, result, page, pageSize, total)
}

func (h *PostHandler) ListHot(c *gin.Context) {
	limit := 5
	if raw := strings.TrimSpace(c.Query("limit")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			respondError(c, service.NewBadRequest("invalid_query", "invalid limit"))
			return
		}
		limit = parsed
	}

	posts, err := h.posts.ListHot(limit)
	if err != nil {
		respondError(c, err)
		return
	}

	result := make([]postResponse, 0, len(posts))
	for _, post := range posts {
		result = append(result, toPostListResponse(post))
	}
	respondData(c, http.StatusOK, result)
}

func (h *PostHandler) GetByID(c *gin.Context) {
	postID, ok := parseUintParam(c, "postId")
	if !ok {
		return
	}

	post, err := h.posts.GetByID(postID)
	if err != nil {
		respondError(c, err)
		return
	}

	respondData(c, http.StatusOK, toPostDetailResponse(*post))
}

func toPostListResponse(post model.Post) postResponse {
	return postResponse{
		ID:           post.ID,
		TopicID:      post.TopicID,
		Title:        post.Title,
		CommentCount: post.CommentCount,
		Author:       toUserResponse(post.Author),
		CreatedAt:    post.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    post.UpdatedAt.Format(time.RFC3339),
	}
}

func toPostDetailResponse(post model.Post) postResponse {
	return postResponse{
		ID:              post.ID,
		TopicID:         post.TopicID,
		Title:           post.Title,
		ContentMarkdown: post.ContentMarkdown,
		CommentCount:    post.CommentCount,
		Author:          toUserResponse(post.Author),
		Topic: &topicSummary{
			ID:   post.Topic.ID,
			Name: post.Topic.Name,
		},
		CreatedAt: post.CreatedAt.Format(time.RFC3339),
		UpdatedAt: post.UpdatedAt.Format(time.RFC3339),
	}
}
