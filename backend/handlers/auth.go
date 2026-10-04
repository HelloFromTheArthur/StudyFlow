package handlers

import (
	"database/sql"
	"net/http"
	"strings"
	"time"

	"github.com/FSU-CodeRush/Techards/database"
	"github.com/FSU-CodeRush/Techards/middleware"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type authReq struct {
	Username string `json:"username"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Faculty  string `json:"faculty" binding:"required"`
}

func uid(c *gin.Context) int64 { return c.GetInt64("user_id") }

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}

func makeToken(userID int64) (string, error) {
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(72 * time.Hour).Unix(),
	})
	return t.SignedString(middleware.Secret())
}

// POST /api/register   body: {"email","password","faculty"}
func Register(c *gin.Context) {
	var req authReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	faculty := strings.ToUpper(strings.TrimSpace(req.Faculty))

	var facultyID int64
	err := database.DB.QueryRow("SELECT id FROM faculties WHERE code=?", faculty).Scan(&facultyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "faculty must be CSIT or BIT"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}
	res, err := database.DB.Exec(
		"INSERT INTO users(username, email, password_hash, faculty_id) VALUES (?,?,?,?)",
		strings.ToLower(strings.TrimSpace(req.Username)), strings.ToLower(strings.TrimSpace(req.Email)), string(hash), facultyID)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username or email already registered"})
		return
	}
	id, _ := res.LastInsertId()
	token, _ := makeToken(id)
	c.SetCookie("auth_token", token, 3600*72, "/", "", false, true)
	c.JSON(http.StatusCreated, gin.H{"token": token, "faculty": faculty})
}

// POST /api/login   body: {"email","password","faculty"}
func Login(c *gin.Context) {
	var req authReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var id int64
	var hash, faculty string
	err := database.DB.QueryRow(`SELECT u.id, u.password_hash, f.code FROM users u
		JOIN faculties f ON f.id = u.faculty_id WHERE u.email=?`,
		strings.ToLower(strings.TrimSpace(req.Email))).Scan(&id, &hash, &faculty)

	if err != nil ||
		bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil ||
		faculty != strings.ToUpper(strings.TrimSpace(req.Faculty)) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email, password or faculty"})
		return
	}
	token, _ := makeToken(id)
	c.SetCookie("auth_token", token, 3600*72, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"token": token, "faculty": faculty})
}

// POST /api/logout
func Logout(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// GET /api/me
func Me(c *gin.Context) {
	var username, email, code, name string
	var isPrivate bool
	var examDate sql.NullString
	err := database.DB.QueryRow(`SELECT u.username, u.email, f.code, f.name, u.is_private, u.exam_date FROM users u
		JOIN faculties f ON f.id = u.faculty_id WHERE u.id=?`, uid(c)).Scan(&username, &email, &code, &name, &isPrivate, &examDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"username": username, "email": email, "faculty": code, 
		"faculty_name": name, "is_private": isPrivate, "exam_date": examDate.String,
	})
}

// PUT /api/me
func UpdateMe(c *gin.Context) {
	var body struct {
		IsPrivate *bool   `json:"is_private"`
		ExamDate  *string `json:"exam_date"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.IsPrivate != nil {
		database.DB.Exec("UPDATE users SET is_private = ? WHERE id = ?", b2i(*body.IsPrivate), uid(c))
	}
	if body.ExamDate != nil {
		database.DB.Exec("UPDATE users SET exam_date = ? WHERE id = ?", *body.ExamDate, uid(c))
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /api/ai_history
func GetAIHistory(c *gin.Context) {
	var aiHistory sql.NullString
	err := database.DB.QueryRow("SELECT ai_history FROM users WHERE id=?", uid(c)).Scan(&aiHistory)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"ai_history": "[]"})
		return
	}
	if aiHistory.String == "" {
		c.JSON(http.StatusOK, gin.H{"ai_history": "[]"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ai_history": aiHistory.String})
}

// PUT /api/ai_history
func UpdateAIHistory(c *gin.Context) {
	var body struct {
		UserID    int64  `json:"user_id"`
		AIHistory string `json:"ai_history"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.UserID != 0 && body.UserID != uid(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "session mismatch"})
		return
	}
	database.DB.Exec("UPDATE users SET ai_history = ? WHERE id = ?", body.AIHistory, uid(c))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /api/pomodoro_state
func GetPomodoroState(c *gin.Context) {
	var state sql.NullString
	err := database.DB.QueryRow("SELECT pomodoro_state FROM users WHERE id=?", uid(c)).Scan(&state)
	if err != nil || state.String == "" {
		c.JSON(http.StatusOK, gin.H{"pomodoro_state": "{}"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"pomodoro_state": state.String})
}

// PUT /api/pomodoro_state
func UpdatePomodoroState(c *gin.Context) {
	var body struct {
		UserID int64  `json:"user_id"`
		State  string `json:"pomodoro_state"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.UserID != 0 && body.UserID != uid(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "session mismatch"})
		return
	}
	database.DB.Exec("UPDATE users SET pomodoro_state = ? WHERE id = ?", body.State, uid(c))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
