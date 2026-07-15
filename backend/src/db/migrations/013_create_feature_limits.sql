CREATE TABLE IF NOT EXISTS feature_limits (
  id VARCHAR(36) PRIMARY KEY,
  tier_id VARCHAR(36) NOT NULL,
  feature_key VARCHAR(100) NOT NULL,
  feature_label VARCHAR(255) NOT NULL,
  feature_value VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tier_id) REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  INDEX idx_feature_tier (tier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
