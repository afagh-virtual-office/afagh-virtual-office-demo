# AFAGH AI Operating System — Requirements Baseline v0.3

**Document ID:** REQ-BASELINE-003
**Supersedes:** REQ-BASELINE-002 v0.2
**Review source:** REQ-REVIEW-V2-001
**Status:** DRAFT — CONTRACT HARDENING
**Classification:** Public-safe architectural boundary

## 1. Purpose

v0.3 converts the eight unresolved P0 review domains into explicit contracts that are machine-readable, testable, owner-bound, and evidence-producing. This is not feature expansion and does not redesign the Dashboard.

A P0 is not considered closed because a concept is named. Closure requires: contract + owner + enforcement point + verification method + evidence definition.

## 2. Hard invariants

1. Public Access != Public Data != Enterprise Access.
2. UI state is never an authorization, evidence, architecture, or gate source of truth.
3. No identity, agent, service, or UI may self-authorize.
4. No `PASS` without authoritative verification evidence.
5. Recommendation is never execution.
6. Derived data is never authoritative unless explicitly designated.
7. Missing verification remains `OPEN` or `BLOCKED`.
8. Restricted implementation/security material stays outside this public repository.

## 3. Contract registry

| Contract | Domain | Authority | Mandatory verification | P0 |
|---|---|---|---|---|
| C-001 | Public/Private Boundary | Policy Enforcement Point | allow/deny boundary matrix | YES |
| C-002 | Identity | Identity + Authorization services | lifecycle/authz/delegation tests | YES |
| C-003 | AFAGHX SoR | Data Authority Registry | sync/conflict/reconciliation tests | YES |
| C-004 | Iran/China Regional Operations | Regional Policy + Platform | regional failure/recovery tests | YES |
| C-005 | AI Action Governance | AI Policy Decision Point | action lifecycle/security tests | YES |
| C-006 | Evidence | Verification Authority | state-machine/integrity/replay tests | YES |
| C-007 | Reliability | Architecture + Business owner | SLO/RTO/RPO/DR tests | YES |
| C-008 | Traceability | Architecture Governance | automated completeness gate | YES |

## 4. C-001 — Boundary Policy Contract

Canonical policy decision tuple:
`subject × identity_class × capability × resource × data_class × action × tenant × workspace × region × assurance × policy_version`.

Exposure classes are `PUBLIC`, `PROTECTED`, `ENTERPRISE_CORE`, `RESTRICTED`.

Rules:
- Data classification is independent from capability exposure.
- The more restrictive applicable policy wins; no implicit downgrade is permitted.
- Authorization is evaluated server-side at the authoritative Policy Enforcement Point.
- Public-originated requests cannot directly reach ENTERPRISE_CORE or RESTRICTED resources unless an explicitly defined trusted service boundary permits a scoped call.
- Trusted cross-zone calls MUST carry service identity, source context, destination, action, resource, scope, correlation ID, and policy decision ID.
- Client/UI state cannot alter policy inputs or outcomes.

Minimum negative tests: public→enterprise deny; protected→restricted deny without grant; cross-tenant deny; wrong-region policy deny; forged client-role deny; unscoped service-to-service deny.

## 5. C-002 — Identity Contract

Identity classes: `HUMAN`, `SERVICE`, `AI_AGENT`.

Lifecycle: `PROVISIONING → ACTIVE → SUSPENDED/REVOKED → RETIRED`; invalid transitions MUST fail.

Authentication assurance levels MUST be explicitly mapped to action-risk tiers before production approval. Authorization is deny-by-default and binds identity to tenant/workspace/resource/action/context.

Delegation MUST be explicit, scoped, time-bounded, revocable, and auditable. Impersonation is never implicit.

Authorization decisions MUST carry decision ID, policy version, subject, resource, action, context, assurance, issued-at, and expiry/freshness metadata. Stale decisions MUST NOT authorize actions beyond their declared validity.

Session revocation MUST prevent further protected use within an approved propagation bound; the bound itself is a P0 architecture decision.

Privileged/break-glass access is treated as security-critical: explicit approval, narrow scope, short lifetime, monitoring, and post-use review are mandatory.

## 6. C-003 — AFAGHX System-of-Record Contract

A domain authority registry MUST enumerate each authoritative identity/contact domain, its system of record, accountable owner, schema/version, lifecycle semantics, and permitted consumers.

For designated domains AFAGHX is authoritative. Virtual Office stores only derived projections unless a domain is explicitly delegated.

Synchronization MUST specify:
- source event/version;
- ordering and idempotency key;
- create/update/delete/tombstone semantics;
- retry and dead-letter behavior;
- conflict class and authoritative resolver;
- reconciliation procedure and completion evidence;
- maximum approved staleness per domain.

Contact identifiers never establish authority. AI-assisted identity resolution MUST preserve source lineage and remain non-authoritative until deterministic authority validation succeeds.

## 7. C-004 — Regional Operations Contract

Iran and China MUST each have an approved regional operating profile containing deployment topology, critical dependencies, data residency/transfer rules, retention constraints, connectivity assumptions, observability path, regional owner, and recovery priority.

Regional modes: `NORMAL`, `DEGRADED`, `ISOLATED`, `RECOVERING`.

Degraded/isolated operation MUST NOT bypass authorization, audit, or evidence requirements. Actions that cannot preserve those controls MUST be blocked or safely queued according to an approved workflow policy.

All security-relevant timestamps use a consistent authoritative time basis. Regional clock drift beyond the approved bound MUST invalidate time-sensitive authorization/evidence operations.

Interrupted actions MUST be idempotent and reconcile to one terminal state; duplicate execution is prohibited.

## 8. C-005 — AI Action Contract

Canonical lifecycle:
`RECOMMENDATION → DECISION_PROPOSAL → APPROVED_ACTION → EXECUTING → COMPLETED`
with terminal alternatives `DENIED`, `EXPIRED`, `CANCELLED`, `FAILED`, `BLOCKED`.

Every action object MUST contain: action ID, subject/agent ID, tenant/workspace, capability, target resource, requested operation, risk tier, policy version, approval/delegation reference, tool scope, model/provider/version, prompt/context lineage reference, correlation ID, idempotency key, timestamps, and terminal result.

Risk tiers MUST be defined by impact, reversibility, data sensitivity, financial/organizational authority, and blast radius. High-risk/irreversible actions require explicit human approval unless a ratified autonomous policy explicitly permits them.

The AI Policy Decision Point is authoritative. Model output, agent planning, approval, tool authorization, and execution are separate states and components.

Tool authorization MUST be scoped to the exact action/resource/operation and expire with the action. Secrets MUST remain outside model context.

Prompt injection, malicious/untrusted tool output, and contaminated context are treated as untrusted inputs and MUST never become authorization evidence.

Retries MUST use idempotency controls. Replay of an already terminal action MUST not execute it again.

Long-running missions MUST bind execution to an approved policy/model/tool contract. Material policy/model/tool changes require re-evaluation before further privileged execution.

## 9. C-006 — Evidence Contract

Canonical evidence object fields:
`evidence_id, evidence_type, subject, scope, source, verifier, state, generated_at, verified_at, transitioned_at, expires_at, integrity, provenance, correlation_id, source_build, supersedes, invalidated_by`.

Allowed states: `PASS`, `BLOCKED`, `UNKNOWN`, `UNVERIFIED`, `CONTROLLED`, `NOT_LIVE`.

Only an authoritative verifier may transition evidence into `PASS`. UI cannot transition evidence.

Every transition MUST be recorded with actor/verifier, reason, prior state, new state, verification method, and evidence reference.

`integrity` MUST distinguish at minimum `PROVENANCE_ONLY`, `INTEGRITY_VERIFIED`, and `CRYPTOGRAPHICALLY_VERIFIED`; server-generated provenance MUST NOT be represented as cryptographic integrity.

Evidence MUST support invalidation, supersession, expiration, versioning, retention policy, and context binding. Evidence presented for a different runtime/build/scope/time context MUST fail verification or be marked non-applicable.

## 10. C-007 — Reliability Contract

Business and architecture MUST define criticality tiers before numerical targets are approved:
`CRITICAL`, `HIGH`, `STANDARD`, `NON_CRITICAL`.

Each service/workflow maps to one tier and has approved availability SLO, measurement window, error-budget semantics, RTO, RPO, dependency budget, recovery priority, and DR acceptance criteria.

RTO/RPO scope MUST distinguish authoritative state, derived state, queued actions, evidence, and configuration.

Recovery MUST preserve authorization and audit controls and prevent duplicate/unauthorized actions. Rollback MUST identify the deployed build/version and produce evidence.

SLO/RTO/RPO values remain business/architecture decisions; this contract forbids silent omission, not numerical invention.

AI dependency failure modes MUST specify `BLOCK`, `QUEUE`, `RETRY`, or approved `SAFE_DEGRADE` behavior per workflow.

## 11. C-008 — Traceability Contract

Canonical chain:
`Requirement → Architecture Decision → Component/Boundary → Verification → Evidence`.

Each P0 record MUST contain unique requirement ID, owner, architecture decision ID, component/boundary ID, verification method ID, verification status, evidence ID/reference, runtime/build context, lifecycle status, and supersession links where applicable.

Verification status MUST distinguish `PLANNED`, `SIMULATED`, `CONTROLLED`, `EXECUTED`, `PRODUCTION_VERIFIED`.

A P0 chain is complete only when every mandatory node exists, references resolve, statuses are consistent, and required evidence exists. Requirement-to-requirement mapping alone is insufficient.

Superseded requirements, decisions, and evidence MUST remain traceable and MUST NOT silently satisfy the current chain.

The architecture gate MUST fail closed on missing owner, missing decision, missing component, missing verification, unresolved evidence, inconsistent state, or stale/superseded evidence.

## 12. Verification contract

Every contract SHALL produce deterministic verification cases with positive and negative paths. Verification results MUST be machine-readable and include contract ID, test ID, expected state, actual state, runtime/build context, timestamp, correlation ID, and evidence reference.

No contract is `CLOSED` until its mandatory P0 verification cases are executed or an explicitly ratified exception exists.

## 13. v0.3 gate

Requirements v1.0 remains blocked until:
1. C-001..C-008 are accepted by all four teams.
2. Each P0 contract has an authoritative owner and enforcement point.
3. Schemas/state machines are machine-readable and versioned.
4. Mandatory negative tests are defined.
5. Verification authority and evidence semantics are accepted.
6. No P0 has unresolved ambiguity.
7. Public repository contains no restricted implementation/security material.

**Status:** `BLOCKED — FOUR-TEAM CONTRACT CHALLENGE REQUIRED`
