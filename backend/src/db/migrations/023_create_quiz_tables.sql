ALTER TABLE curriculum
  ADD COLUMN quiz_questions JSON DEFAULT NULL AFTER content;

CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  curriculum_id VARCHAR(36) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  answers JSON DEFAULT NULL,
  passed TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE,
  INDEX idx_uqa_user_curriculum (user_id, curriculum_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
