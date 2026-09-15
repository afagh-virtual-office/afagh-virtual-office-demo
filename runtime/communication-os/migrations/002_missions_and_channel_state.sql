CREATE TABLE IF NOT EXISTS missions (
  mission_id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  owner_subject_id TEXT NOT NULL,
  command TEXT NOT NULL,
  intent TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL,
  risk_tier TEXT NOT NULL CHECK (risk_tier IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  state TEXT NOT NULL,
  correlation_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_missions_tenant_workspace ON missions(tenant_id, workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_missions_correlation ON missions(correlation_id);

CREATE TABLE IF NOT EXISTS channel_operations (
  operation_id UUID PRIMARY KEY,
  mission_id UUID,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  recipient TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('PLANNED','AUTHORIZED','EXECUTING','DELIVERED','FAILED','BLOCKED','NOT_LIVE')),
  provider_message_id TEXT,
  correlation_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_channel_operation_mission FOREIGN KEY (mission_id) REFERENCES missions(mission_id)
);
CREATE INDEX IF NOT EXISTS idx_channel_operations_tenant_workspace ON channel_operations(tenant_id, workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_operations_correlation ON channel_operations(correlation_id);
