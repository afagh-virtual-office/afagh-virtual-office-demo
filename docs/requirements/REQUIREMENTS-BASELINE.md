# AFAGH AI Operating System — Requirements Baseline

**Document ID:** REQ-BASELINE-001  
**Version:** 0.1  
**Status:** DRAFT — REQUIREMENTS BASELINE  
**Classification:** Public-safe architectural boundary  
**Repository:** `afagh-virtual-office/afagh-virtual-office-demo`

> This document defines the public-safe requirements boundary for the AFAGH AI Operating System product experience. Confidential implementation, identity, contact, infrastructure, policy, and security details belong in the canonical private architecture repository and must not be stored in this public demo repository.

## 1. System Definition

AFAGH AI Operating System is a cloud-native, Internet-based platform with controlled public capabilities and a protected enterprise operating core for the AFAGH ecosystem.

The system SHALL distinguish between:

- **Public Experience** — intentionally public capabilities and information.
- **Enterprise Core** — protected capabilities available only to authorized users and services.

Public availability SHALL NOT imply public access to enterprise data, operations, identity, governance, or evidence.

## 2. Strategic Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-BIZ-001 | The platform SHALL provide a unified operating experience for AFAGH business, operational, workforce, intelligence, and governance capabilities. | P0 |
| REQ-BIZ-002 | The platform SHALL support controlled public capabilities while protecting the enterprise operating core. | P0 |
| REQ-BIZ-003 | The architecture SHALL support AFAGH operations across Iran and China through Internet/cloud connectivity. | P0 |
| REQ-BIZ-004 | The platform SHALL integrate with the AFAGH ecosystem rather than create unnecessary parallel sources of truth. | P0 |

## 3. Identity & Access Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-ACC-001 | Protected enterprise capabilities SHALL require authenticated and authorized access. | P0 |
| REQ-ACC-002 | Authorization SHALL be evaluated server-side. | P0 |
| REQ-ACC-003 | Tenant/workspace boundaries SHALL be enforced server-side where applicable. | P0 |
| REQ-ACC-004 | Identity, session, authorization, and audit decisions SHALL be traceable to evidence. | P0 |
| REQ-ACC-005 | Credentials, tokens, and secret material SHALL NOT be exposed to the public product UI. | P0 |

## 4. AFAGHX Integration Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-DATA-001 | AFAGHX SHALL remain the authoritative source for ecosystem identity/contact data where designated by architecture. | P0 |
| REQ-DATA-002 | AFAGH OS SHALL avoid creating conflicting authoritative copies of identity/contact data. | P0 |
| REQ-DATA-003 | Synchronization SHALL define ownership, mapping, lifecycle, conflict, and audit rules before production use. | P0 |
| REQ-DATA-004 | A mobile number SHALL be treated as a contact identifier and SHALL NOT by itself grant identity or authorization. | P0 |

## 5. Communication Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-COM-001 | The platform SHALL support authorized communication between people and organizations within defined policy boundaries. | P1 |
| REQ-COM-002 | Communication capabilities SHALL respect identity, authorization, privacy, and audit requirements. | P0 |
| REQ-COM-003 | Public and enterprise communication surfaces SHALL have explicit access boundaries. | P0 |

## 6. AI Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-AI-001 | AI SHALL be treated as a runtime operating capability, not only as a conversational feature. | P0 |
| REQ-AI-002 | AI capabilities SHALL support Think, Decide, Execute, Missions, Agents, and Intelligence as architecture permits. | P1 |
| REQ-AI-003 | Sensitive AI actions SHALL pass through authorization and produce auditable evidence. | P0 |
| REQ-AI-004 | The system SHALL distinguish AI recommendations from executed actions. | P0 |

## 7. Governance & Evidence Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-GOV-001 | Architecture decisions SHALL be recorded in authoritative architecture sources. | P0 |
| REQ-GOV-002 | Material system decisions and security-sensitive actions SHALL be auditable. | P0 |
| REQ-GOV-003 | Verification status SHALL reflect actual evidence and SHALL NOT be manually promoted to PASS without proof. | P0 |
| REQ-GOV-004 | The system SHALL preserve explicit states such as PASS, BLOCKED, UNKNOWN, UNVERIFIED, CONTROLLED, and NOT LIVE where applicable. | P0 |

## 8. Reliability & Operations Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-OPS-001 | Public demo, staging, and production environments SHALL be distinguishable. | P0 |
| REQ-OPS-002 | Production deployment SHALL use controlled configuration and secret management. | P0 |
| REQ-OPS-003 | Health, logging, monitoring, deployment, rollback, backup, and recovery requirements SHALL be defined before production approval. | P1 |

## 9. Product Experience Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-UX-001 | The product experience SHALL remain premium, intelligent, operational, and trustworthy. | P1 |
| REQ-UX-002 | The main dashboard SHALL function as a Visual Command Surface rather than a collection of disconnected cards. | P1 |
| REQ-UX-003 | UI presentation SHALL NOT modify architecture, gate, evidence, blocker, or verification source-of-truth state. | P0 |
| REQ-UX-004 | Controlled/demo evidence SHALL be visibly distinguished from live production evidence. | P0 |

## 10. Traceability Rule

Every P0 requirement SHALL ultimately trace through:

`Requirement → Architecture Decision → Component/Boundary → Verification → Evidence`

A P0 requirement without an architecture owner or verification path is **OPEN**, not complete.

## 11. Gate Policy

This baseline does not approve production implementation by itself.

Production readiness requires, at minimum:

1. Requirements baseline approved.
2. Architecture baseline approved.
3. ADRs ratified.
4. Security and identity model verified.
5. Runtime verification executed.
6. Required evidence produced.
7. No unresolved P0 blocker.

**Current status: NOT APPROVED / REQUIREMENTS DRAFT.**
