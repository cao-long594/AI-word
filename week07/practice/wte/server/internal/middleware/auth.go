package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"wte/server/internal/auth"
)

const ContextUserIDKey = "userID"

func AuthRequired(tokens *auth.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "unauthorized",
					"message": "missing authorization header",
				},
			})
			return
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "unauthorized",
					"message": "invalid authorization header",
				},
			})
			return
		}

		claims, err := tokens.Parse(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "unauthorized",
					"message": "invalid token",
				},
			})
			return
		}

		c.Set(ContextUserIDKey, claims.UserID)
		c.Next()
	}
}

func MustUserID(c *gin.Context) uint {
	value, _ := c.Get(ContextUserIDKey)
	userID, _ := value.(uint)
	return userID
}
