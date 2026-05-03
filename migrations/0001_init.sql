CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  initial_query TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  paper_id TEXT NOT NULL,
  paper_title TEXT NOT NULL,
  summary TEXT NOT NULL,
  groundedness REAL NOT NULL,
  query TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
