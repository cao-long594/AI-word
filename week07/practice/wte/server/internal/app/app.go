package app

import (
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"wte/server/internal/auth"
	"wte/server/internal/config"
	"wte/server/internal/db"
	"wte/server/internal/handler"
	"wte/server/internal/middleware"
	"wte/server/internal/repository"
	"wte/server/internal/router"
	"wte/server/internal/service"
)

type Bootstrap struct {
	DB     *gorm.DB
	Router *gin.Engine
}

func Build(cfg config.Config) (*Bootstrap, error) {
	database, err := db.Open(cfg.DBPath)
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(database); err != nil {
		return nil, err
	}

	jwtManager := auth.NewJWTManager(cfg.JWTSecret, 24*time.Hour)

	userRepo := repository.NewUserRepository(database)
	topicRepo := repository.NewTopicRepository(database)
	postRepo := repository.NewPostRepository(database)
	commentRepo := repository.NewCommentRepository(database)

	authService := service.NewAuthService(userRepo, jwtManager)
	topicService := service.NewTopicService(topicRepo)
	postService := service.NewPostService(postRepo, topicRepo)
	commentService := service.NewCommentService(database, commentRepo, postRepo)

	authHandler := handler.NewAuthHandler(authService)
	topicHandler := handler.NewTopicHandler(topicService)
	postHandler := handler.NewPostHandler(postService)
	commentHandler := handler.NewCommentHandler(commentService)

	engine := router.New(
		authHandler,
		topicHandler,
		postHandler,
		commentHandler,
		middleware.AuthRequired(jwtManager),
	)

	return &Bootstrap{
		DB:     database,
		Router: engine,
	}, nil
}
