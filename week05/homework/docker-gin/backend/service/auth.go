package service

import (
	"errors"

	"backend/database"
	"backend/model"
	"backend/util"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrUsernameExists    = errors.New("username already exists")
	ErrInvalidCredential = errors.New("invalid credentials")
)

type AuthService struct {
	JWTSecret string
}

type LoginResult struct {
	Token    string
	UserID   int64
	Username string
}

func (s *AuthService) Register(username, password string) (*model.User, error) {
	var exists int64
	if err := database.DB.Model(&model.User{}).
		Where("username = ?", username).
		Count(&exists).Error; err != nil {
		return nil, err
	}

	if exists > 0 {
		return nil, ErrUsernameExists
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Username:     username,
		PasswordHash: string(passwordHash),
	}

	if err := database.DB.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(username, password string) (*LoginResult, error) {
	var user model.User
	err := database.DB.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvalidCredential
	}
	if err != nil {
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredential
	}

	token, err := util.GenerateToken(user.ID, user.Username, s.JWTSecret)
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		Token:    token,
		UserID:   user.ID,
		Username: user.Username,
	}, nil
}
