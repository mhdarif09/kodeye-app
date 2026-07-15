CREATE TABLE IF NOT EXISTS peer_ratings (
  id CHAR(36) PRIMARY KEY,
  session_id CHAR(36),
  from_user_id CHAR(36),
  to_user_id CHAR(36),
  rating TINYINT CHECK (rating BETWEEN 1 AND 5),
  positive_feedback TEXT,
  improvement_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
