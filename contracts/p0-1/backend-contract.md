# P0-1 Backend Contract — Identity, Authorization & Evidence

Status: DESIGN CONTRACT / NOT PRODUCTION

## Purpose

P0-1 proves an authenticated request end-to-end. The UI must never infer authentication, tenant, role, authorization, audit, or evidence state from presentation-only data.

## Request

`GET /api/v1/auth/evidence`

Returns one verifiable snapshot for the current authenticated request.

Required response envelope:

- `schema_version`: `p0-1.auth-evidence.v1`
- `request`: request id, method, resource, timestamp
- `identity`: authenticated subject
- `session`: session id, status, issued/expires timestamps
- `context`: tenant and workspace context
- `authorization`: ALLOW/DENY, decision id, roles, permissions, policy version
- `audit`: immutable event identity, actor, outcome, timestamp
- `evidence`: evidence id, type, source, integrity, created timestamp and optional URI

## Security rules

1. Identity comes from the trusted authentication boundary, never from client-provided identity fields.
2. Tenant/workspace context is resolved server-side and must be authorized for the subject.
3. Permissions are evaluated server-side for the requested resource and action.
4. The response must not expose access tokens, refresh tokens, client secrets, session cookies, or credential material.
5. Every authorization decision produces an auditable decision/event identifier.
6. Evidence must identify its source and integrity state. `UNVERIFIED` must never be rendered as verified proof.
7. Denied requests must produce an audit outcome of `DENIED`.
8. Timestamps are ISO-8601 UTC.
9. IDs are opaque; the UI must not derive security meaning from their format.

## Verification cases

### AUTH-001 — valid session + allowed resource
Expected: `session.status=VALID`, `authorization.decision=ALLOW`, audit `SUCCESS`, evidence `integrity=VERIFIED`.

### AUTH-002 — expired/revoked session
Expected: request rejected; no protected resource data returned; audit outcome `DENIED` or `ERROR` according to failure class.

### AUTH-003 — valid identity but insufficient permission
Expected: `authorization.decision=DENY`; audit outcome `DENIED`; evidence points to the decision/event.

### AUTH-004 — tenant isolation
Expected: a subject cannot obtain a resource from a tenant/workspace outside its authorized context.

### AUTH-005 — tampered/unverifiable evidence
Expected: integrity is `UNVERIFIED`; UI shows it as non-proof and the verifier fails the gate.

## Definition of Done

P0-1 is not PASS until these cases execute against a real runtime boundary and produce machine-verifiable evidence matching `contracts/p0-1/auth-evidence.schema.json`.
