ALTER TABLE scenarios
  ADD COLUMN skill_category VARCHAR(50) DEFAULT NULL
    COMMENT 'Maps to SKILL_CATEGORIES enum: SYSTEM_DESIGN, TECHNICAL_COMMUNICATION, etc.',
  ADD COLUMN has_problem BOOLEAN DEFAULT FALSE
    COMMENT 'Whether this scenario has a problem/soal for the user to solve',
  ADD INDEX idx_scenarios_skill_category (skill_category);
