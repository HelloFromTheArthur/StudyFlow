package handlers

import (
	"net/http"

	"github.com/FSU-CodeRush/Techards/database"
	"github.com/gin-gonic/gin"
)

// POST /api/pomodoro  body: {"minutes": 25, "subject_id": 1}  (subject_id optional)
func LogPomodoro(c *gin.Context) {
	var body struct {
		Minutes   int    `json:"minutes" binding:"required,min=1,max=600"`
		SubjectID *int64 `json:"subject_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Check if there is an existing session for this user within the last 2 minutes
	// If so, merge this minute into that session instead of creating a new row (fixes 6 mins = 6 sessions bug)
	var lastID int64
	
	// SQLite specific date math: (julianday('now') - julianday(completed_at)) * 86400 gives seconds difference
	err := database.DB.QueryRow(`
		SELECT id FROM pomodoro_sessions 
		WHERE user_id = ? AND (subject_id = ? OR (subject_id IS NULL AND ? IS NULL))
		AND (julianday('now') - julianday(completed_at)) * 86400 < 120
		ORDER BY completed_at DESC LIMIT 1
	`, uid(c), body.SubjectID, body.SubjectID).Scan(&lastID)

	if err == nil {
		// Update existing session
		_, err = database.DB.Exec("UPDATE pomodoro_sessions SET minutes = minutes + ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?", body.Minutes, lastID)
	} else {
		// Insert new session
		_, err = database.DB.Exec("INSERT INTO pomodoro_sessions(user_id, subject_id, minutes) VALUES (?,?,?)", uid(c), body.SubjectID, body.Minutes)
	}

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not save pomodoro session"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true})
}

// GET /api/pomodoro/stats
func PomodoroStats(c *gin.Context) {
	var total, count, today int
	err := database.DB.QueryRow(`
		SELECT COALESCE(SUM(minutes),0),
		       COUNT(*),
		       COALESCE(SUM(CASE WHEN date(completed_at) = date('now') THEN minutes ELSE 0 END),0)
		FROM pomodoro_sessions WHERE user_id=?`, uid(c)).Scan(&total, &count, &today)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"total_minutes": total,
		"sessions":      count,
		"today_minutes": today,
	})
}
