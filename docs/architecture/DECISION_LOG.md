# AFAGH Decision Log

## ADR-001 — AI-Native Operating System
Decision: AFAGH is an AI-Native Operating System; the AI Core is a system plane, not a feature.
Authority: T1/T2/T3/T4
Status: ACCEPTED

## ADR-002 — Product Shell Separation
Decision: Product shell/UI is separated from runtime and cannot claim verification without runtime evidence.
Authority: T1/T2/T3/T4
Status: ACCEPTED

## ADR-003 — Business Context Authority
Decision: Business Context is authoritative input to intelligence, decisions and operations.
Authority: T1/T2/T3/T4
Status: ACCEPTED

## ADR-004 — Governed AI Actions
Decision: AI actions require policy and authorization before execution.
Authority: T1/T3/T4
Status: ACCEPTED

## ADR-005 — Audit and Evidence Requirement
Decision: Action without audit/evidence is not production-verifiable.
Authority: T1/T3/T4
Status: ACCEPTED

## ADR-006 — Authentication Protocol
Decision: Authentication uses OIDC/OAuth 2.0 with PKCE, state, nonce and fail-closed validation.
Authority: T1/T3/T4
Status: ACCEPTED

## ADR-007 — Tenant and Workspace Isolation
Decision: Tenant/workspace isolation is enforced at authorization and data-query boundaries.
Authority: T1/T3/T4
Status: ACCEPTED

## ADR-008 — Communication OS Persistence
Decision: Communication OS uses PostgreSQL persistence and versioned transactional migrations.
Authority: T1/T2/T3/T4
Status: ACCEPTED

## ADR-009 — Machine-Verifiable Production Status
Decision: Production status changes only from machine/runtime evidence; no UI or document can self-certify production readiness.
Authority: T1/T3/T4
Status: ACCEPTED

## ADR-010 — Public Repository Safety Boundary
Decision: Public repository contains only public-safe code/contracts/demo data; secrets and private enterprise data stay outside Git.
Authority: T1/T3/T4
Status: ACCEPTED

## D-2026-09-01 — Homepage and Dashboard Baseline
Decision: AFAGH AI Operating System Dashboard is the approved visual baseline. No card-wall redesign.
Authority: T1/T2/T3/T4
Status: LOCKED

## D-2026-09-02 — Product Story
Decision: AI → Context → Intelligence → Decision → Workforce → Operations → Governance → Evidence → Intelligence.
Authority: T1/T2/T3/T4
Status: LOCKED

## D-2026-09-03 — AI Action Governance
Decision: AI does not directly own sensitive execution. Intent → Recommendation → Decision Proposal → Policy → Authorization → Approved Action → Execution → Event → Evidence.
Authority: T1/T3/T4
Status: LOCKED

## D-2026-09-04 — Communication OS
Decision: Communication is an enterprise operating layer, not a decorative call-center UI.
Authority: T1/T2/T3/T4
Status: LOCKED

## D-2026-09-05 — Production Truthfulness
Decision: Runtime, migration, auth and evidence gates are fail-closed. No PASS without recorded verification evidence.
Authority: T1/T3
Status: LOCKED

## D-2026-09-14 — Runtime Database Binding
Decision: Communication OS must bind DATABASE_URL through Render managed database linkage, not a manually invented hostname/reference.
Authority: T1/T3
Status: IMPLEMENTED
