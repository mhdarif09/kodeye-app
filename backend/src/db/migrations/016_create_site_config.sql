CREATE TABLE IF NOT EXISTS site_config (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_config (`key`, `value`) VALUES
  ('donation_enabled', 'false'),
  ('donation_settings', '{}'),
  ('feedback_request_message', ''),
  ('feedback_request_active', 'false');
