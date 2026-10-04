package handlers

import (
	"net/http"

	"github.com/FSU-CodeRush/Techards/database"
	"github.com/gin-gonic/gin"
)

type historyEntry struct {
	Date    string `json:"date"`
	Minutes int    `json:"minutes"`
}

// GET /api/pomodoro/history?range=week|month|all
func PomodoroHistory(c *gin.Context) {
	rangeType := c.DefaultQuery("range", "week")

	var dateFilter string
	switch rangeType {
	case "week":
		dateFilter = "AND completed_at >= date('now', '-7 days')"
	case "month":
		dateFilter = "AND completed_at >= date('now', '-30 days')"
	default:
		dateFilter = ""
	}

	rows, err := database.DB.Query(`
		SELECT date(completed_at) as d, SUM(minutes)
		FROM pomodoro_sessions
		WHERE user_id = ? `+dateFilter+`
		GROUP BY d
		ORDER BY d ASC
	`, uid(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	entries := []historyEntry{}
	for rows.Next() {
		var e historyEntry
		if err := rows.Scan(&e.Date, &e.Minutes); err == nil {
			entries = append(entries, e)
		}
	}
	c.JSON(http.StatusOK, entries)
}
