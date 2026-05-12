PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target INTEGER NOT NULL CHECK (target > 0),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkin_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE (project_id, date)
);

CREATE INDEX IF NOT EXISTS idx_checkin_records_project_id
ON checkin_records(project_id);

CREATE INDEX IF NOT EXISTS idx_checkin_records_date
ON checkin_records(date);
