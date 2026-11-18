CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  cols INTEGER NOT NULL DEFAULT 0,
  rows INTEGER NOT NULL DEFAULT 0,
  turn_order TEXT NOT NULL DEFAULT '[]',
  turn_index INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  winner TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  game_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  lives INTEGER NOT NULL DEFAULT 3,
  eliminated INTEGER NOT NULL DEFAULT 0,
  join_index INTEGER NOT NULL,
  placement TEXT,
  PRIMARY KEY (game_id, student_id)
);

CREATE TABLE IF NOT EXISTS poisons (
  game_id TEXT NOT NULL,
  cell INTEGER NOT NULL,
  owner TEXT NOT NULL,
  PRIMARY KEY (game_id, cell, owner)
);

CREATE TABLE IF NOT EXISTS reveals (
  game_id TEXT NOT NULL,
  cell INTEGER NOT NULL,
  student_id TEXT NOT NULL,
  hit INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (game_id, cell)
);
