# AFAGH Virtual Office — Commercial Activation Final Contract v1.0

**Status:** FINAL CONTROL CONTRACT / FAIL-CLOSED  
**Authority:** Four-Team Architecture Council  
**Scope:** transition from controlled runtime to real commercial operation and real Virtual Expert communications.

## 1. Final commercial activation law

The system MUST NOT enter real commercial operation because a web page is reachable, a Render service says `live`, an AI agent responds, or a human declares readiness.

Real commercial operation is unlocked only by the complete evidence chain below:

```text
DB CONNECTION PASS
        ↓
MIGRATION PASS
        ↓
COMMUNICATION HEALTH PASS
        ↓
PROVIDER VERIFICATION PASS
        ↓
CONTROLLED VIRTUAL EXPERT COMMUNICATION PASS
        ↓
EVIDENCE PERSISTENCE PASS
        ↓
SECURITY / AUTHORIZATION EVIDENCE PASS
        ↓
PRODUCTION RELEASE GATE = PASS
        ↓
COMMERCIAL ACTIVATION = AUTHORIZED
        ↓
REAL COMMERCIAL COMMUNICATION
```

Every arrow is a hard dependency. No downstream gate may bypass or reinterpret an upstream failure.

## 2. Gate definitions

### G01 — DB Connection PASS

**Purpose:** prove that the production runtime connects to the intended authoritative PostgreSQL instance.

Required evidence:

- exact runtime release head;
- target database identity/reference;
- successful authenticated connection;
- TLS/transport result where required;
- authoritative database query result;
- no fallback/placeholder host;
- no credentials or secret values in evidence.

Acceptance:

`DB_CONNECTION = PASS` only after the runtime, not a developer workstation, proves the connection.

### G02 — Migration PASS

**Purpose:** prove the target database schema is at the expected version and migrations are deterministic.

Required evidence:

- migration runner result;
- migration version set;
- checksum/integrity validation;
- transactional behavior;
- failed-migration behavior;
- exact release-head binding.

Acceptance:

`MIGRATION = PASS` only when schema state is proven against the target DB.

### G03 — Communication Health PASS

**Purpose:** prove the Communication OS is operational after successful initialization.

Required evidence:

- health endpoint response;
- database-backed health where applicable;
- runtime identity/version;
- migration state;
- no fatal startup errors;
- fail-closed behavior when prerequisites fail.

Acceptance:

`COMMUNICATION_HEALTH = PASS` only from runtime evidence.

### G04 — Provider Verification PASS

**Purpose:** prove each production communication provider actually works through its approved adapter boundary.

For each enabled provider/channel, evidence MUST include:

- provider/channel identifier;
- provider adapter version;
- controlled connectivity test;
- authentication result without exposing credentials;
- send/receive or provider-specific equivalent proof;
- timeout/failure behavior;
- retry or circuit behavior where applicable;
- evidence persistence reference.

A provider may be marked `NOT_ENABLED` only by an explicit governance decision. `UNKNOWN` or `UNVERIFIED` does not count as PASS.

### G05 — Controlled Virtual Expert Communication PASS

**Purpose:** prove an AI Virtual Expert can perform communication through the governed stack before real commercial activation.

The controlled scenario MUST exercise:

```text
Actor
 → Identity + Context
 → Intent
 → AI analysis
 → Proposed response/action
 → Policy
 → Authorization
 → Approved tool/channel
 → Provider
 → Result
 → Evidence
```

The test MUST verify:

- tenant/workspace context;
- authorized agent identity;
- policy decision;
- action risk classification;
- authorization result;
- message/channel adapter;
- correlation ID;
- audit record;
- result handling;
- no unauthorized side effect.

### G06 — Evidence Persistence PASS

**Purpose:** prove consequential communication and business actions produce durable evidence.

Required evidence:

- immutable/reliable event or audit reference;
- correlation/causation identifiers;
- actor/agent identity;
- action and outcome;
- timestamp;
- release-head binding;
- integrity verification;
- ability to retrieve the evidence from the authoritative store.

An in-memory log, UI toast, screenshot or manually entered status is insufficient.

### G07 — Security / Authorization Evidence PASS

**Purpose:** prove the system denies actions that are missing identity, permission, tenant context, policy approval or required authorization.

Mandatory negative tests:

- missing/invalid session → DENY;
- expired/revoked session → DENY;
- insufficient permission → DENY;
- cross-tenant access → DENY;
- unauthorized tool/action → DENY;
- tampered/unverifiable evidence → UNVERIFIED / DENY as applicable;
- provider failure → safe degradation without fabricated success.

All negative tests MUST emit auditable evidence.

### G08 — Production Release Gate PASS

This is the final machine-verified release gate.

It may return `PASS` only when:

```text
G01 = PASS
AND G02 = PASS
AND G03 = PASS
AND G04 = PASS
AND G05 = PASS
AND G06 = PASS
AND G07 = PASS
AND architecture closure = PASS
AND production authorization = AUTHORIZED
AND exact release head is valid
AND no mandatory blocker remains
```

The existing release verifier and CI workflow are subordinate to this contract and MUST NOT accept a self-authored PASS record as evidence.

### G09 — Commercial Activation AUTHORIZED

`COMMERCIAL_ACTIVATION = AUTHORIZED` is the operational permission resulting from G08.

Only after G09 may the system:

- establish real customer/business communications;
- send real commercial messages;
- conduct real commercial conversations through Virtual Experts;
- execute approved business workflows with external side effects;
- use production business/customer records for authorized commercial operations.

## 3. Virtual Expert activation levels

The Virtual Expert runtime has four modes:

| Level | Mode | External side effects |
|---|---|---|
| L0 | Observation / analysis | None |
| L1 | Recommendation / draft | None unless explicitly approved |
| L2 | Limited execution | Only explicitly authorized actions |
| L3 | Autonomous within policy | Allowed only after production authorization |

A release cannot start at L3. The system must promote through evidence-backed gates.

## 4. Commercial communication boundary

Real communication is always subordinate to:

`Identity → Context → Policy → Authorization → Channel → Action → Evidence`.

The Virtual Expert must never obtain direct uncontrolled access to provider credentials, raw secret material, authoritative database credentials, or unrestricted communication tools.

Promotional/bulk communication must additionally respect consent, opt-out, applicable provider/platform rules, regional requirements, frequency limits and campaign authorization.

## 5. Evidence contract

Every gate evidence record MUST identify:

- `schema_version`;
- `gate_id`;
- `status`;
- `release_head`;
- `producer`;
- `verification_method`;
- `verified_at`;
- `scope`;
- `evidence_refs`;
- `integrity`;
- `blockers`;
- `environment`.

Secret values MUST never be stored in Git, dashboard snapshots, evidence artifacts, or logs.

## 6. Freshness and invalidation

Evidence from an older release head cannot authorize a newer release unless the verifier explicitly proves compatibility.

Any of the following invalidates release readiness:

- release-head mismatch;
- changed provider credentials/configuration without re-verification;
- schema/migration change without re-verification;
- authorization policy change;
- communication adapter change;
- unresolved security incident;
- contradictory evidence;
- expired operational evidence.

## 7. Fail-closed semantics

```text
missing evidence     → BLOCKED
unknown evidence     → BLOCKED
stale evidence       → BLOCKED
contradictory result → BLOCKED
provider failure     → BLOCKED / DEGRADED
security failure     → BLOCKED
migration failure    → BLOCKED
DB failure           → BLOCKED
```

No UI can override these transitions.

## 8. Required machine-readable artifacts

The implementation MUST maintain these authoritative artifacts:

```text
data/production-release-gate.json
schema/production-readiness-evidence.schema.json
data/production-readiness-evidence.json
```

The runtime evidence bundle should additionally expose references for:

```text
DB connection
migration
communication health
provider verification
controlled Virtual Expert communication
evidence persistence
security/authorization
```

## 9. Required operational sequence

The implementation team MUST work in this order:

```text
1. Establish the correct production DB target
2. Prove DB connection from runtime
3. Run/verify migrations
4. Prove Communication OS health
5. Execute provider verification
6. Execute controlled Virtual Expert communication
7. Verify durable evidence persistence
8. Execute negative security/authorization tests
9. Run the production release verifier
10. Obtain formal Four-Team release approval
11. Unlock commercial activation
12. Promote Virtual Experts according to approved activation level
```

## 10. No premature result rule

This contract deliberately separates **architecture finalization** from **operational result reporting**.

The phrase `Production Ready` MUST NOT be displayed as PASS until the complete evidence package has been generated and verified for the exact release head.

Likewise, `Commercial Activation AUTHORIZED` MUST NOT appear before G08 PASS and formal governance approval.

## 11. Final architecture decision

This document is the **final commercial activation control contract v1.0** for AFAGH Virtual Office.

It does not grant production permission by itself. It defines the exact evidence-backed path by which production permission is earned.

**Architecture decision:** FINAL / AUTHORITATIVE  
**Commercial activation rule:** EVIDENCE-GATED / FAIL-CLOSED
