ALTER TABLE scenarios
  ADD COLUMN title_id VARCHAR(255) DEFAULT NULL AFTER title,
  ADD COLUMN role_a_name_id VARCHAR(100) DEFAULT NULL AFTER role_a_name,
  ADD COLUMN role_b_name_id VARCHAR(100) DEFAULT NULL AFTER role_b_name,
  ADD COLUMN role_a_briefing_id TEXT DEFAULT NULL AFTER role_a_briefing,
  ADD COLUMN role_b_briefing_id TEXT DEFAULT NULL AFTER role_b_briefing;
