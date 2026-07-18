ALTER TABLE subscriptions
  ADD COLUMN payment_gateway VARCHAR(20) DEFAULT NULL AFTER payment_method,
  ADD INDEX idx_sub_gateway (payment_gateway);

CREATE TABLE IF NOT EXISTS payment_config (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO payment_config (`key`, `value`) VALUES
  ('ipaymu_enabled', 'true'),
  ('ipaymu_virtual_account', ''),
  ('ipaymu_api_key', ''),
  ('ipaymu_mode', 'sandbox'),
  ('midtrans_enabled', 'false'),
  ('midtrans_server_key', ''),
  ('midtrans_client_key', ''),
  ('midtrans_merchant_id', ''),
  ('midtrans_mode', 'sandbox');
