# ADR-013 — Virtual Expert Communication Bridge

**Status:** ACCEPTED / IMPLEMENTED
**Scope:** G05 controlled Virtual Expert communication

## Decision

Virtual Expert Workforce communicates through Communication OS only. The Virtual Expert runtime MUST NOT bypass the Communication OS channel adapters, provider verification boundary, authorization boundary, or durable evidence store.

The controlled path is:

```text
Authenticated Session
→ Business Context / Intent
→ Expert Router
→ Virtual Expert
→ Policy Boundary
→ Controlled Authorization
→ Communication OS Dispatch
→ Channel Adapter / Provider
→ Delivery Result
→ Durable Virtual Expert Evidence
```

## Authorization

A controlled external communication requires an authenticated session with either:

- `virtual-expert:communicate`, or
- `office:admin`

and an explicit controlled-test confirmation. Commercial activation is not implied by this permission.

## Evidence

Every controlled communication creates a durable `virtual_expert_communication_runs` record containing the release head, Expert ID, channel, requested level, policy decision, authorization decision, correlation ID, provider identity/result, delivery state and timestamps. Recipient values are not persisted directly in this evidence record.

## G05 acceptance

G05 is PASS only when a recent runtime record proves:

- `state = CONTROLLED_DELIVERED`
- `external_side_effect = true`
- a provider message identifier exists
- `policy_decision = ALLOW`
- `authorization_decision = AUTHORIZED_FOR_CONTROLLED_TEST`
- a correlation ID exists
- the exact release head is recorded
- the evidence is durably retrievable from PostgreSQL

A UI status, dry-run result, in-memory event or provider configuration alone cannot satisfy G05.
