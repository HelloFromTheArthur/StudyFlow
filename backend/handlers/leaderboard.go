package handlers

import (
	"net/http"
	"strconv"

	"github.com/FSU-CodeRush/Techards/database"
	"github.com/gin-gonic/gin"
)

type leaderOut struct {
	Username        string `json:"username"`
	TopicsCompleted int    `json:"topics_completed"`
	FocusMinutes    int    `json:"focus_minutes"`
}

func GetLeaderboard(c *gin.Context) {
	semester, _ := strconv.Atoi(c.Query("semester"))

	var facultyID int64
	err := database.DB.QueryRow("SELECT faculty_id FROM users WHERE id=?", uid(c)).Scan(&facultyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	// Topics completed calculated strictly for this semester
	// Focus minutes calculated strictly for THIS WEEK (calendar week)
	// ONLY show users on this semester's leaderboard if they have > 0 topics completed in it!

	rows, err := database.DB.Query(`
		WITH user_stats AS (
			SELECT u.id, u.username, u.is_private,
			       (SELECT COALESCE(SUM(t.hours), 0) FROM progress p 
			        JOIN topics t ON p.topic_id = t.id 
			        JOIN subjects s ON t.subject_id = s.id 
			        WHERE p.user_id = u.id AND p.completed = 1 AND s.faculty_id = u.faculty_id AND (? = 0 OR s.semester = ?)) as topics_completed,
			       (SELECT COALESCE(SUM(minutes), 0) FROM pomodoro_sessions ps 
			        WHERE ps.user_id = u.id AND strftime('%Y-%W', ps.completed_at) = strftime('%Y-%W', 'now')) as focus_minutes
			FROM users u
			WHERE u.faculty_id = ? AND u.is_private = 0
		)
		SELECT username, topics_completed, focus_minutes
		FROM user_stats
		WHERE topics_completed > 0
		ORDER BY topics_completed DESC, focus_minutes DESC
	`, semester, semester, facultyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	leaders := []leaderOut{}
	for rows.Next() {
		var l leaderOut
		if err := rows.Scan(&l.Username, &l.TopicsCompleted, &l.FocusMinutes); err == nil {
			leaders = append(leaders, l)
		}
	}
	c.JSON(http.StatusOK, leaders)
}
