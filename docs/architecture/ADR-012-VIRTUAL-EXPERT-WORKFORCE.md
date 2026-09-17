# ADR-012 — Virtual Expert Workforce Registry, Routing, and Authority Boundary

**Status:** ACCEPTED
**Authority:** Four-Team Architecture Council
**Scope:** Virtual Expert Workforce only

## Decision

AFAGH SHALL model Virtual Experts as a scalable workforce of independently identified expert instances. The workforce is not the Business 360 surface and is not a direct provider/channel layer.

The architecture introduces four explicit runtime responsibilities:

1. **Expert Registry** — authoritative metadata and identity for each Virtual Expert.
2. **Expert Router** — selects an eligible expert using intent, domain, context scope, skill match, status, and policy constraints.
3. **Policy Boundary** — constrains tools, actions, channels, and authority level before execution.
4. **Controlled Journey** — verifies the complete path from actor/context through expert selection, policy, authorization, channel execution, result, and evidence.

## Boundary law

```text
Business 360      = authoritative customer/business context
Virtual Experts   = cognitive/operational workforce
Communication OS  = communication transport and channel orchestration
```

A Virtual Expert MUST NOT be treated as an independent owner of provider credentials, authoritative database credentials, unrestricted tools, or uncontrolled external side effects.

## Authority levels

- **L0 OBSERVE_ANALYZE** — analysis only; no external side effect.
- **L1 RECOMMEND_DRAFT** — recommendations/drafts only; no external side effect unless explicitly approved.
- **L2 LIMITED_EXECUTION** — explicitly authorized actions only.
- **L3 AUTONOMOUS_WITHIN_POLICY** — permitted only after commercial activation authorization.

## Routing requirements

The router MUST reject an unavailable, disabled, out-of-scope, or policy-ineligible expert. Routing MUST preserve tenant/workspace isolation and MUST NOT substitute a different expert silently when an explicitly requested expert is unavailable.

## Controlled verification

A controlled journey MUST emit a correlation identifier and expose these stages:

```text
Actor
 → Identity
 → Context
 → Intent
 → Expert Selection
 → Policy
 → Authorization
 → Channel
 → Provider
 → Result
 → Evidence
```

## Consequence

The system can scale from a small initial expert set to a large governed workforce without coupling expertise to the dashboard, channel adapters, or Business 360.
