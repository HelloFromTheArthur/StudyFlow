package handlers

import (
	"database/sql"
	"math"
	"net/http"
	"strconv"

	"github.com/FSU-CodeRush/Techards/database"
	"github.com/gin-gonic/gin"
)

type topicOut struct {
	ID        int64  `json:"id"`
	UnitNo    int    `json:"unit_no"`
	Title     string `json:"title"`
	Hours     int    `json:"hours"`
	Completed bool   `json:"completed"`
}

type subjectOut struct {
	ID              int64      `json:"id"`
	Semester        int        `json:"semester"`
	Code            string     `json:"code"`
	Title           string     `json:"title"`
	Category        string     `json:"category"`
	CreditHours     int        `json:"credit_hours"`
	Nature          string     `json:"nature"`
	TotalTopics     int        `json:"total_topics"`
	CompletedTopics int        `json:"completed_topics"`
	Percent         float64    `json:"percent"`
	Topics          []topicOut `json:"topics"`
}

func pct(done, total int) float64 {
	if total == 0 {
		return 0
	}
	return math.Round(float64(done)*1000/float64(total)) / 10
}

func GetSyllabus(c *gin.Context) {
	semester, _ := strconv.Atoi(c.Query("semester"))

	rows, err := database.DB.Query(`
		SELECT s.id, s.semester, s.code, s.title, s.category, s.credit_hours,
		       COALESCE(s.nature,''),
		       t.id, t.unit_no, t.title, t.hours, COALESCE(p.completed,0)
		FROM subjects s
		JOIN users u ON u.faculty_id = s.faculty_id AND u.id = ?
		LEFT JOIN topics t ON t.subject_id = s.id
		LEFT JOIN progress p ON p.topic_id = t.id AND p.user_id = u.id
		WHERE (? = 0 OR s.semester = ?)
		ORDER BY s.semester, s.id, t.unit_no`, uid(c), semester, semester)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	subjects := []*subjectOut{}
	index := map[int64]*subjectOut{}

	for rows.Next() {
		var sid int64
		var sem, credit int
		var code, title, category, nature string
		var tid, unitNo, hours sql.NullInt64
		var ttitle sql.NullString
		var done bool

		if err := rows.Scan(&sid, &sem, &code, &title, &category, &credit, &nature,
			&tid, &unitNo, &ttitle, &hours, &done); err != nil {
			continue
		}
		s, ok := index[sid]
		if !ok {
			s = &subjectOut{ID: sid, Semester: sem, Code: code, Title: title,
				Category: category, CreditHours: credit, Nature: nature, Topics: []topicOut{}}
			index[sid] = s
			subjects = append(subjects, s)
		}
		if tid.Valid {
			s.Topics = append(s.Topics, topicOut{
				ID: tid.Int64, UnitNo: int(unitNo.Int64), Title: ttitle.String,
				Hours: int(hours.Int64), Completed: done,
			})
			s.TotalTopics += int(hours.Int64)
			if done {
				s.CompletedTopics += int(hours.Int64)
			}
		}
	}
	for _, s := range subjects {
		s.Percent = pct(s.CompletedTopics, s.TotalTopics)
	}
	c.JSON(http.StatusOK, subjects)
}

func SetProgress(c *gin.Context) {
	var body struct {
		Completed bool `json:"completed"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	topicID, err := strconv.ParseInt(c.Param("topicId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid topic id"})
		return
	}

	// Identify which semester this topic belongs to
	var semester int
	err = database.DB.QueryRow(`
		SELECT s.semester FROM topics t
		JOIN subjects s ON s.id = t.subject_id
		JOIN users u ON u.faculty_id = s.faculty_id
		WHERE t.id = ? AND u.id = ?`, topicID, uid(c)).Scan(&semester)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "topic not found"})
		return
	}

	// STRICT RULE: User can only have progress in ONE semester.
	// If they check a topic in a new semester, completely wipe their topics in all other semesters.
	if body.Completed {
		database.DB.Exec(`
			DELETE FROM progress 
			WHERE user_id = ? AND topic_id IN (
				SELECT t.id FROM topics t
				JOIN subjects s ON s.id = t.subject_id
				WHERE s.semester != ?
			)
		`, uid(c), semester)
	}

	// Toggle the actual requested topic
	_, err = database.DB.Exec(`
		INSERT INTO progress(user_id, topic_id, completed, completed_at)
		VALUES (?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP END)
		ON CONFLICT(user_id, topic_id)
		DO UPDATE SET completed = excluded.completed, completed_at = excluded.completed_at`,
		uid(c), topicID, b2i(body.Completed), b2i(body.Completed))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save progress"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func ProgressSummary(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT s.semester, COALESCE(SUM(t.hours),0), COALESCE(SUM(CASE WHEN p.completed = 1 THEN t.hours ELSE 0 END),0)
		FROM subjects s
		JOIN users u ON u.faculty_id = s.faculty_id AND u.id = ?
		JOIN topics t ON t.subject_id = s.id
		LEFT JOIN progress p ON p.topic_id = t.id AND p.user_id = u.id
		GROUP BY s.semester
		ORDER BY s.semester`, uid(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	type semOut struct {
		Semester        int     `json:"semester"`
		TotalTopics     int     `json:"total_topics"`
		CompletedTopics int     `json:"completed_topics"`
		Percent         float64 `json:"percent"`
	}
	out := []semOut{}
	totalAll, doneAll := 0, 0
	for rows.Next() {
		var sem, total, done int
		if err := rows.Scan(&sem, &total, &done); err != nil {
			continue
		}
		out = append(out, semOut{sem, total, done, pct(done, total)})
		totalAll += total
		doneAll += done
	}
	c.JSON(http.StatusOK, gin.H{
		"overall": gin.H{
			"total_topics":     totalAll,
			"completed_topics": doneAll,
			"percent":          pct(doneAll, totalAll),
		},
		"semesters": out,
	})
}
