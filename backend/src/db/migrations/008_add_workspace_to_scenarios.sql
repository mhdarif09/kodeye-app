ALTER TABLE scenarios
  ADD COLUMN workspace_type VARCHAR(20) DEFAULT 'chat'
    COMMENT 'chat | code | diagram | sql',
  ADD COLUMN initial_content JSON DEFAULT NULL
    COMMENT 'Initial code, diagram template, or SQL schema for the workspace';
