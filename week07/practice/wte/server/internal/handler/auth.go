package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"wte/server/internal/middleware"
	"wte/server/internal/model"
	"wte/server/internal/service"
)

type AuthHandler struct {
	auth *service.AuthService
}

type authRequest struct {
	Username  string  `json:"username"`
	Password  string  `json:"password"`
	Nickname  string  `json:"nickname"`
	AvatarURL *string `json:"avatar_url"`
}

type authResponse struct {
	Token string       `json:"token"`
	User  userResponse `json:"user"`
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req authRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, service.NewBadRequest("invalid_json", "invalid request body"))
		return
	}

	user, token, err := h.auth.Register(req.Username, req.Password, req.Nickname, req.AvatarURL)
	if err != nil {
		respondError(c, err)
		return
	}

	respondCreated(c, authResponse{Token: token, User: toUserResponse(*user)})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req authRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, service.NewBadRequest("invalid_json", "invalid request body"))
		return
	}

	user, token, err := h.auth.Login(req.Username, req.Password)
	if err != nil {
		respondError(c, err)
		return
	}

	respondData(c, http.StatusOK, authResponse{Token: token, User: toUserResponse(*user)})
}

func (h *AuthHandler) Me(c *gin.Context) {
	user, err := h.auth.GetUser(middleware.MustUserID(c))
	if err != nil {
		respondError(c, err)
		return
	}

	respondData(c, http.StatusOK, toUserResponse(*user))
}

type userResponse struct {
	ID        uint    `json:"id"`
	Username  string  `json:"username"`
	Nickname  string  `json:"nickname"`
	AvatarURL *string `json:"avatar_url"`
}

func toUserResponse(user model.User) userResponse {
	return userResponse{
		ID:        user.ID,
		Username:  user.Username,
		Nickname:  user.Nickname,
		AvatarURL: user.AvatarURL,
	}
}
