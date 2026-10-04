package database

import (
	_ "embed"
	"encoding/json"
	"fmt"
)

// The JSON file is packed inside the compiled program
//
//go:embed syllabus.json
var syllabusJSON []byte

// Maps the keys in your JSON to the faculty codes users pick at login
var facultyCodes = map[string]string{
	"BSc_CSIT": "CSIT",
	"BIT":      "BIT",
}

type syllabusFile struct {
	Programs map[string]programData `json:"programs"`
}

type programData struct {
	Curriculum struct {
		Program string `json:"program"`
	} `json:"curriculum"`
	Courses []courseData `json:"courses"`
}

type courseData struct {
	Code        string     `json:"code"`
	Title       string     `json:"title"`
	Semester    int        `json:"semester"`
	Category    string     `json:"category"`
	CreditHours int        `json:"credit_hours"`
	Nature      string     `json:"nature"`
	FullMarks   int        `json:"full_marks"`
	PassMarks   int        `json:"pass_marks"`
	Units       []unitData `json:"units"`
}

type unitData struct {
	UnitNo int    `json:"unit_no"`
	Title  string `json:"title"`
	Hours  int    `json:"hours"`
}

// seedSyllabus is safe to run on every start: existing rows are updated, new ones inserted.
// Users' progress is never touched.
func seedSyllabus() error {
	var data syllabusFile
	if err := json.Unmarshal(syllabusJSON, &data); err != nil {
		return fmt.Errorf("could not parse syllabus.json: %w", err)
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for key, prog := range data.Programs {
		code, ok := facultyCodes[key]
		if !ok {
			continue
		}

		if _, err := tx.Exec(`
			INSERT INTO faculties(code, name) VALUES (?, ?)
			ON CONFLICT(code) DO UPDATE SET name = excluded.name`,
			code, prog.Curriculum.Program); err != nil {
			return err
		}

		var facultyID int64
		if err := tx.QueryRow("SELECT id FROM faculties WHERE code=?", code).
			Scan(&facultyID); err != nil {
			return err
		}

		for _, c := range prog.Courses {
			if _, err := tx.Exec(`
				INSERT INTO subjects(faculty_id, semester, code, title, category,
					credit_hours, nature, full_marks, pass_marks)
				VALUES (?,?,?,?,?,?,?,?,?)
				ON CONFLICT(faculty_id, code) DO UPDATE SET
					semester=excluded.semester, title=excluded.title,
					category=excluded.category, credit_hours=excluded.credit_hours,
					nature=excluded.nature, full_marks=excluded.full_marks,
					pass_marks=excluded.pass_marks`,
				facultyID, c.Semester, c.Code, c.Title, c.Category,
				c.CreditHours, c.Nature, c.FullMarks, c.PassMarks); err != nil {
				return fmt.Errorf("subject %s: %w", c.Code, err)
			}

			var subjectID int64
			if err := tx.QueryRow(
				"SELECT id FROM subjects WHERE faculty_id=? AND code=?",
				facultyID, c.Code).Scan(&subjectID); err != nil {
				return err
			}

			for _, u := range c.Units {
				if _, err := tx.Exec(`
					INSERT INTO topics(subject_id, unit_no, title, hours)
					VALUES (?,?,?,?)
					ON CONFLICT(subject_id, unit_no) DO UPDATE SET
						title=excluded.title, hours=excluded.hours`,
					subjectID, u.UnitNo, u.Title, u.Hours); err != nil {
					return fmt.Errorf("topic %s unit %d: %w", c.Code, u.UnitNo, err)
				}
			}
		}
	}
	return tx.Commit()
}

