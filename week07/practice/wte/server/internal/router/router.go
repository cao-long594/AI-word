package router

import (
	"github.com/gin-gonic/gin"

	"wte/server/internal/handler"
)

func New(
	authHandler *handler.AuthHandler,
	topicHandler *handler.TopicHandler,
	postHandler *handler.PostHandler,
	commentHandler *handler.CommentHandler,
	authMiddleware gin.HandlerFunc,
) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	api := r.Group("/api")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)

		api.GET("/topics", topicHandler.List)
		api.GET("/topics/:topicId/posts", postHandler.ListByTopic)
		api.GET("/posts/hot", postHandler.ListHot)
		api.GET("/posts/search", postHandler.Search)
		api.GET("/posts/:postId", postHandler.GetByID)
		api.GET("/posts/:postId/comments", commentHandler.ListByPost)
	}

	authed := api.Group("/")
	authed.Use(authMiddleware)
	{
		authed.GET("/auth/me", authHandler.Me)
		authed.POST("/topics", topicHandler.Create)
		authed.POST("/topics/:topicId/posts", postHandler.Create)
		authed.POST("/posts/:postId/comments", commentHandler.Create)
	}

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return r
}
