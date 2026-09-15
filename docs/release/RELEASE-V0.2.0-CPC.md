# AFAGH AI Operating System — Release v0.2.0-CPC

**Release class:** Controlled Production Candidate
**Production release:** BLOCKED
**Date:** 2026-09-15
**Authority:** T1 / T2 / T3 / T4 governance model

## Release scope

This release freezes the current enterprise architecture and runtime foundation for the AFAGH AI Operating System demo/implementation repository.

Included:
- Approved homepage/dashboard visual baseline; no redesign.
- Architecture decision log and machine-readable architecture protocol state.
- P0-1 production authentication runtime using Microsoft Entra ID / OIDC.
- PostgreSQL-backed sessions, tenant/workspace authorization, audit, and auth evidence.
- Communication Operating System runtime with policy, authorization, AI-action fail-closed boundary, event state machine, audit, and evidence persistence.
- Versioned Communication OS database migration runner with checksum enforcement and advisory locking.
- Executable DB proof endpoint for Communication OS.
- Render deployment configuration bound to the managed PostgreSQL resource.

## Truth model

`PASS` is reserved for gates with recorded verification evidence. Runtime availability alone does not constitute database, authentication E2E, evidence-verifier, or production-release PASS.

## Current gate decision

| Gate | Decision | Evidence state |
|---|---|---|
| DB Connection | CONDITIONALLY READY | Runtime has DATABASE_URL binding and DB proof endpoint; external proof execution is not yet recorded in this release artifact. |
| Migration | CONDITIONALLY READY | Versioned migration runner is implemented and wired in repository configuration; execution evidence is not yet recorded in this release artifact. |
| DB Proof | BLOCKED | Endpoint exists, but a recorded external response proving the live database and required tables is not available to the release authority. |
| Auth E2E | BLOCKED | OIDC code, PKCE, state, nonce, tenant/workspace selection, and session controls are implemented; real Microsoft Entra sign-in/callback/membership E2E has not been executed. |
| Evidence Verification | BLOCKED | Runtime evidence is explicitly unsigned/server-generated pending an external verifier. |
| Final Production Gate | BLOCKED | A production PASS cannot be issued while any P0 verification gate remains BLOCKED. |

## Release decision

**Issued:** v0.2.0-CPC as the final controlled production candidate baseline.

**Not issued:** Production Release / Production PASS.

This is deliberate fail-closed behavior, not an implementation failure. The repository is frozen at the candidate baseline until external runtime verification evidence closes the remaining P0 gates.

## Required closure evidence

1. Live Communication OS DB proof response showing PostgreSQL connectivity, applied migration ledger, and all required communication tables.
2. Real Microsoft Entra authentication E2E: login -> callback -> ID-token validation -> authorized tenant/workspace -> session -> protected communication route.
3. External verification of stored evidence objects, including integrity and verifier authority.
4. Final four-team gate record changing the blocked states only from recorded evidence.
