package handlers

import (
	"net/http"

	"github.com/FSU-CodeRush/Techards/database"
	"github.com/gin-gonic/gin"
)

func GetTodos(c *gin.Context) {
	rows, err := database.DB.Query(
		"SELECT id, title, done FROM todos WHERE user_id=? ORDER BY id DESC", uid(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()
	todos := []gin.H{}
	for rows.Next() {
		var id int64
		var title string
		var done bool
		rows.Scan(&id, &title, &done)
		todos = append(todos, gin.H{"id": id, "title": title, "done": done})
	}
	c.JSON(http.StatusOK, todos)
}

func CreateTodo(c *gin.Context) {
	var body struct {
		Title string `json:"title" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, _ := database.DB.Exec("INSERT INTO todos(user_id, title) VALUES (?,?)", uid(c), body.Title)
	id, _ := res.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "title": body.Title, "done": false})
}

func UpdateTodo(c *gin.Context) {
	var body struct {
		Done bool `json:"done"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Exec("UPDATE todos SET done=? WHERE id=? AND user_id=?",
		b2i(body.Done), c.Param("id"), uid(c))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func DeleteTodo(c *gin.Context) {
	database.DB.Exec("DELETE FROM todos WHERE id=? AND user_id=?", c.Param("id"), uid(c))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
