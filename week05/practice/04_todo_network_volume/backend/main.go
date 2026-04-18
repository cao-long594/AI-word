package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type Todo struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateTodoRequest struct {
	Title string `json:"title"`
}

var db *sql.DB

func main() {
	dbPath := "/app/data/todo.db"

	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		log.Fatalf("create data dir failed: %v", err)
	}

	var err error
	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("open sqlite failed: %v", err)
	}
	defer db.Close()

	if err := initTable(); err != nil {
		log.Fatalf("init table failed: %v", err)
	}

	r := gin.Default()

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "ok",
		})
	})

	r.GET("/api/todos", func(c *gin.Context) {
		todos, err := listTodos()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "query todos failed"})
			return
		}
		c.JSON(http.StatusOK, todos)
	})

	r.POST("/api/todos", func(c *gin.Context) {
		var req CreateTodoRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}
		if req.Title == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title cannot be empty"})
			return
		}

		id, err := createTodo(req.Title)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create todo failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":      id,
			"message": "created",
		})
	})

	r.PUT("/api/todos/:id/toggle", func(c *gin.Context) {
		id := c.Param("id")
		if err := toggleTodo(id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "toggle todo failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "updated"})
	})

	log.Println("server started at :8081")
	if err := r.Run(":8081"); err != nil {
		log.Fatalf("server run failed: %v", err)
	}
}

func initTable() error {
	sqlStmt := `
	CREATE TABLE IF NOT EXISTS todos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		done INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME NOT NULL
	);`
	_, err := db.Exec(sqlStmt)
	return err
}

func listTodos() ([]Todo, error) {
	rows, err := db.Query(`
		SELECT id, title, done, created_at
		FROM todos
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var todos []Todo
	for rows.Next() {
		var t Todo
		var doneInt int
		var createdAt string

		if err := rows.Scan(&t.ID, &t.Title, &doneInt, &createdAt); err != nil {
			return nil, err
		}
		t.Done = doneInt == 1

		parsedTime, err := time.Parse(time.RFC3339Nano, createdAt)
		if err != nil {
			parsedTime, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		}
		t.CreatedAt = parsedTime

		todos = append(todos, t)
	}

	return todos, nil
}

func createTodo(title string) (int64, error) {
	now := time.Now()
	result, err := db.Exec(`
		INSERT INTO todos(title, done, created_at)
		VALUES (?, 0, ?)
	`, title, now.Format(time.RFC3339Nano))
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func toggleTodo(id string) error {
	_, err := db.Exec(`
		UPDATE todos
		SET done = CASE WHEN done = 1 THEN 0 ELSE 1 END
		WHERE id = ?
	`, id)
	return err
}
