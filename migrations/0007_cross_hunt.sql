ALTER TABLE cross_games ADD COLUMN secret_cell INTEGER;
ALTER TABLE cross_games ADD COLUMN secret_number INTEGER;
ALTER TABLE cross_games ADD COLUMN round_no INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cross_games ADD COLUMN last_wrong_at INTEGER;
