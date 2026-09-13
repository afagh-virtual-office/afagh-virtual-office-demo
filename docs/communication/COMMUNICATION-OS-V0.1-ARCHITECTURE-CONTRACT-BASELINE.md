# AFAGH Communication Operating System v0.1
## Architecture & Contract Baseline

**Status:** DRAFT — CONTRACT FOUNDATION
**Classification:** Public-safe architectural boundary
**Scope:** Communication Operating System; controlled demo only

## 1. Architectural Intent

AFAGH Communication Operating System (ACOS) is an Enterprise communication operating layer, not a call-center application. Call Center is a workspace/application consuming ACOS capabilities.

Hard invariants:
- Public Access != Public Data != Enterprise Access.
- UI is never the source of truth for identity, authorization, policy, evidence, or architecture state.
- AI never self-authorizes and never executes sensitive communication actions directly.
- Recommendation != Decision Proposal != Approved Action != Execution.
- No PASS without authoritative verification evidence.
- Derived communication data is not authoritative unless explicitly designated.
- Restricted implementation/security material remains outside the public demo repository.

## 2. Contract Registry

| ID | Contract | Authority | P0 |
|---|---|---|---|
| COM-C01 | Communication Identity | Identity Authority | P0 |
| COM-C02 | Communication Channel/Fabric | Communication Fabric Authority | P0 |
| COM-C03 | Communication Event | Event Authority | P0 |
| COM-C04 | AI Action | AI Policy Decision Point | P0 |
| COM-C05 | Policy Decision | Authorization/Policy Authority | P0 |
| COM-C06 | Workforce Assignment | Workforce Orchestrator | P0 |
| COM-C07 | Evidence & Audit | Verification Authority | P0 |
| COM-C08 | Regional Operation | Regional Policy & Platform Authority | P0 |

## 3. Canonical Runtime

```text
Identity + Context
       ↓
Communication Intent
       ↓
Recommendation
       ↓
Decision Proposal
       ↓
Policy Decision
       ↓
Authorization
       ↓
Workforce Assignment / Routing
       ↓
Approved Action
       ↓
Execution through Communication Fabric
       ↓
Communication Event
       ↓
Audit + Evidence
       ↓
Intelligence Feedback
```

## 4. Runtime Boundaries

### Identity
Persons, organizations, human agents, AI agents, service identities, extensions and numbers are distinct entities. A phone number is a contact identifier, not proof of identity or authority.

### Fabric
Voice/SIP, WebRTC, messaging, SMS and future channels are adapters behind a common channel contract. Provider credentials never enter model context or public UI.

### Intelligence
AI may detect intent, classify, summarize, recommend, propose actions and assist humans. AI output alone cannot authorize execution.

### Policy
Policy evaluates subject, identity class, capability, resource, data class, action, tenant, workspace, region, assurance and policy version. Deny-by-default applies when authoritative policy/context is unavailable.

### Workforce
Assignment is an explicit decision: human, AI agent, queue or escalation target. Assignment does not itself grant authorization.

### Evidence
Every material communication action has a correlation chain linking identity, decision, authorization, execution event, audit and evidence.

### Regional Operations
Iran and China are explicit operating profiles. Modes: NORMAL, DEGRADED, ISOLATED, RECOVERING. Degraded mode never silently bypasses authorization, audit or evidence requirements.

## 5. Canonical Communication Event

Minimum identity: event_id, communication_id, channel, direction, actor, participants, tenant, workspace, region, lifecycle_state, correlation_id, timestamps, policy_decision_id, authorization_decision_id, source_build.

Lifecycle:
`OFFERED → ROUTING → QUEUED → RINGING → CONNECTED → ACTIVE → TRANSFERRING → COMPLETED`

Terminal alternatives: `MISSED | REJECTED | FAILED | CANCELLED | BLOCKED`.

## 6. AI Action Boundary

AI actions use:
`RECOMMENDATION → DECISION_PROPOSAL → APPROVED_ACTION → EXECUTING → COMPLETED`

Terminal alternatives: `DENIED | EXPIRED | CANCELLED | FAILED | BLOCKED`.

High-risk or irreversible communication actions require human approval unless an explicitly ratified autonomous policy permits execution. Tool authorization is exact-scope and time/context bound.

## 7. Verification Model

Each contract must provide:
1. authoritative schema;
2. registry entry;
3. state machine;
4. owner and enforcement point;
5. positive tests;
6. negative tests;
7. machine-readable evidence;
8. automated fail-closed gate.

Verification states:
`PLANNED | SIMULATED | CONTROLLED | EXECUTED | PRODUCTION_VERIFIED`.

## 8. Gate

ACOS v0.1 is NOT APPROVED until COM-C01..COM-C08 are challenged by all four governance teams and all mandatory P0 contract tests produce current evidence.
