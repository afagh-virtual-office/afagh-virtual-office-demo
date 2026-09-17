CREATE TABLE IF NOT EXISTS virtual_expert_communication_runs (
  run_id UUID PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  expert_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  requested_level TEXT NOT NULL,
  policy_decision TEXT NOT NULL,
  authorization_decision TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  action_risk TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  provider_status TEXT,
  state TEXT NOT NULL,
  external_side_effect BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ve_comm_scope ON virtual_expert_communication_runs(tenant_id, workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ve_comm_correlation ON virtual_expert_communication_runs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_ve_comm_expert ON virtual_expert_communication_runs(expert_id, created_at DESC);
