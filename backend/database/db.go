package database

import (
	"database/sql"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

const schema = `
CREATE TABLE IF NOT EXISTS faculties (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	code TEXT UNIQUE NOT NULL,
	name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	faculty_id INTEGER NOT NULL REFERENCES faculties(id),
	semester INTEGER NOT NULL,
	code TEXT NOT NULL,
	title TEXT NOT NULL,
	category TEXT NOT NULL,
	credit_hours INTEGER NOT NULL DEFAULT 0,
	nature TEXT,
	full_marks INTEGER,
	pass_marks INTEGER,
	UNIQUE (faculty_id, code)
);

CREATE TABLE IF NOT EXISTS topics (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
	unit_no INTEGER NOT NULL,
	title TEXT NOT NULL,
	hours INTEGER NOT NULL DEFAULT 0,
	UNIQUE (subject_id, unit_no)
);

CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT UNIQUE NOT NULL,
	email TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	faculty_id INTEGER NOT NULL REFERENCES faculties(id),
	is_private INTEGER NOT NULL DEFAULT 0,
	exam_date TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress (
	user_id INTEGER NOT NULL REFERENCES users(id),
	topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
	completed INTEGER NOT NULL DEFAULT 0,
	completed_at DATETIME,
	PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS todos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL REFERENCES users(id),
	title TEXT NOT NULL,
	done INTEGER NOT NULL DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL REFERENCES users(id),
	subject_id INTEGER REFERENCES subjects(id),
	minutes INTEGER NOT NULL,
	completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_subjects_faculty ON subjects(faculty_id, semester);
`

func Init() {
	var err error
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "techards.db"
	}
	// The _pragma parts turn on foreign keys and a busy timeout for every connection
	DB, err = sql.Open("sqlite",
		"file:"+dbPath+"?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)")
	if err != nil {
		log.Fatal(err)
	}
	DB.SetMaxOpenConns(1)

	if _, err = DB.Exec(schema); err != nil {
		log.Fatal("schema error: ", err)
	}
	
	// Safely add columns (ignore error if they already exist)
	DB.Exec("ALTER TABLE users ADD COLUMN ai_history TEXT DEFAULT '[]'")
	DB.Exec("ALTER TABLE users ADD COLUMN pomodoro_state TEXT DEFAULT '{}'")
	
	if err = seedSyllabus(); err != nil {
		log.Fatal("seed error: ", err)
	}
	log.Println("database ready, syllabus loaded")
}

