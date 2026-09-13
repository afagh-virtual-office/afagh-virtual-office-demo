# AFAGH AI Operating System — Requirements Review v2

**Review ID:** REQ-REVIEW-V2-001  
**Subject:** Requirements Baseline v0.2  
**Review posture:** Adversarial / fail-closed / P0 challenge  
**Scope:** Requirements only; no Dashboard redesign; no feature creep  
**Status:** `BLOCKED — REVISE REQUIRED`

## 1. Review mandate

The four governance teams challenged Requirements Baseline v0.2 again, this time assuming that any unresolved architectural, security, business, AI, operational, or verification ambiguity is sufficient for `REVISE` or `BLOCKED`.

A requirement is not accepted merely because it names the right concept. For a P0 requirement to pass this review it must be sufficiently precise to support an unambiguous architecture decision, implementation boundary, negative/positive verification, ownership, and evidence.

**Fail-closed rule:** ambiguity in a P0 requirement prevents Requirements v1.0 approval.

## 2. Four-team verdict

| Team | Verdict | Primary challenge |
|---|---|---|
| T1 — Architecture & Technology | `REVISE` | Boundaries, authority, context, state ownership, architecture contracts |
| T2 — Domain / Business / Trade | `REVISE` | Business authority, lifecycle semantics, regional operating model, measurable acceptance |
| T3 — Security / Quality / Governance | `BLOCKED` | Threat model, policy enforcement, evidence trust, privileged access, failure semantics |
| T4 — AI & Intelligence Architecture | `BLOCKED` | Agent authority, policy evaluation, autonomy, tool execution, model/provider failure, lineage |

**Consensus:** `NO P0 APPROVAL`

## 3. P0 findings — RB-001 Public / Private Boundary

### Challenge

`REQ-BND-001..005` establish exposure classes but do not define the authoritative policy model that assigns and enforces them.

### Gaps

- No canonical policy object/schema for capability × data × identity × action × context.
- No rule for inheritance/override between capability exposure and data exposure.
- `PROTECTED`, `ENTERPRISE_CORE`, and `RESTRICTED` lack deterministic authorization semantics.
- No explicit trust-boundary definition between public edge, application services, enterprise services, and data stores.
- Negative testing is required, but the minimum attack matrix is undefined.
- No explicit rule for cross-zone calls initiated by trusted backend services.

### Verdict

`BLOCKED`

### Required closure

Define a machine-readable boundary/policy model, authoritative enforcement point, trust boundaries, cross-zone call rules, deny matrix, and minimum negative-test set.

## 4. P0 findings — RB-002 Identity Model

### Challenge

The requirement distinguishes identity classes, but does not define how identity, authentication assurance, authorization context, delegation, and lifecycle are composed.

### Gaps

- No canonical identity model linking human, service, and agent identities.
- Authentication assurance levels are referenced but not defined or mapped to risk tiers.
- No explicit session lifecycle and revocation propagation requirement.
- No deterministic delegation/impersonation model.
- No definition of tenant/workspace/resource context precedence.
- No explicit policy for stale authorization decisions.
- Break-glass is P1 although privileged emergency access can create P0 security impact.
- No requirement for separation of authentication, authorization, and policy-decision responsibilities.

### Verdict

`BLOCKED`

### Required closure

Define identity authority, assurance levels, lifecycle/state transitions, delegation, revocation, context binding, authorization decision freshness, and privileged-access controls.

## 5. P0 findings — RB-003 AFAGHX System of Record

### Challenge

The baseline declares AFAGHX authoritative for designated domains but does not define how authority is formally established or enforced.

### Gaps

- “Designated” authoritative domains are not enumerated.
- No accountable business/data owner model with conflict authority.
- No authoritative schema/version mapping contract.
- Sync semantics lack ordering/idempotency guarantees.
- No explicit tombstone/deletion/retention propagation semantics.
- No definition of conflict classes and resolution authority.
- No maximum acceptable staleness for derived identity/contact data.
- No requirement for reconciliation completion evidence.

### Verdict

`BLOCKED`

### Required closure

Create a domain authority matrix, ownership/RACI, schema/version contract, sync state machine, idempotency/order guarantees, conflict classes, deletion semantics, freshness targets, and reconciliation evidence model.

## 6. P0 findings — RB-004 Iran / China Regional Operations

### Challenge

The baseline correctly identifies regional uncertainty but leaves the operating model too open to architecture interpretation.

### Gaps

- No approved regional deployment topology.
- No classification of data residency versus data transfer requirements by domain.
- No dependency criticality model.
- No defined degraded-mode authorization behavior.
- No explicit requirement for clock/time consistency across regions.
- No regional observability/evidence continuity model.
- No business owner for decisions that differ by region.
- No deterministic recovery/reconciliation semantics for interrupted actions.

### Verdict

`BLOCKED`

### Required closure

Define regional topology options, approved dependency classes, data-flow/residency matrix, degraded-mode rules, regional ownership, time/evidence model, and recovery/reconciliation state machine.

## 7. P0 findings — RB-005 AI Action Governance

### Challenge

This is the highest-risk requirement family. The lifecycle states are named, but authority boundaries remain underspecified.

### Gaps

- No canonical action object/schema.
- No deterministic risk-tier scoring/classification mechanism.
- “High-risk” and “irreversible” are not operationally defined.
- No policy-decision point is named as authoritative.
- No explicit separation between model output, agent plan, policy decision, approval, tool authorization, and execution.
- No delegation/approval expiry semantics.
- No replay/idempotency requirements for AI-triggered actions.
- No requirement that tool authorization be bound to exact action scope.
- No explicit treatment of prompt injection, untrusted tool output, or contaminated context as authorization hazards.
- No model/version/prompt/tool-policy lineage requirement sufficient for post-incident reconstruction.
- No deterministic behavior when model/provider changes during a long-running mission.

### Verdict

`BLOCKED`

### Required closure

Define the AI action state machine, action schema, risk taxonomy, policy-decision authority, approval/delegation semantics, scoped tool authorization, replay/idempotency rules, adversarial-input controls, model/tool/policy lineage, and long-running mission consistency rules.

## 8. P0 findings — RB-006 Evidence State Machine

### Challenge

The vocabulary is useful but the baseline does not yet define evidence as a trustworthy state machine with authoritative ownership.

### Gaps

- No canonical evidence object/schema.
- No exhaustive legal state-transition table.
- No authoritative verifier identity/type.
- No explicit distinction between evidence generation time, verification time, and state-transition time.
- `integrity` is not defined strongly enough to distinguish provenance from cryptographic integrity.
- No rule for evidence invalidation/supersession.
- No retention/versioning requirements.
- No protection against replay of old valid evidence in a new context.
- No explicit monotonicity/anti-downgrade or downgrade semantics.

### Verdict

`BLOCKED`

### Required closure

Define evidence schema, state-transition matrix, verifier authority, provenance/integrity semantics, invalidation/supersession, retention/versioning, freshness/context binding, and replay protection.

## 9. P0 findings — RB-007 Reliability Targets

### Challenge

The baseline intentionally avoids inventing numerical SLO/RTO/RPO values, which is correct, but this leaves P0 architecture decisions impossible to close until the business supplies criticality classes and target ranges.

### Gaps

- No business criticality taxonomy.
- No service/workflow tiering model.
- No measurement window and SLO error-budget semantics.
- No RTO/RPO scope definition for stateful versus derived data.
- No explicit dependency budget/allocation model.
- No regional recovery priority order.
- No recovery validation/evidence standard.
- No requirement for data-loss/duplicate-action prevention during recovery.

### Verdict

`REVISE` → `BLOCKED if not resolved before v1.0`

### Required closure

Define criticality tiers, service/workflow classes, SLO measurement semantics, RTO/RPO scope, dependency budgets, recovery priorities, and evidence-based DR acceptance tests. Numerical targets must then be approved by business and architecture governance.

## 10. P0 findings — RB-008 Complete P0 Traceability

### Challenge

The traceability chain is correct but currently describes the desired state rather than enforcing it through an authoritative gate.

### Gaps

- No canonical traceability schema.
- No unique ownership model for architecture decisions.
- No rule preventing a requirement from being mapped only to another requirement instead of an actual architecture decision/component.
- No distinction between planned, simulated, controlled-demo, and production verification in the trace model itself.
- No automated gate contract defining exactly what constitutes a complete P0 chain.
- No handling for superseded requirements/decisions/evidence.

### Verdict

`BLOCKED`

### Required closure

Create a machine-readable traceability contract and automated fail-closed gate covering requirement → decision → component/boundary → verification → evidence, with lifecycle/version/supersession semantics.

## 11. Cross-cutting P0 blockers discovered by all teams

These issues cross multiple requirement families and must not be solved by adding scattered prose to individual requirements.

### X-P0-001 — Authoritative policy decision point

The baseline requires authorization but does not name the authoritative policy-decision/enforcement architecture. `BLOCKED`.

### X-P0-002 — Context model

Tenant, workspace, region, identity class, resource, action, data classification, and risk context need a canonical composition and precedence model. `BLOCKED`.

### X-P0-003 — State-machine ownership

Identity, synchronization, AI action, evidence, recovery, and verification states need explicit authoritative owners and legal transitions. `BLOCKED`.

### X-P0-004 — Correlation and causality

Correlation IDs are required, but causal lineage across human request → AI recommendation → policy decision → approval → tool call → execution → evidence is not formally modeled. `BLOCKED`.

### X-P0-005 — Time and freshness

Security, authorization, evidence, sync, and recovery semantics depend on freshness, expiry, and clock consistency that are not yet specified. `REVISE`.

### X-P0-006 — Public repository boundary

The public-safe classification is stated, but a mechanical publication-control rule preventing restricted architecture/security material from entering the demo repository is not defined. `REVISE`.

### X-P0-007 — Verification authority

The baseline requires verification but does not define who/what is authoritative to produce a PASS and how independence is enforced. `BLOCKED`.

### X-P0-008 — Business acceptance authority

Several P0 decisions require business ownership, but accountable approval authorities are not defined. `REVISE`.

## 12. Four-team consolidated disposition

| Area | T1 | T2 | T3 | T4 | Final |
|---|---|---|---|---|---|
| RB-001 Boundary | REVISE | REVISE | BLOCKED | REVISE | `BLOCKED` |
| RB-002 Identity | REVISE | REVISE | BLOCKED | BLOCKED | `BLOCKED` |
| RB-003 AFAGHX SoR | REVISE | BLOCKED | BLOCKED | REVISE | `BLOCKED` |
| RB-004 Regional | BLOCKED | BLOCKED | BLOCKED | REVISE | `BLOCKED` |
| RB-005 AI Actions | REVISE | REVISE | BLOCKED | BLOCKED | `BLOCKED` |
| RB-006 Evidence | BLOCKED | REVISE | BLOCKED | BLOCKED | `BLOCKED` |
| RB-007 Reliability | REVISE | BLOCKED | BLOCKED | REVISE | `BLOCKED` |
| RB-008 Traceability | BLOCKED | REVISE | BLOCKED | BLOCKED | `BLOCKED` |

## 13. Review decision

**Requirements v0.2:** `REVISE / BLOCKED`  
**Requirements v1.0:** `NOT APPROVED`  
**Architecture Finalization:** `BLOCKED`  
**Production Gate:** `BLOCKED`  
**Dashboard:** `UNCHANGED`  
**Feature Scope:** `UNCHANGED`

No P0 requirement family is accepted as architecture-ready by this review.

## 14. Required next artifact — Requirements v0.3

The next revision must not merely expand prose. It must convert the unresolved ambiguity into explicit, testable contracts:

1. Public/Private capability-data-access matrix + trust-boundary contract.
2. Canonical identity/context/delegation model + assurance levels.
3. AFAGHX authority/data synchronization contract.
4. Iran/China regional operating and data-flow matrix.
5. AI action/risk/policy/approval/execution contract.
6. Evidence object + legal state-transition machine + verifier authority.
7. Business criticality + SLO/RTO/RPO + DR acceptance contract.
8. Machine-readable P0 traceability contract and fail-closed gate.
9. Cross-cutting correlation, time/freshness, lifecycle, and ownership contracts.

**Rule:** Requirements v0.3 remains a draft until the four teams independently challenge the concrete contracts again. No P0 may be marked accepted because a document merely exists; acceptance requires verifiable closure evidence.
