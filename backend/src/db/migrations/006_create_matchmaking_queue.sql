CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) UNIQUE,
  mode ENUM('duel','coop'),
  skill_category VARCHAR(50),
  experience_level ENUM('junior','mid','senior'),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
