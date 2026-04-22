package main

import (
	"log"

	"backend/config"
	"backend/database"
	"backend/handler"
	"backend/middleware"
	"backend/service"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	if err := database.Init(cfg.DBDSN); err != nil {
		log.Fatal("database init failed: ", err)
	}
	defer database.Close()

	r := gin.Default()

	authHandler := &handler.AuthHandler{
		AuthService: &service.AuthService{
			JWTSecret: cfg.JWTSecret,
		},
	}

	aiService := &service.AIService{
		Config: cfg,
	}

	wordService := &service.WordService{
		AIService: aiService,
	}

	wordHandler := &handler.WordHandler{
		WordService: wordService,
	}

	api := r.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	word := api.Group("/words")
	word.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		word.POST("/query", wordHandler.QueryWord)
		word.POST("", wordHandler.SaveWord)
		word.GET("", wordHandler.ListWords)
		word.DELETE("/:id", wordHandler.DeleteWord)
	}

	log.Println("server running on port:", cfg.Port)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("server run failed: ", err)
	}
}
