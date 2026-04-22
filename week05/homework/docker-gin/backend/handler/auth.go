package handler

import (
	"errors"

	"backend/service"
	"backend/util"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	AuthService *service.AuthService
}

type RegisterReq struct {
	Username string `json:"username" binding:"required,min=3,max=64"`
	Password string `json:"password" binding:"required,min=6,max=64"`
}

type LoginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Fail(c, 400, "invalid params: "+err.Error())
		return
	}

	user, err := h.AuthService.Register(req.Username, req.Password)
	if errors.Is(err, service.ErrUsernameExists) {
		util.Fail(c, 400, "username already exists")
		return
	}
	if err != nil {
		util.Fail(c, 500, "register failed")
		return
	}

	util.Success(c, gin.H{
		"id":       user.ID,
		"username": user.Username,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Fail(c, 400, "invalid params: "+err.Error())
		return
	}

	result, err := h.AuthService.Login(req.Username, req.Password)
	if errors.Is(err, service.ErrInvalidCredential) {
		util.Fail(c, 401, "username or password error")
		return
	}
	if err != nil {
		util.Fail(c, 500, "login failed")
		return
	}

	util.Success(c, gin.H{
		"token":    result.Token,
		"user_id":  result.UserID,
		"username": result.Username,
	})
}
