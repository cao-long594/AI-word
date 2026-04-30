package service

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"wte/server/internal/auth"
	"wte/server/internal/model"
	"wte/server/internal/repository"
)

type AuthService struct {
	users  *repository.UserRepository
	tokens *auth.JWTManager
}

func NewAuthService(users *repository.UserRepository, tokens *auth.JWTManager) *AuthService {
	return &AuthService{users: users, tokens: tokens}
}

func (s *AuthService) Register(username, password, nickname string, avatarURL *string) (*model.User, string, error) {
	username = strings.TrimSpace(username)
	nickname = strings.TrimSpace(nickname)

	if username == "" || password == "" || nickname == "" {
		return nil, "", NewBadRequest("invalid_input", "username, password, and nickname are required")
	}
	if len(password) < 6 {
		return nil, "", NewBadRequest("invalid_password", "password must be at least 6 characters")
	}

	exists, err := s.users.ExistsByUsername(username)
	if err != nil {
		return nil, "", NewInternal(err)
	}
	if exists {
		return nil, "", NewConflict("username_taken", "username already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", NewInternal(err)
	}

	user := &model.User{
		Username:     username,
		PasswordHash: string(hash),
		Nickname:     nickname,
		AvatarURL:    avatarURL,
	}
	if err := s.users.Create(user); err != nil {
		if IsUniqueConstraintError(err) {
			return nil, "", NewConflict("username_taken", "username already exists")
		}
		return nil, "", NewInternal(err)
	}

	token, err := s.tokens.Generate(*user)
	if err != nil {
		return nil, "", NewInternal(err)
	}

	return user, token, nil
}

func (s *AuthService) Login(username, password string) (*model.User, string, error) {
	user, err := s.users.GetByUsername(strings.TrimSpace(username))
	if err != nil {
		if repository.IsNotFound(err) {
			return nil, "", NewUnauthorized("invalid username or password")
		}
		return nil, "", NewInternal(err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, "", NewUnauthorized("invalid username or password")
		}
		return nil, "", NewInternal(err)
	}

	token, err := s.tokens.Generate(*user)
	if err != nil {
		return nil, "", NewInternal(err)
	}

	return user, token, nil
}

func (s *AuthService) GetUser(userID uint) (*model.User, error) {
	user, err := s.users.GetByID(userID)
	if err != nil {
		if repository.IsNotFound(err) {
			return nil, NewNotFound("user_not_found", "user not found")
		}
		return nil, NewInternal(err)
	}
	return user, nil
}
