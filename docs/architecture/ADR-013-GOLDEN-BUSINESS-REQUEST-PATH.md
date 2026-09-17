# ADR-013 — Golden Business Request Path

**Status:** ACCEPTED AS CANONICAL PROVING PATH  
**Authority:** T1 / T2 / T3 / T4  
**Date:** 2026-09-17

## Decision

AFAGH Virtual Office shall maintain one canonical end-to-end business request proving path before broad feature expansion.

The path is:

```text
USER REQUEST
 → IDENTITY + WORKSPACE
 → INTENT
 → VIRTUAL EXPERT ROUTING
 → AI ANALYSIS
 → PROPOSED RESPONSE
 → POLICY
 → AUTHORIZATION
 → APPROVED EXECUTION
 → COMMUNICATION
 → RESULT
 → CORRELATION ID
 → POSTGRESQL EVIDENCE
 → AUDIT
```

## Purpose

The Golden Path is the primary operational proof that the Virtual Office is functioning as an integrated operating system rather than as disconnected UI modules.

## Design Rules

1. Authentication and tenant/workspace context are mandatory for the authoritative path.
2. Virtual Expert routing must be deterministic and policy-bound.
3. The initial analysis implementation may use a deterministic baseline engine; this does not constitute an assertion of LLM execution.
4. External side effects remain disabled in the initial internal response stage unless an approved provider, policy and authorization are present.
5. Every completed request must receive a correlation ID.
6. Runtime evidence must be persisted in PostgreSQL.
7. Production PASS must not be inferred from a successful HTTP response alone.
8. The Golden Path must remain compatible with the existing Communication OS and Virtual Expert registry.
9. The dashboard remains downstream of runtime truth and is not the authority for PASS/FAIL.

## Acceptance Criteria

The Golden Path is operationally verified only when a real authenticated request produces a traceable sequence through identity, intent, expert routing, analysis, proposed response, policy, authorization, execution/communication result, correlation ID and PostgreSQL evidence.

Production release remains subject to the existing release gate and four-team approval.
