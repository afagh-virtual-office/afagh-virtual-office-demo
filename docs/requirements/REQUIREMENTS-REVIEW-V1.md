# AFAGH AI Operating System — Requirements Review v1

**Document ID:** REQ-REVIEW-V1-001  
**Baseline under review:** REQ-BASELINE-001 v0.1  
**Classification:** Public-safe architectural review  
**Status:** REVIEW OPEN — NOT APPROVED  
**Review authorities:** T1 Architecture & Technology; T2 Domain / Business / Trade; T3 Security / Quality / Governance; T4 AI & Intelligence Architecture

## 1. Review rule

Each requirement is challenged independently. A requirement may not advance to an approved architecture baseline unless it is sufficiently precise, has an identifiable architecture owner, and has a credible verification path.

Allowed review outcomes: `ACCEPTED`, `REVISE`, `REJECTED`, `MERGE`, `BLOCKED`.

This review is a public-safe architectural boundary. Confidential identity, infrastructure, policy, security configuration, and operational details remain outside this repository.

## 2. Executive verdict

**Baseline v0.1 is directionally strong but NOT ready for approval.**

Primary weaknesses found by the four-team challenge:

1. Public/private boundaries need explicit capability and data classification rules.
2. Iran/China operation needs explicit availability, connectivity, localization, and jurisdiction constraints before architecture approval.
3. AFAGHX authority needs an explicit system-of-record contract and conflict-resolution model.
4. Identity/access needs explicit lifecycle, least-privilege, service-to-service, and break-glass requirements.
5. AI execution needs risk tiers, human-approval rules, policy enforcement, and action/evidence correlation.
6. Governance states need machine-readable transition rules and ownership.
7. Operations requirements need measurable SLO/RTO/RPO and deployment controls.
8. UX requirements need measurable acceptance criteria without allowing visual status to become operational truth.

## 3. Requirement-by-requirement challenge

### Strategic

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-BIZ-001 | Boundary too broad | Business scope needs capability map | Governance ownership missing | Intelligence/workforce semantics unclear | REVISE | Define capability domains and system boundary. |
| REQ-BIZ-002 | Public/private architecture boundary underspecified | Public use cases not enumerated | Data/access classification missing | AI exposure policy missing | REVISE | Add capability, data, identity, and evidence classification rules. |
| REQ-BIZ-003 | Connectivity/HA unspecified | Iran/China business constraints unspecified | Jurisdiction/compliance unspecified | AI service locality/failure behavior unspecified | REVISE | Define regional operating constraints and failure assumptions. |
| REQ-BIZ-004 | Integration boundaries unspecified | Source-of-truth ownership incomplete | Data governance incomplete | AI dependency/lineage incomplete | REVISE | Add source-of-truth and integration ownership matrix. |

### Identity & Access

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-ACC-001 | Protected boundary valid | User classes not defined | Authentication assurance level missing | AI-agent identity missing | REVISE | Define human, service, and agent identities plus assurance levels. |
| REQ-ACC-002 | Correct architectural direction | Policy ownership missing | Decision policy/version/audit requirements needed | Agent authorization path missing | REVISE | Define centralized policy evaluation and decision evidence. |
| REQ-ACC-003 | Tenant/workspace model incomplete | Organizational hierarchy unclear | Cross-boundary denial must be provable | Agent context propagation unclear | REVISE | Define tenant/workspace/resource isolation and negative tests. |
| REQ-ACC-004 | Traceability valid | Business audit scope unclear | Evidence retention/integrity unspecified | AI action correlation missing | REVISE | Define correlation IDs, retention, integrity, and ownership. |
| REQ-ACC-005 | Correct | User-facing secret handling should be explicit | Credential/token leakage controls need test cases | AI tool credentials need isolation | ACCEPTED* | Retain; add explicit verification cases for UI, logs, and agent/tool boundaries. |

### AFAGHX / Data

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-DATA-001 | Authority boundary valid | Authoritative domains must be enumerated | Governance owner missing | AI identity resolution dependency missing | REVISE | Define exact authoritative data domains and owner. |
| REQ-DATA-002 | Prevents duplicate truth | Conflict ownership incomplete | Reconciliation policy needed | AI cache/index behavior unspecified | REVISE | Define authoritative vs replicated/derived data. |
| REQ-DATA-003 | Integration contract needed | Lifecycle/business conflict cases needed | Audit/error handling needed | AI sync/event consumption needed | REVISE | Add sync protocol, conflict, retry, reconciliation, audit. |
| REQ-DATA-004 | Correct | Business identity workflow should be explicit | Security must prohibit implicit authorization | AI must not infer authority from phone alone | ACCEPTED | Keep unchanged; use as a hard security invariant. |

### Communication

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-COM-001 | Capability boundary unspecified | Channels/use cases unspecified | Abuse/privacy controls missing | AI-generated communication needs policy | REVISE | Define channels, actors, policy, moderation, and audit boundary. |
| REQ-COM-002 | Good principle | Business retention needs definition | Privacy/security controls incomplete | AI content/action provenance needed | REVISE | Add retention, provenance, authorization, and audit requirements. |
| REQ-COM-003 | Correct | Public/enterprise communication scenarios missing | Boundary enforcement must be testable | AI/public agent boundary missing | REVISE | Define access matrix and negative verification cases. |

### AI

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-AI-001 | Strong architectural principle | Runtime responsibilities unclear | Governance/control plane missing | Correct direction | ACCEPTED* | Retain; define AI runtime/control-plane boundaries in architecture. |
| REQ-AI-002 | Scope too broad for baseline | Mission/agent business definitions missing | Permission model missing | Execution semantics incomplete | REVISE | Split capability taxonomy and define MVP/P0/P1 boundaries. |
| REQ-AI-003 | Correct but underspecified | Sensitive action classes missing | Risk tiers/human approval required | Agent tool/action authorization missing | REVISE | Add AI action risk tiers, approval, policy, evidence. |
| REQ-AI-004 | Essential | Business state transition missing | Evidence must prove recommendation vs execution | Agent execution state missing | ACCEPTED* | Retain; define immutable action state transition/evidence model. |

### Governance & Evidence

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-GOV-001 | Correct | Decision ownership needed | Canonical source required | AI architecture decisions included | ACCEPTED* | Retain; bind to canonical architecture repository. |
| REQ-GOV-002 | Broad | Material business decisions need threshold | Audit scope/retention missing | AI decisions/actions need correlation | REVISE | Define auditable event classes and retention policy. |
| REQ-GOV-003 | Strong | Business cannot override evidence | Verification authority must be defined | AI evidence cannot be self-attested | ACCEPTED* | Retain; define verifier authority and fail-closed behavior. |
| REQ-GOV-004 | Useful but incomplete | State semantics need business meaning | State transition authority missing | AI runtime state needs mapping | REVISE | Define state machine, transitions, owner, and evidence requirement. |

### Reliability & Operations

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-OPS-001 | Correct | Environment purpose needs definition | Production separation controls missing | AI evaluation environments missing | ACCEPTED* | Retain; add environment identity and access rules. |
| REQ-OPS-002 | Correct | Ownership unspecified | Secret rotation/audit/access policy missing | AI provider credentials need isolation | REVISE | Add secret lifecycle, rotation, access, and audit requirements. |
| REQ-OPS-003 | Too generic | Business continuity targets absent | SLO/RTO/RPO/DR absent | AI dependency failure policy absent | REVISE | Define measurable reliability and recovery targets. |

### Product Experience

| ID | T1 | T2 | T3 | T4 | Verdict | Required action |
|---|---|---|---|---|---|---|
| REQ-UX-001 | Non-functional but valid | Product acceptance criteria absent | Trust indicators must be truthful | AI transparency needed | REVISE | Add measurable UX acceptance criteria. |
| REQ-UX-002 | Correct presentation principle | User workflows need command-surface definition | Operational truth must remain external | AI state visualization needed | ACCEPTED* | Retain; define command-surface information hierarchy. |
| REQ-UX-003 | Critical invariant | Correct | Must be technically enforced | AI UI must not self-authorize | ACCEPTED | Retain unchanged; make a hard architectural invariant. |
| REQ-UX-004 | Correct | Demo/live distinction needs canonical state | Prevent misleading status | AI-generated evidence must be labeled | ACCEPTED | Retain; require machine-readable environment/evidence state. |

## 4. Cross-cutting blockers

The following issues are **P0 review blockers** and must be resolved before Requirements Baseline v1.0 approval:

- **RB-001 — Boundary Model:** capability + data + identity + evidence classification for Public vs Enterprise Core.
- **RB-002 — Identity Model:** human/service/AI-agent identity lifecycle and authorization model.
- **RB-003 — AFAGHX System of Record:** authoritative domains, replication, conflict, lifecycle, and audit contract.
- **RB-004 — Regional Operations:** Iran/China connectivity, availability, localization, jurisdiction, and failure assumptions.
- **RB-005 — AI Action Governance:** risk tiers, approval, authorization, execution state, and evidence correlation.
- **RB-006 — Evidence State Machine:** authoritative states, transitions, owners, and proof requirements.
- **RB-007 — Reliability Targets:** measurable SLO/RTO/RPO and recovery requirements.
- **RB-008 — Traceability:** every P0 requirement must map to architecture owner and verification method.

## 5. Four-team disposition

**T1:** Challenge accepted. Architecture cannot be finalized until the boundary, identity, data authority, and runtime contracts are explicit.

**T2:** Challenge accepted. Business/domain capabilities and Iran/China operating constraints require explicit acceptance criteria.

**T3:** Challenge accepted. Security, governance, evidence, and reliability requirements require testable controls rather than principles alone.

**T4:** Challenge accepted. AI must have explicit authority boundaries and evidence-backed execution semantics; broad AI wording is insufficient for architecture approval.

## 6. Review verdict

**Requirements v0.1 → REVIEWED WITH REQUIRED REVISIONS**

`Requirements Review = OPEN`  
`Requirements Baseline v1.0 = NOT APPROVED`  
`Architecture Finalization = BLOCKED BY REQUIREMENTS`  
`Production Gate = BLOCKED`

## 7. Next controlled action

Create **Requirements Baseline v0.2** containing only the accepted corrections and explicit acceptance criteria for RB-001 through RB-008. Do not start Architecture Baseline v1.0 until the P0 blockers are closed or formally accepted as architecture-level exceptions by the governance authority.
