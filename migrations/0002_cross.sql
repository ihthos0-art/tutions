CREATE TABLE IF NOT EXISTS cross_games (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'lobby',
  numbers TEXT NOT NULL DEFAULT '[]',
  picker_team TEXT,
  finder_team TEXT,
  target INTEGER,
  target_cell INTEGER,
  countdown_until INTEGER,
  hold_by TEXT,
  hold_cell INTEGER,
  hold_started_at INTEGER,
  winner TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cross_players (
  game_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  join_index INTEGER NOT NULL,
  PRIMARY KEY (game_id, student_id)
);

CREATE TABLE IF NOT EXISTS cross_crosses (
  game_id TEXT NOT NULL,
  team TEXT NOT NULL,
  cell INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (game_id, team, cell)
);
