package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"wte/server/internal/middleware"
	"wte/server/internal/model"
	"wte/server/internal/repository"
	"wte/server/internal/service"
)

type TopicHandler struct {
	topics *service.TopicService
}

type createTopicRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type topicResponse struct {
	ID          uint         `json:"id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	PostCount   int64        `json:"post_count,omitempty"`
	Creator     userResponse `json:"creator"`
}

func NewTopicHandler(topics *service.TopicService) *TopicHandler {
	return &TopicHandler{topics: topics}
}

func (h *TopicHandler) List(c *gin.Context) {
	topics, err := h.topics.List()
	if err != nil {
		respondError(c, err)
		return
	}

	result := make([]topicResponse, 0, len(topics))
	for _, topic := range topics {
		result = append(result, toTopicListResponse(topic))
	}
	respondData(c, http.StatusOK, result)
}

func (h *TopicHandler) Create(c *gin.Context) {
	var req createTopicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, service.NewBadRequest("invalid_json", "invalid request body"))
		return
	}

	topic, err := h.topics.Create(req.Name, req.Description, middleware.MustUserID(c))
	if err != nil {
		respondError(c, err)
		return
	}

	respondCreated(c, toTopicResponse(*topic, 0))
}

func toTopicResponse(topic model.Topic, postCount int64) topicResponse {
	return topicResponse{
		ID:          topic.ID,
		Name:        topic.Name,
		Description: topic.Description,
		PostCount:   postCount,
		Creator:     toUserResponse(topic.Creator),
	}
}

func toTopicListResponse(topic repository.TopicWithPostCount) topicResponse {
	return topicResponse{
		ID:          topic.ID,
		Name:        topic.Name,
		Description: topic.Description,
		PostCount:   topic.PostCount,
		Creator:     toUserResponse(topic.Creator),
	}
}
