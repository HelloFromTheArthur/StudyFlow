package main

import (
	"os"

	"github.com/FSU-CodeRush/Techards/database"
	"github.com/FSU-CodeRush/Techards/handlers"
	"github.com/FSU-CodeRush/Techards/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Init()

	r := gin.Default()

	// Lets your friend's frontend (running on another port) call this API
	cfg := cors.DefaultConfig()
	// Must specify exact origins when using credentials (cookies)
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	cfg.AllowOrigins = []string{frontendURL, "http://localhost:5173", "https://techards.vercel.app"}
	cfg.AllowCredentials = true
	cfg.AddAllowHeaders("Authorization")
	cfg.AddAllowMethods("PUT", "DELETE")
	r.Use(cors.New(cfg))

	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	api.POST("/register", handlers.Register)
	api.POST("/login", handlers.Login)
	api.POST("/logout", handlers.Logout)

	auth := api.Group("")
	auth.Use(middleware.Auth())
	{
		auth.GET("/me", handlers.Me)
		auth.PUT("/me", handlers.UpdateMe)
		
		auth.GET("/ai_history", handlers.GetAIHistory)
		auth.PUT("/ai_history", handlers.UpdateAIHistory)

		auth.GET("/pomodoro_state", handlers.GetPomodoroState)
		auth.PUT("/pomodoro_state", handlers.UpdatePomodoroState)

		auth.GET("/syllabus", handlers.GetSyllabus)
		auth.POST("/progress/:topicId", handlers.SetProgress)
		auth.GET("/progress/summary", handlers.ProgressSummary)

		auth.GET("/todos", handlers.GetTodos)
		auth.POST("/todos", handlers.CreateTodo)
		auth.PUT("/todos/:id", handlers.UpdateTodo)
		auth.DELETE("/todos/:id", handlers.DeleteTodo)

		auth.POST("/pomodoro", handlers.LogPomodoro)
		auth.GET("/pomodoro/stats", handlers.PomodoroStats)
		auth.GET("/pomodoro/history", handlers.PomodoroHistory)
		auth.GET("/leaderboard", handlers.GetLeaderboard)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run("0.0.0.0:" + port)
}
