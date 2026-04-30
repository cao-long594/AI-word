package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"wte/server/internal/middleware"
	"wte/server/internal/model"
	"wte/server/internal/service"
)

type CommentHandler struct {
	comments *service.CommentService
}

type createCommentRequest struct {
	ParentID *uint  `json:"parent_id"`
	Content  string `json:"content"`
}

type commentResponse struct {
	ID        uint              `json:"id"`
	PostID    uint              `json:"post_id"`
	ParentID  *uint             `json:"parent_id"`
	Content   string            `json:"content"`
	Author    userResponse      `json:"author"`
	CreatedAt string            `json:"created_at"`
	UpdatedAt string            `json:"updated_at"`
	Replies   []commentResponse `json:"replies,omitempty"`
}

func NewCommentHandler(comments *service.CommentService) *CommentHandler {
	return &CommentHandler{comments: comments}
}

func (h *CommentHandler) Create(c *gin.Context) {
	var req createCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, service.NewBadRequest("invalid_json", "invalid request body"))
		return
	}

	postID, ok := parseUintParam(c, "postId")
	if !ok {
		return
	}

	comment, err := h.comments.Create(postID, middleware.MustUserID(c), req.ParentID, req.Content)
	if err != nil {
		respondError(c, err)
		return
	}

	respondCreated(c, toCommentItem(*comment))
}

func (h *CommentHandler) ListByPost(c *gin.Context) {
	postID, ok := parseUintParam(c, "postId")
	if !ok {
		return
	}

	page, pageSize := parsePagination(c)
	nodes, total, err := h.comments.ListByPost(postID, page, pageSize)
	if err != nil {
		respondError(c, err)
		return
	}

	result := make([]commentResponse, 0, len(nodes))
	for _, node := range nodes {
		result = append(result, toCommentNode(node))
	}
	respondList(c, http.StatusOK, result, page, pageSize, total)
}

func toCommentNode(node service.CommentNode) commentResponse {
	replies := make([]commentResponse, 0, len(node.Replies))
	for _, reply := range node.Replies {
		replies = append(replies, toCommentNode(reply))
	}
	return commentResponse{
		ID:        node.Comment.ID,
		PostID:    node.Comment.PostID,
		ParentID:  node.Comment.ParentID,
		Content:   node.Comment.Content,
		Author:    toUserResponse(node.Comment.Author),
		CreatedAt: node.Comment.CreatedAt.Format(time.RFC3339),
		UpdatedAt: node.Comment.UpdatedAt.Format(time.RFC3339),
		Replies:   replies,
	}
}

func toCommentItem(comment model.Comment) commentResponse {
	return commentResponse{
		ID:        comment.ID,
		PostID:    comment.PostID,
		ParentID:  comment.ParentID,
		Content:   comment.Content,
		Author:    toUserResponse(comment.Author),
		CreatedAt: comment.CreatedAt.Format(time.RFC3339),
		UpdatedAt: comment.UpdatedAt.Format(time.RFC3339),
	}
}
