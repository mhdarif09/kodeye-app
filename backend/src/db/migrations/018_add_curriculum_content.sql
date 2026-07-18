ALTER TABLE curriculum
  ADD COLUMN content LONGTEXT DEFAULT NULL AFTER url,
  ADD COLUMN access VARCHAR(20) NOT NULL DEFAULT 'free' AFTER sort_order,
  ADD INDEX idx_curriculum_access (access);
