CREATE TABLE IF NOT EXISTS syntheses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  query TEXT NOT NULL,
  synthesis TEXT NOT NULL,
  groundedness REAL NOT NULL,
  created_at INTEGER NOT NULL
);
