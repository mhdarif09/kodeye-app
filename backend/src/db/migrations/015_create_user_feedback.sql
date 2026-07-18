CREATE TABLE IF NOT EXISTS user_feedback (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('suggestion', 'bug_report', 'praise', 'other') NOT NULL DEFAULT 'suggestion',
  message TEXT NOT NULL,
  status ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_feedback_user (user_id),
  INDEX idx_feedback_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
