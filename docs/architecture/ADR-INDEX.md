# AFAGH Architecture Decision Index

Status: AUTHORITATIVE
Owner: Four-Team Architecture Council

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | AFAGH is an AI-Native Operating System; AI Core is a system plane, not a feature. | ACCEPTED |
| ADR-002 | Product shell/UI is separated from runtime and cannot claim verification without runtime evidence. | ACCEPTED |
| ADR-003 | Business Context is authoritative input to intelligence, decisions and operations. | ACCEPTED |
| ADR-004 | AI actions require policy and authorization before execution. | ACCEPTED |
| ADR-005 | Action without audit/evidence is not production-verifiable. | ACCEPTED |
| ADR-006 | Authentication uses OIDC/OAuth 2.0 with PKCE, state, nonce and fail-closed validation. | ACCEPTED |
| ADR-007 | Tenant/workspace isolation is enforced at authorization and data-query boundaries. | ACCEPTED |
| ADR-008 | Communication OS uses PostgreSQL persistence and versioned transactional migrations. | ACCEPTED |
| ADR-009 | Production status changes only from machine/runtime evidence; no UI or document can self-certify production readiness. | ACCEPTED |
| ADR-010 | Public repository contains only public-safe code/contracts/demo data; secrets and private enterprise data stay outside Git. | ACCEPTED |
