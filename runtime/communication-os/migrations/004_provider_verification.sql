CREATE TABLE IF NOT EXISTS provider_verification_runs (
  verification_id UUID PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  channel TEXT NOT NULL,
  provider TEXT,
  recipient_ref TEXT NOT NULL,
  state TEXT NOT NULL,
  provider_message_id TEXT,
  provider_call_id TEXT,
  provider_status TEXT,
  provider_code TEXT,
  correlation_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  production_verified BOOLEAN NOT NULL DEFAULT FALSE,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_verification_scope ON provider_verification_runs(tenant_id, workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_verification_correlation ON provider_verification_runs(correlation_id);
