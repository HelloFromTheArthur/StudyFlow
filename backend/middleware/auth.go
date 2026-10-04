package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Secret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "dev-secret-change-me" // fine for development only
	}
	return []byte(s)
}

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := ""

		// Try Cookie First
		if cookie, err := c.Cookie("auth_token"); err == nil {
			tokenString = cookie
		}

		// Fallback to Header
		if tokenString == "" {
			if h := c.GetHeader("Authorization"); strings.HasPrefix(h, "Bearer ") {
				tokenString = strings.TrimPrefix(h, "Bearer ")
			}
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid token"})
			return
		}

		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims,
			func(t *jwt.Token) (interface{}, error) { return Secret(), nil },
			jwt.WithValidMethods([]string{"HS256"}))
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		id, _ := claims["user_id"].(float64)
		c.Set("user_id", int64(id))
		c.Next()
	}
}
