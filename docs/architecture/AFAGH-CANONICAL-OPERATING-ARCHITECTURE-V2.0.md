# AFAGH Virtual Office — Canonical Operating Architecture v2.0

**Status:** AUTHORITATIVE ARCHITECTURE BASELINE
**Architecture decision:** APPROVED
**Production decision:** CONDITIONAL — evidence-gated

## 1. Canonical Operating Chain

AFAGH is an AI-native Business Operating System / Commerce Operating System. The canonical operating chain is:

```text
AFAGH CENTRAL HQ
        ↓
IDENTITY + WORKSPACE
        ↓
BUSINESS DISCOVERY
        ↓
BUSINESS GRAPH
        ↓
BUSINESS 360
        ↓
AI / VIRTUAL EXPERT WORKFORCE
        ↓
INTENT + CONTEXT
        ↓
INTELLIGENCE ENGINE
        ↓
DECISION ENGINE
        ↓
POLICY
        ↓
AUTHORIZATION
        ↓
WORKFLOW / EXECUTION
        ↓
COMMUNICATION OS
        ↓
RESULT
        ↓
CORRELATION ID
        ↓
POSTGRESQL EVIDENCE
        ↓
AUDIT + GOVERNANCE
        ↓
HQ / COMMAND DASHBOARD
```

This chain is the system spine. A capability is not production-complete merely because its UI exists; it must connect to the appropriate runtime, authorization, evidence, and audit boundaries.

## 2. Three Cross-Cutting Planes

### Governance Plane

Policy, authorization, security, audit, evidence integrity, tenant isolation, approvals, regional controls and release gates.

### Intelligence Plane

Business Graph, Business 360, context, AI, Virtual Experts, intent, intelligence, recommendations and decisions.

### Operations Plane

Workflow, missions, CRM/relationship operations, commerce operations, communication and execution adapters.

## 3. Non-Negotiable AI Boundary

AI and Virtual Experts do not receive unrestricted operational authority.

```text
USER REQUEST
  → IDENTITY
  → WORKSPACE
  → INTENT
  → EXPERT ROUTING
  → AI ANALYSIS
  → PROPOSED ACTION
  → POLICY CHECK
  → AUTHORIZATION
  → APPROVED EXECUTION
  → RESULT
  → CORRELATION ID
  → POSTGRESQL EVIDENCE
  → AUDIT
```

Consequential external actions remain blocked until their provider, policy, authorization and evidence gates are green.

## 4. Business Discovery and Business Graph

Business Discovery is an acquisition/intelligence capability, not an uncontrolled scraping or outreach mechanism.

```text
DISCOVER
  ↓
VERIFY PUBLIC BUSINESS DATA
  ↓
QUALIFY
  ↓
RESOLVE ENTITY
  ↓
BUSINESS GRAPH
  ↓
BUSINESS 360
  ↓
ELIGIBILITY / RELEVANCE
  ↓
AUTHORIZED NEXT ACTION
```

Public business information does not by itself authorize promotional communication. Outreach must pass channel, consent/opt-out, campaign, regional and authorization controls.

## 5. Business 360 Boundary

Business 360 is the authoritative commercial context capability for people, organizations, producers, importers, customers, suppliers and other business actors.

Business 360 is not the identity/container model for Virtual Experts. Virtual Experts consume approved context and produce governed recommendations/actions.

## 6. Virtual Expert Workforce

Virtual Experts are specialized workers with explicit capabilities, scope, policy bindings and evidence obligations.

Minimum lifecycle:

```text
AVAILABLE
  ↓
ASSIGNED
  ↓
CONTEXT LOADED
  ↓
ANALYZING
  ↓
PROPOSAL READY
  ↓
POLICY CHECK
  ↓
AUTHORIZED / REJECTED
  ↓
EXECUTED / BLOCKED
  ↓
RESULT VERIFIED
  ↓
EVIDENCE WRITTEN
```

## 7. Communication OS

Communication is an operating layer behind provider adapters. It is not owned by Business 360 or by an individual expert.

```text
COMMUNICATION OS
  ↓
CHANNEL GATEWAY
  ↓
PROVIDER ADAPTER
  ↓
DELIVERY
  ↓
DELIVERY RESULT
  ↓
CORRELATION ID
  ↓
POSTGRESQL EVIDENCE
  ↓
AUDIT
```

Required architecture boundaries include email, WhatsApp, Telegram, WeChat, Eitaa, Rubika, Shad, Bale and future approved channels. Provider credentials remain server-side and outside public source code.

## 8. Evidence as a Runtime Contract

The system must be able to prove:

- who initiated a request;
- which tenant/workspace was active;
- which expert or workflow handled it;
- what decision/proposal was produced;
- which policy was evaluated;
- who/what authorized the action;
- what execution occurred;
- what result was returned;
- which correlation ID links the chain;
- what evidence and audit records were persisted.

No UI state can substitute for runtime evidence.

## 9. Production Gate Order

```text
P0 Runtime + PostgreSQL
  ↓
P1 Identity + Authentication + Tenant/Workspace
  ↓
P2 Business Context + Business 360
  ↓
P3 Virtual Expert Workforce
  ↓
P4 Intent + Decision + Workflow
  ↓
P5 Communication OS
  ↓
P6 Business Discovery + Market Intelligence
  ↓
P7 Relationship / CRM Operations
  ↓
P8 Campaign / Outreach
  ↓
P9 Evidence + Audit + Governance
  ↓
P10 Command Dashboard
  ↓
P11 Golden Business Request E2E
  ↓
P12 Security + Reliability + Observability
  ↓
P13 Production Hardening
  ↓
P14 Production Release Gate
```

A later phase cannot promote a failed lower phase to PASS.

## 10. Current Infrastructure Truth

The repository contains a Render Blueprint declaring the P0-1 runtime and PostgreSQL dependency. The existing Render service and PostgreSQL instance are intended to be managed as the same resources rather than duplicated.

The current implementation is **not authorized for production release** until Render Blueprint/resource binding is synchronized and the following are machine-verified:

1. `DATABASE_URL` resolves to the managed AFAGH PostgreSQL instance.
2. Deploy reaches `live`.
3. Migration succeeds.
4. `/api/v1/health` is healthy in production mode.
5. Authentication is configured and verified.
6. Tenant/workspace isolation is exercised.
7. Golden Business Request produces correlation and PostgreSQL evidence.
8. Audit records are persisted and verified.
9. End-to-end tests pass.

## 11. Architecture Law

1. One governed intelligence and execution core; many channels and workspaces.
2. AI recommends/proposes; policy and authorization govern consequential execution.
3. Business Graph and Business 360 are context systems, not execution authorities.
4. Communication OS owns provider/channel execution boundaries.
5. PostgreSQL evidence is part of the runtime contract.
6. Frontend is downstream of runtime truth.
7. Secrets never enter frontend code, public repository, prompts or evidence payloads.
8. Provider integrations are replaceable adapters.
9. Failures are explicit; the system never fabricates success.
10. Production status is earned only through machine-verifiable evidence.

## 12. Acceptance

**Architecture:** APPROVED / AUTHORITATIVE

**Implementation:** CONTROLLED

**Production:** BLOCKED until all release gates above are green.
