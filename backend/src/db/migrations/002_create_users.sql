CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(255) UNIQUE NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  tech_stacks JSON,
  skill_categories JSON,
  experience_level ENUM('junior','mid','senior'),
  elo_ratings JSON DEFAULT (JSON_OBJECT()),
  preferred_language VARCHAR(5) DEFAULT 'auto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
