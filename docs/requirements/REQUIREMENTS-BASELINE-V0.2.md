# AFAGH AI Operating System — Requirements Baseline v0.2

**Document ID:** REQ-BASELINE-002  
**Supersedes:** REQ-BASELINE-001 v0.1  
**Review source:** REQ-REVIEW-V1-001  
**Status:** DRAFT — P0 BLOCKERS ADDRESSED FOR RE-REVIEW  
**Classification:** Public-safe architectural boundary  

> This document refines the public-safe requirements boundary only. Confidential identity configuration, infrastructure details, security configuration, credentials, internal policies, and operational secrets remain outside this public repository.

## 1. System boundary

AFAGH AI Operating System is a cloud-native, Internet-based platform with **controlled Public capabilities** and a **protected Private Enterprise Core** for the AFAGH ecosystem.

**Hard invariant:** Public Access ≠ Public Data ≠ Enterprise Access.

Every capability, data class, identity class, and evidence class MUST have an explicit exposure classification before production architecture approval.

Allowed classifications:
- `PUBLIC` — intentionally available without enterprise authorization.
- `PROTECTED` — requires authenticated/authorized access.
- `ENTERPRISE_CORE` — restricted to approved AFAGH organizational contexts.
- `RESTRICTED` — security/governance-sensitive; access and handling are explicitly controlled.

The public demo repository MUST NOT become the authoritative source for restricted implementation details.

## 2. RB-001 — Public / Private Boundary

### Requirements

**REQ-BND-001 (P0):** Every capability SHALL declare an exposure class: PUBLIC, PROTECTED, ENTERPRISE_CORE, or RESTRICTED.

**REQ-BND-002 (P0):** Every data object/domain SHALL declare a data exposure class independently of the capability exposing it.

**REQ-BND-003 (P0):** Enterprise authorization SHALL be enforced server-side and SHALL NOT be inferred from UI visibility, URL obscurity, or client state.

**REQ-BND-004 (P0):** Public interfaces SHALL NOT expose enterprise-only data, credentials, authorization evidence, or restricted operational metadata.

**REQ-BND-005 (P0):** Public and enterprise communication/action surfaces SHALL have explicit access-policy boundaries.

### Acceptance criteria

- A capability/data/access matrix exists before architecture approval.
- At least one negative test proves a public context cannot access an ENTERPRISE_CORE resource.
- UI state cannot change exposure or authorization state.

## 3. RB-002 — Identity Model

### Requirements

**REQ-ID-001 (P0):** The platform SHALL distinguish at minimum human identities, service identities, and AI-agent identities.

**REQ-ID-002 (P0):** Authentication assurance SHALL be defined by access-risk class; higher-risk enterprise actions SHALL require stronger assurance where applicable.

**REQ-ID-003 (P0):** Authorization SHALL be server-side, least-privilege, deny-by-default, and based on authenticated identity plus organizational/resource context.

**REQ-ID-004 (P0):** Human, service, and agent identities SHALL have lifecycle states including provisioning, active, suspended/revoked, and retired.

**REQ-ID-005 (P0):** Service and agent identities SHALL NOT inherit authority implicitly from a human identity or from possession of a contact identifier.

**REQ-ID-006 (P0):** Every material authorization decision SHALL produce a correlation/decision identifier and auditable evidence.

**REQ-ID-007 (P1):** Emergency/break-glass access, where required, SHALL be explicitly authorized, time-bounded, monitored, and audited.

### Acceptance criteria

- Human, service, and agent authorization paths are separately testable.
- Cross-context denial is provable.
- Credential/token material is absent from UI, client logs, and evidence payloads.

## 4. RB-003 — AFAGHX System of Record

### Requirements

**REQ-SOR-001 (P0):** AFAGHX SHALL be the authoritative source for designated ecosystem identity/contact domains where that authority is formally assigned.

**REQ-SOR-002 (P0):** Each authoritative data domain SHALL have one declared system of record and one accountable owner.

**REQ-SOR-003 (P0):** Virtual Office replicas, caches, indexes, and projections SHALL be explicitly classified as derived/non-authoritative unless formally designated otherwise.

**REQ-SOR-004 (P0):** Synchronization SHALL define ownership, mapping, lifecycle, update semantics, retry, failure handling, conflict resolution, reconciliation, and audit behavior.

**REQ-SOR-005 (P0):** A mobile number or other contact identifier SHALL NOT by itself establish identity, organizational authority, or authorization.

**REQ-SOR-006 (P1):** AI identity resolution SHALL preserve source lineage and SHALL NOT silently convert inferred matches into authoritative identity records.

### Acceptance criteria

- An authority matrix exists for identity/contact domains.
- A conflict case has a deterministic owner and reconciliation path.
- Derived data can be traced back to its authoritative source.

## 5. RB-004 — Iran / China Regional Operations

### Requirements

**REQ-REG-001 (P0):** The platform SHALL define regional operating assumptions for Iran and China before production architecture approval.

**REQ-REG-002 (P0):** Regional design SHALL explicitly address connectivity variability, service dependency failure, latency, availability, and degraded operation.

**REQ-REG-003 (P0):** Data handling SHALL identify applicable jurisdiction, residency, transfer, retention, and localization constraints before production deployment.

**REQ-REG-004 (P0):** Regional failure SHALL NOT silently bypass authorization, audit, or evidence controls.

**REQ-REG-005 (P1):** Critical workflows SHALL define an approved degraded-mode behavior and recovery/reconciliation path.

**REQ-REG-006 (P1):** AI dependencies SHALL define failure behavior and whether actions are blocked, queued, retried, or safely degraded.

### Acceptance criteria

- A regional constraint matrix exists for Iran and China.
- At least one connectivity/dependency degradation scenario is tested.
- Recovery does not create duplicate, unauthorized, or unaudited actions.

## 6. RB-005 — AI Action Governance

### Requirements

**REQ-ACT-001 (P0):** AI capabilities SHALL distinguish recommendation, decision proposal, approved action, execution, and completion states.

**REQ-ACT-002 (P0):** AI actions SHALL be assigned risk tiers based on impact, reversibility, data sensitivity, and authority required.

**REQ-ACT-003 (P0):** High-risk or irreversible actions SHALL require an explicit human approval step unless a formally ratified policy permits autonomous execution.

**REQ-ACT-004 (P0):** Every AI action SHALL execute under an identifiable agent/service identity and explicit authorization context.

**REQ-ACT-005 (P0):** AI tool access SHALL use isolated credentials/authority and SHALL NOT expose secrets to model context or user-facing UI.

**REQ-ACT-006 (P0):** Recommendation, authorization, execution, and evidence SHALL share correlation identifiers sufficient to reconstruct the action chain.

**REQ-ACT-007 (P0):** An AI agent SHALL NOT self-authorize an action merely because it generated the recommendation.

### Acceptance criteria

- Risk-tier matrix exists.
- At least one denied AI action and one approved/executed action are traceable end-to-end.
- Recommendation and execution are visibly and machine-readably distinct.

## 7. RB-006 — Evidence State Machine

### Requirements

**REQ-EVD-001 (P0):** Evidence status SHALL be machine-readable and controlled by an authoritative verification process.

**REQ-EVD-002 (P0):** The minimum platform evidence vocabulary SHALL preserve truthful states including `PASS`, `BLOCKED`, `UNKNOWN`, `UNVERIFIED`, `CONTROLLED`, and `NOT_LIVE` where applicable.

**REQ-EVD-003 (P0):** Every transition into `PASS` SHALL require defined verification evidence; UI interaction SHALL never directly create a PASS state.

**REQ-EVD-004 (P0):** Evidence SHALL identify its source, subject/scope, timestamp, integrity status, and correlation identifiers as applicable.

**REQ-EVD-005 (P0):** Ownership of evidence creation, verification, and state transition SHALL be distinct where required by governance.

**REQ-EVD-006 (P0):** Unverified or controlled-demo evidence SHALL never be represented as live production proof.

### Acceptance criteria

- State transition rules are documented and machine-readable.
- A false/manual PASS attempt is rejected.
- Evidence can be traced to the verification event that produced it.

## 8. RB-007 — Reliability Targets

**Important:** Exact numerical targets are intentionally left as architecture/business decisions until workload, criticality, regional constraints, and cost are approved. This baseline requires the targets to exist; it does not invent them.

### Requirements

**REQ-REL-001 (P0):** Each production-critical service/workflow SHALL have an approved availability SLO.

**REQ-REL-002 (P0):** Each critical data/workflow class SHALL have approved RTO and RPO targets.

**REQ-REL-003 (P0):** Recovery objectives SHALL account for regional connectivity and critical external dependency failure.

**REQ-REL-004 (P0):** Production deployment SHALL support controlled rollback and SHALL identify the deployed build/version.

**REQ-REL-005 (P1):** Health, logging, monitoring, backup, recovery, and incident-response requirements SHALL be defined before production approval.

**REQ-REL-006 (P1):** AI-dependent workflows SHALL define safe behavior when an AI provider/model/tool is unavailable or degraded.

### Acceptance criteria

- SLO/RTO/RPO matrix exists and is approved.
- Rollback is testable.
- At least one critical dependency failure and one recovery scenario are verified.

## 9. RB-008 — Complete P0 Traceability

**REQ-TRC-001 (P0):** Every P0 requirement SHALL map to an architecture owner.

**REQ-TRC-002 (P0):** Every P0 requirement SHALL map to at least one verification method.

**REQ-TRC-003 (P0):** Every verification result SHALL identify its evidence source and runtime/build context where applicable.

**REQ-TRC-004 (P0):** A P0 requirement with no credible verification path SHALL remain `OPEN` or `BLOCKED` and SHALL prevent Requirements v1.0 approval.

**REQ-TRC-005 (P0):** Traceability SHALL follow: Requirement → Architecture Decision → Component/Boundary → Verification → Evidence.

### Acceptance criteria

- A P0 traceability matrix covers all P0 requirements.
- Missing mappings fail the requirements gate.
- The matrix distinguishes planned verification from executed verification.

## 10. Refined existing requirements

The following baseline principles remain mandatory and are strengthened by this revision:

- Unified operating experience across business, operations, workforce, intelligence, governance, and evidence.
- Controlled public capabilities with protected enterprise core.
- Internet/cloud operation across approved regional contexts.
- Server-side identity, authorization, tenant/workspace/resource isolation.
- AFAGHX authority for designated identity/contact domains.
- AI as a runtime operating capability, not merely a conversational feature.
- Think / Decide / Execute semantics with evidence-backed actions.
- UI as a presentation/control surface only; it cannot alter architecture, gate, evidence, blocker, or verification truth.
- Explicit distinction between controlled demo evidence and live production evidence.

## 11. P0 gate for Requirements v1.0

Requirements v1.0 MUST NOT be approved until:

1. RB-001 through RB-008 have explicit acceptance evidence.
2. All P0 requirements have architecture owners.
3. All P0 requirements have credible verification methods.
4. Four-team review has no unresolved `REVISE` or `BLOCKED` P0 item.
5. Any exception is explicitly documented and ratified by the governance authority.
6. No public repository content discloses restricted implementation/security information.

**Current status:** `NOT APPROVED`  
**Requirements Review:** `OPEN — RE-REVIEW REQUIRED`  
**Architecture Finalization:** `BLOCKED`  
**Production Gate:** `BLOCKED`

## 12. Traceability seed

| Blocker | Primary requirement family | Architecture owner | Verification | Status |
|---|---|---|---|---|
| RB-001 | REQ-BND-* | Architecture / Security | Boundary matrix + negative tests | OPEN |
| RB-002 | REQ-ID-* | Identity / Security | AuthN/AuthZ lifecycle tests | OPEN |
| RB-003 | REQ-SOR-* | Data / Integration | Authority + reconciliation tests | OPEN |
| RB-004 | REQ-REG-* | Platform / Operations | Regional failure/recovery tests | OPEN |
| RB-005 | REQ-ACT-* | AI / Security | Risk + approval + execution tests | OPEN |
| RB-006 | REQ-EVD-* | Governance / Verification | State-machine verification | OPEN |
| RB-007 | REQ-REL-* | Platform / Operations | SLO/RTO/RPO + DR tests | OPEN |
| RB-008 | REQ-TRC-* | Architecture Governance | Traceability gate | OPEN |

**Review rule:** v0.2 is a refined candidate, not an approval. Four-team re-review is mandatory before Requirements v1.0.
