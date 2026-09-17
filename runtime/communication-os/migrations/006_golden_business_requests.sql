CREATE TABLE IF NOT EXISTS golden_business_requests (
  request_id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  actor_subject_id TEXT NOT NULL,
  request_text TEXT NOT NULL,
  domain TEXT NOT NULL,
  expert_id TEXT NOT NULL,
  expert_score INTEGER NOT NULL,
  analysis JSONB NOT NULL,
  proposed_response TEXT NOT NULL,
  policy_decision TEXT NOT NULL,
  authorization_decision TEXT NOT NULL,
  execution_state TEXT NOT NULL,
  communication_channel TEXT NOT NULL,
  communication_state TEXT NOT NULL,
  result_status TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  evidence_state TEXT NOT NULL,
  release_head TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_golden_request_scope ON golden_business_requests(tenant_id, workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_golden_request_correlation ON golden_business_requests(correlation_id);
CREATE INDEX IF NOT EXISTS idx_golden_request_expert ON golden_business_requests(expert_id, created_at DESC);
