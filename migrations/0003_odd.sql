CREATE TABLE IF NOT EXISTS odd_games (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'lobby',
  phase TEXT NOT NULL DEFAULT 'lobby',
  round_no INTEGER NOT NULL DEFAULT 0,
  pair TEXT NOT NULL DEFAULT '[]',
  imposter TEXT,
  ready TEXT NOT NULL DEFAULT '[]',
  votes TEXT NOT NULL DEFAULT '{}',
  clues_ends_at INTEGER,
  winner TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS odd_players (
  game_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  join_index INTEGER NOT NULL,
  PRIMARY KEY (game_id, student_id)
);
