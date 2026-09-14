ALTER TABLE communication_actions
  ADD COLUMN IF NOT EXISTS tenant_id TEXT,
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;

CREATE INDEX IF NOT EXISTS idx_communication_actions_tenant_workspace
  ON communication_actions(tenant_id, workspace_id);
