ALTER TABLE sessions
  ADD COLUMN workspace_content JSON DEFAULT NULL
    COMMENT 'Final code/diagram/sql submitted by each participant';
