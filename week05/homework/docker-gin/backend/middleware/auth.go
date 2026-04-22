package middleware

import (
	"strings"

	"backend/util"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			util.Fail(c, 401, "missing Authorization header")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			util.Fail(c, 401, "invalid Authorization format")
			c.Abort()
			return
		}

		claims, err := util.ParseToken(parts[1], jwtSecret)
		if err != nil {
			util.Fail(c, 401, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)

		c.Next()
	}
}
