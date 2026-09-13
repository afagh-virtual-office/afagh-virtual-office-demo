# AFAGH Communication Core v0.1

**Status:** ARCHITECTURE FOUNDATION — CONTROLLED DEMO ONLY
**Scope:** Virtual Call Center / Communications Operating Layer
**Production:** BLOCKED until architecture, identity, security, provider, regional and verification gates are approved.

## 1. Product boundary

AFAGH Communication Core is the communications operating layer of the AFAGH AI Operating System. It supports controlled Public capabilities and a protected Private/Enterprise Core.

**Invariant:** Public Access != Public Data != Enterprise Access.

This public repository contains only public-safe architecture and controlled UI. Real phone numbers, SIP credentials, provider secrets, recordings, private transcripts, operator credentials and restricted infrastructure configuration MUST remain outside this repository.

## 2. Capability domains

- Numbers & Lines
- Extensions & Users
- Queues & Presence
- IVR & Call Routing
- Inbound / Outbound
- Business Hours
- Iran / China regional routing profiles
- AI Voice Agent
- AI Call Assistant
- Transcription / Summarization
- Communication Workflows
- Escalation
- Analytics
- Audit & Evidence
- Failover / Recovery

## 3. Logical architecture

```text
AFAGH AI OPERATING SYSTEM
        |
COMMUNICATION CORE
        |
+-------+--------+---------+---------+
|       |        |         |
Voice  WebRTC   SMS/Chat  AI Voice
|       |        |         |
+-------+--------+---------+
        |
COMMUNICATION ENGINE
        |
+-------+---------+---------+
|                 |         |
Routing          Queues   Workflows
|                 |         |
+-----------------+---------+
                  |
             AFAGHX Identity
                  |
        Authorization / Policy
                  |
            AI Workforce
                  |
        Audit -> Evidence -> Intelligence
```

## 4. Canonical call lifecycle

`OFFERED -> ROUTING -> QUEUED -> RINGING -> CONNECTED -> ACTIVE -> TRANSFERRING -> COMPLETED`

Terminal alternatives: `MISSED`, `REJECTED`, `FAILED`, `CANCELLED`, `BLOCKED`.

Every state transition must be attributable to an actor/service/agent and correlation ID. UI state is never the source of truth.

## 5. AI action boundary

```text
Intent
  -> Recommendation
  -> Decision Proposal
  -> Policy Check
  -> Authorization
  -> Approved Action
  -> Execution
  -> Call Event
  -> Evidence
```

AI recommendations are not execution authority. High-risk or irreversible communications actions require explicit approval unless a separately ratified autonomous policy permits them.

## 6. Trust boundaries

1. Public client zone
2. Protected communication edge
3. Enterprise communication core
4. Identity / policy boundary
5. AI execution boundary
6. Evidence / governance boundary

Cross-boundary calls require authenticated service identity, destination/audience binding, explicit scope, policy decision, correlation ID and replay protection as applicable.

## 7. Identity

AFAGHX is the authoritative source for designated ecosystem identity/contact domains. Communication Core consumes validated identity projections and does not independently become authoritative for those domains.

Mobile numbers are contact identifiers, not authorization.

Identity classes: `HUMAN`, `SERVICE`, `AI_AGENT`.

## 8. Regional operation

Iran and China require explicit operating profiles covering topology, dependencies, residency/transfer rules, connectivity, observability, recovery priority and ownership.

Operating modes: `NORMAL`, `DEGRADED`, `ISOLATED`, `RECOVERING`.

Authorization, audit and evidence cannot be bypassed during degraded operation. Actions that cannot preserve those controls are blocked or queued according to an approved workflow policy.

## 9. Evidence

Every material call/action produces a traceable evidence chain:

`identity -> policy decision -> action -> call event -> outcome -> evidence`

Controlled demo values must be labeled as `CONTROLLED` or `NOT_LIVE`; they must never be represented as production telemetry.

## 10. Verification gates

Before live telephony:

- provider and numbering architecture approved;
- identity/authentication/authorization verified;
- public/private boundary negative tests pass;
- call lifecycle tests pass;
- AI action governance tests pass;
- regional degraded/recovery tests pass;
- audit/evidence tests pass;
- reliability targets and recovery tests approved;
- traceability chain is complete;
- no unresolved P0 blocker.

**No fake-live status. No manual PASS.**
