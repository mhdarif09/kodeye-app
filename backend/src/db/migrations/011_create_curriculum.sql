CREATE TABLE IF NOT EXISTS curriculum (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('blog', 'video', 'course') NOT NULL DEFAULT 'blog',
  url VARCHAR(500) NOT NULL,
  category VARCHAR(50) DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  author VARCHAR(255) DEFAULT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_curriculum_published (is_published, sort_order),
  INDEX idx_curriculum_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
