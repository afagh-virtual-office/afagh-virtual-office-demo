# AFAGH AI Operating System — Four-Team Contract Challenge v3

**Document ID:** REQ-CONTRACT-CHALLENGE-V3-001  
**Scope:** C-001 through C-008  
**Source:** Requirements Baseline v0.3 + machine-readable contract schema + verification matrix  
**Review posture:** Adversarial / line-by-line / fail-closed  
**Status:** `BLOCKED — NO P0 CONTRACT APPROVED`

## 1. Review mandate

This review challenges the contracts themselves, not only the surrounding requirements. Every clause is tested for:

1. architectural determinism;
2. security enforceability;
3. business/domain ownership;
4. AI safety and control;
5. state-machine completeness;
6. machine-readable precision;
7. verification/evidence closure;
8. operational applicability across Public, Protected, Enterprise Core and Restricted zones.

Any unresolved P0 ambiguity receives `REVISE` or `BLOCKED`. No contract receives approval merely because its concept is present.

## 2. Global findings — schema and governance

### GF-001 — Contract registry is not itself a complete machine-readable contract registry
**Severity:** P0  
**Verdict:** `BLOCKED`

The current JSON file is a schema describing the shape of a registry, not a populated authoritative registry. It also permits duplicate contract IDs because uniqueness is not enforced, permits fewer than eight distinct contracts despite `minItems: 8`, and does not require owner, enforcement point, positive tests, status, versioned state-machine definitions, or evidence references.

**Required closure:** create a separate populated registry and harden the schema with uniqueness/exactness and mandatory ownership/enforcement/verification fields. The schema and registry must be independently versioned.

### GF-002 — Verification matrix is not executable evidence
**Severity:** P0  
**Verdict:** `BLOCKED`

The matrix defines negative-test names and required result fields but contains no executable test definitions, expected authorization/evidence semantics, runtime bindings, or evidence references. It is a verification plan, not verification proof.

**Required closure:** each mandatory test must resolve to a deterministic test definition and produce machine-readable result evidence.

### GF-003 — Authority names are not yet accountable authorities
**Severity:** P0  
**Verdict:** `BLOCKED`

Labels such as Policy Enforcement Point, Verification Authority, or Architecture Governance Gate identify a function, not an accountable owner, operating boundary, privilege model, escalation path, or change authority.

**Required closure:** every authority needs a canonical authority ID, accountable owner, enforcement component, decision rights, change-control path, and failure behavior.

---

# 3. C-001 — Public/Private Boundary Contract

**Verdict:** `BLOCKED`

### C001-01 — Policy tuple completeness
The tuple is directionally correct but does not define whether `capability`, `resource`, `data_class`, `action`, `tenant`, `workspace`, `region`, and `assurance` are canonical enumerations or externally supplied strings.

**Failure:** two components can make different decisions for semantically identical inputs.

**Required:** canonical typed identifiers/enumerations, normalization rules, versioning and reject-on-unknown semantics.

### C001-02 — Exposure class semantics
`PUBLIC`, `PROTECTED`, `ENTERPRISE_CORE`, `RESTRICTED` are named but their operational semantics are incomplete.

**Required:** define who may invoke, from which zones, through which trust boundaries, under which identity assurance, and what happens when a classification is missing or conflicting.

### C001-03 — “Most restrictive wins” is under-specified
No deterministic ordering is supplied for all policy dimensions.

**Required:** canonical precedence algorithm and conflict resolution rule. Ambiguous policy inputs must fail closed.

### C001-04 — Trusted cross-zone calls
The required fields are listed, but trust establishment is not defined.

**Required:** service identity issuance, workload/source attestation where applicable, destination allow-list, audience binding, scope, freshness, replay protection and authorization decision validation.

### C001-05 — Public-originated request boundary
The phrase “unless an explicitly defined trusted service boundary permits” creates an architectural escape hatch without defining the boundary registry.

**Verdict:** `BLOCKED`

**Required:** canonical service-boundary registry and explicit allowed call matrix. No ad-hoc exception.

### C001-06 — Negative tests are named, not specified
Tests such as `public→enterprise deny` lack fixture, input, expected policy decision, enforcement point, evidence output and runtime context.

**Required:** executable test contracts.

### C001-07 — Tenant/workspace precedence
No rule defines whether tenant, workspace, region or resource ownership takes precedence when contexts conflict.

**Required:** canonical context-resolution contract.

---

# 4. C-002 — Identity Contract

**Verdict:** `BLOCKED`

### C002-01 — Identity classes are insufficiently modeled
`HUMAN`, `SERVICE`, `AI_AGENT` are useful classes but attributes, lifecycle ownership, authentication mechanisms and assurance requirements are not canonicalized.

### C002-02 — Lifecycle transition matrix missing
The lifecycle is named but allowed/forbidden transitions, actor authority, effective time and propagation behavior are absent.

**Required:** complete transition matrix including suspension, revocation, restoration, retirement and invalid-transition handling.

### C002-03 — Assurance-to-risk mapping missing
The contract explicitly defers mapping until production approval.

**Verdict:** `BLOCKED` for P0 because authorization cannot be deterministically verified without the mapping.

### C002-04 — Revocation propagation bound undefined
The contract says the bound is a P0 architecture decision but does not define where it is stored, measured or verified.

**Required:** named propagation mechanism, maximum bound, measurement method and negative test.

### C002-05 — Delegation semantics incomplete
Scope, lifetime and audit are required, but delegation issuer, delegation target, transitive delegation, cancellation and maximum depth are not defined.

**Required:** delegation schema and non-transitivity/default-deny rules.

### C002-06 — Impersonation and support access
No explicit model separates impersonation, delegated authority and administrative observation.

**Required:** separate modes, explicit consent/approval rules, visible subject/actor distinction and audit evidence.

### C002-07 — Authorization decision freshness
The contract mentions expiry/freshness but does not define maximum age, clock source, cache semantics or revocation interaction.

**Required:** deterministic freshness contract.

### C002-08 — Break-glass
The contract calls break-glass security-critical but leaves the mechanism open.

**Required:** break-glass authority, approval quorum where applicable, time bound, scope, monitoring and post-use evidence.

---

# 5. C-003 — AFAGHX System-of-Record Contract

**Verdict:** `BLOCKED`

### C003-01 — Authoritative domain registry
“Designated domains” remains undefined.

**Required:** explicit domain list, authority ID, owner, schema version, consumers and change authority.

### C003-02 — Ownership/conflict authority
No canonical party is named to resolve an authority conflict between AFAGHX and another source.

**Required:** conflict authority and escalation state machine.

### C003-03 — Sync event contract
Source version and ordering are required conceptually, but event schema, monotonicity, idempotency-key derivation and duplicate semantics are absent.

### C003-04 — Delete/tombstone semantics
Tombstone is named but retention, resurrection, legal/operational meaning and downstream behavior are undefined.

### C003-05 — Maximum staleness
The contract requires a maximum approved staleness per domain but does not define the owner, breach behavior or verification.

**Required:** staleness budget and fail/alert/reconcile policy.

### C003-06 — Reconciliation
“Completion evidence” is required, but no reconciliation state machine or evidence schema is defined.

### C003-07 — AI identity resolution
Lineage is required, but confidence, deterministic validation threshold, collision handling and rejection behavior are missing.

**Required:** AI resolution remains advisory until authoritative validation; ambiguous matches must fail closed.

---

# 6. C-004 — Regional Operations Contract

**Verdict:** `BLOCKED`

### C004-01 — Regional operating profiles
Iran and China are named, but no canonical profile IDs, topology schemas or approved dependency sets exist.

### C004-02 — Data residency/transfer
The requirement names residency and transfer rules but does not provide a jurisdiction matrix or policy decision point.

**Required:** region × data class × processing purpose × transfer path matrix.

### C004-03 — Regional dependency criticality
No dependency tier or failure classification exists.

**Required:** critical/important/non-critical dependency taxonomy and workflow impact mapping.

### C004-04 — Degraded/isolated behavior
“Blocked or safely queued” leaves two materially different outcomes to implementation discretion.

**Required:** workflow-specific state transition table defining BLOCK vs QUEUE vs SAFE_DEGRADE and authorization requirements.

### C004-05 — Clock discipline
The contract requires authoritative time but does not identify the source, tolerance, drift detection or regional fallback.

### C004-06 — Interrupted actions
Idempotency and one terminal state are required, but recovery ownership, reconciliation window and duplicate-detection source are missing.

### C004-07 — Regional evidence continuity
No explicit rule ensures evidence remains attributable during partition/isolated operation.

**Required:** regional evidence buffering, integrity and reconciliation contract.

---

# 7. C-005 — AI Action Governance Contract

**Verdict:** `BLOCKED`

### C005-01 — Action schema
The required fields are comprehensive at a conceptual level but field types, enumerations, canonical references and immutability rules are absent.

### C005-02 — Lifecycle transition matrix
The lifecycle is named but legal/illegal transitions and actor/component authority are not defined.

**Required:** machine-readable state machine.

### C005-03 — Risk tiers
Risk dimensions are listed, but scoring/classification algorithm, thresholds and owner are absent.

**Required:** deterministic risk policy or authoritative policy reference; unknown risk must not silently become low risk.

### C005-04 — Human approval
“Explicit human approval” does not define approver authority, assurance level, separation of duties, approval scope, expiration or revocation.

### C005-05 — Autonomous policy
A ratified autonomous policy can permit high-risk actions, but the contract does not define policy scope, expiry, maximum blast radius or ratification authority.

**Verdict:** `BLOCKED`.

### C005-06 — AI Policy Decision Point
The PDP is declared authoritative but its relationship to the general PEP, identity service, workflow engine and tool gateway is undefined.

**Required:** component boundary and decision flow.

### C005-07 — Prompt/context lineage
A lineage reference is required, but retention, privacy boundary, content hashing/versioning and sensitive-data handling are unspecified.

### C005-08 — Tool authorization
Exact scope is required, but tool identity, operation vocabulary, resource binding, credential broker and revocation behavior are not defined.

### C005-09 — Untrusted AI inputs
The rule correctly rejects prompt injection/tool output as authorization evidence, but no trust-label propagation or enforcement mechanism is defined.

### C005-10 — Replay/idempotency
Required in principle, but no idempotency-key scope, uniqueness authority or terminal-state store is defined.

### C005-11 — Long-running missions
Binding to policy/model/tool contract is required, but checkpointing, policy change detection and re-approval semantics are absent.

---

# 8. C-006 — Evidence Contract

**Verdict:** `BLOCKED`

### C006-01 — Evidence object
Fields are named, but types, cardinality, mandatory/optional status and canonical reference formats are not fully defined.

### C006-02 — Evidence state machine
Allowed states are listed without an exhaustive transition matrix.

**Required:** legal transitions, transition authority, reasons and terminal/non-terminal semantics.

### C006-03 — PASS authority
Only an authoritative verifier may issue PASS, but verifier identity, role, isolation and credential requirements are not defined.

### C006-04 — Integrity levels
The three levels are useful, but verification algorithms and minimum evidence required for each level are absent.

### C006-05 — Invalidation/supersession
Fields exist but precedence and consumer behavior after invalidation/supersession are undefined.

### C006-06 — Expiration
Expiration is a field, not an operational rule. No class-specific TTL or expiration behavior is defined.

### C006-07 — Context binding
Runtime/build/scope/time binding is required but exact equivalence criteria are missing.

### C006-08 — Evidence replay
The verification matrix names replay as a negative test, but no nonce, sequence or verifier mechanism is defined.

### C006-09 — UI separation
The rule is strong, but the enforcement boundary between UI, evidence service and verification authority is not specified.

---

# 9. C-007 — Reliability Contract

**Verdict:** `REVISE` now; escalates to `BLOCKED` at v1.0 if unresolved.

### C007-01 — Criticality tiers
Tiers are named but classification criteria and owner are absent.

### C007-02 — Numerical targets
Correctly avoids inventing SLO/RTO/RPO numbers, but there is no mandatory decision record proving when and by whom they must be approved.

### C007-03 — Measurement window
Required conceptually but no canonical measurement source or clock is defined.

### C007-04 — Error budget
No burn-rate, exhaustion or release-gating semantics are defined.

### C007-05 — RTO/RPO scope
The distinction between authoritative, derived, queued, evidence and configuration is useful, but dependency and workflow recovery ordering are not specified.

### C007-06 — Recovery safety
Duplicate/unauthorized action prevention is required but lacks an execution ledger/reconciliation authority.

### C007-07 — DR evidence
No deterministic DR test frequency, acceptance evidence or failure disposition is defined.

### C007-08 — AI safe degradation
Allowed modes are named but workflow-specific authorization and business-risk conditions are not defined.

---

# 10. C-008 — Traceability Contract

**Verdict:** `BLOCKED`

### C008-01 — Canonical chain
The chain is correct but artifact identity, versioning and authority of each node are not fully specified.

### C008-02 — Ownership
An owner field is required but owner type, accountable authority and change rights are undefined.

### C008-03 — Architecture decision binding
A decision ID is required, but no canonical ADR registry is currently available in the public demo repository.

**Required:** authoritative architecture source and resolvable ADR IDs before closure.

### C008-04 — Component/boundary binding
No canonical component/boundary ID registry is defined.

### C008-05 — Verification state semantics
The five states are named but transition rules and authority are absent.

### C008-06 — Evidence lifecycle
Supersession is recognized, but current-vs-superseded selection must be deterministic.

### C008-07 — Automated completeness gate
The gate failure conditions are listed, but no machine-readable gate contract validates every mandatory field and cross-reference.

### C008-08 — Current architecture source gap
The repository's architecture closure process has previously failed closed when canonical architecture sources were absent. C-008 cannot claim completeness until those sources exist and resolve.

---

# 11. Four-Team verdicts

| Team | Verdict | Primary reason |
|---|---|---|
| T1 — Architecture & Technology | `REVISE` | Missing canonical schemas, boundaries, component registries and deterministic policy/state semantics |
| T2 — Domain / Business / Trade | `REVISE` | Missing accountable domain owners, regional business policies, criticality and conflict authorities |
| T3 — Security / Quality / Governance | `BLOCKED` | Missing enforceable authorization, revocation, evidence integrity, verifier authority and fail-closed details |
| T4 — AI & Intelligence Architecture | `BLOCKED` | Missing deterministic AI risk/action policy, PDP boundaries, tool authorization, lineage and mission controls |

**Consensus:** `NO P0 CONTRACT APPROVAL`.

## 12. Mandatory closure package for v0.4

The next revision is not another prose rewrite. It must produce the following contract artifacts:

1. `boundary-policy.schema.json` + populated boundary policy registry;
2. `identity.schema.json` + lifecycle/delegation policy;
3. `authority-registry.schema.json` + AFAGHX domain authority registry;
4. `regional-profile.schema.json` + Iran/China operating profiles;
5. `ai-action.schema.json` + risk/action policy and state machine;
6. `evidence.schema.json` + evidence state machine and verifier contract;
7. `reliability-profile.schema.json` + criticality/SLO/RTO/RPO decision model;
8. `traceability.schema.json` + authoritative architecture/component/verification references;
9. executable positive/negative verification definitions for every P0 contract;
10. automated schema/reference/completeness gate.

## 13. Fail-closed status

```text
Requirements v0.3              CHALLENGED
Contract Challenge v3          BLOCKED
C-001                         BLOCKED
C-002                         BLOCKED
C-003                         BLOCKED
C-004                         BLOCKED
C-005                         BLOCKED
C-006                         BLOCKED
C-007                         REVISE
C-008                         BLOCKED
P0 Approval                    NONE
Requirements v1.0              NOT APPROVED
Architecture Finalization      BLOCKED
Production Gate                BLOCKED
Dashboard                      UNCHANGED
Feature Scope                  UNCHANGED
```

**Decision:** Do not redesign the Dashboard. Do not add product features. Proceed to **Requirements v0.4 — Contract Specification & Executable Verification**, where the eight contracts become authoritative schemas, registries, state machines, ownership records and executable verification definitions.