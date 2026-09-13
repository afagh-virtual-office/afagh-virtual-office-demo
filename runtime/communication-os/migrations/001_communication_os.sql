CREATE TABLE IF NOT EXISTS communication_events (
  event_id UUID PRIMARY KEY,
  communication_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  direction TEXT,
  actor JSONB NOT NULL,
  participants JSONB NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('IRAN','CHINA')),
  lifecycle_state TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  policy_decision_id TEXT NOT NULL,
  authorization_decision_id TEXT NOT NULL,
  source_build TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_communication_events_correlation ON communication_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_communication_events_tenant_workspace ON communication_events(tenant_id, workspace_id);

CREATE TABLE IF NOT EXISTS communication_actions (
  action_id UUID PRIMARY KEY,
  agent_id TEXT NOT NULL,
  action_state TEXT NOT NULL,
  risk_tier TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  approval TEXT NOT NULL,
  tool_scope JSONB NOT NULL,
  model TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_policy_decisions (
  decision_id UUID PRIMARY KEY,
  subject TEXT,
  identity_class TEXT,
  capability TEXT,
  resource TEXT,
  data_class TEXT,
  action TEXT,
  tenant_id TEXT,
  workspace_id TEXT,
  region TEXT,
  assurance TEXT,
  policy_version TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_evidence (
  evidence_id UUID PRIMARY KEY,
  evidence_type TEXT NOT NULL,
  source TEXT NOT NULL,
  verifier TEXT NOT NULL,
  state TEXT NOT NULL,
  integrity TEXT NOT NULL,
  provenance TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  source_build TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);
