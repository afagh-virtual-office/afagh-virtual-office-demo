CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID PRIMARY KEY,
  subject_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_subject_idx ON sessions(subject_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  subject_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY(subject_id, tenant_id, workspace_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  event_id UUID PRIMARY KEY,
  request_id UUID NOT NULL,
  actor_subject_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS','DENIED','ERROR')),
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_request_idx ON audit_events(request_id);
CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_events(actor_subject_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_tenant_idx ON audit_events(tenant_id, timestamp DESC);

REVOKE UPDATE, DELETE ON audit_events FROM PUBLIC;
