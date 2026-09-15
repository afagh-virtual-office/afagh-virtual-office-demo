# AFAGH Virtual Office — Final Target Architecture v1.0

**Architecture status:** FINAL TARGET ARCHITECTURE / DESIGN AUTHORITY  
**Implementation status:** CONTROLLED IMPLEMENTATION; Production GO remains evidence-gated  
**Scope:** AFAGH Central Office AI Virtual Office for customer, supplier, importer, producer, commerce, communication, workforce and governed AI operations across Iran and China.

## 1. Executive Decision

AFAGH Virtual Office is not a website, call center, CRM, chatbot, or collection of independent modules.

It is an **AI-native digital office and operational system for the AFAGH central office**. Its purpose is to allow the AFAGH organization to receive demand, understand customers and commercial actors, communicate through approved channels, coordinate human and AI workforce, perform governed business analysis, execute authorized actions, and continuously produce auditable evidence.

The system shall be built around one operational loop:

```text
CUSTOMER / BUSINESS ACTOR
        ↓
IDENTITY + CONTEXT
        ↓
INTENT / DEMAND
        ↓
AI ANALYSIS
        ↓
RECOMMENDATION
        ↓
DECISION PROPOSAL
        ↓
POLICY + AUTHORIZATION
        ↓
WORKFORCE / ROUTING
        ↓
APPROVED ACTION
        ↓
COMMUNICATION / BUSINESS EXECUTION
        ↓
RESULT
        ↓
EVIDENCE + AUDIT
        ↓
INTELLIGENCE FEEDBACK
```

This loop is the primary architectural spine. Every major capability must connect to it.

## 2. Business Mission

The Virtual Office shall operate as the digital central office of AFAGH and support at minimum:

- customer acquisition and relationship operations;
- producer and importer discovery and qualification;
- product and market intelligence;
- customer/business 360 context;
- outbound and inbound communication;
- sales, sourcing, inquiry and follow-up workflows;
- human workforce and AI workforce orchestration;
- controlled advertising and campaign execution;
- evidence, governance and audit;
- Iran/China regional operation with controlled degradation and isolation.

The target operating model is **one office, many channels, one governed intelligence and execution core**.

## 3. Communication Operating System

Communication is an operating capability, not a presentation page.

```text
                    AFAGH AI OPERATING SYSTEM
                              │
                     COMMUNICATION CORE
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
      VOICE                 MESSAGING             EMAIL
   Cloud Number          Approved Channels      SMTP/API
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                     COMMUNICATION ENGINE
                  Routing / Queue / Campaign
                              │
                 AFAGHX Identity + Context
                              │
                    Policy / Authorization
                              │
                  Human + AI Workforce
                              │
                     Audit + Evidence
```

### Channel adapters

The architecture provides adapter boundaries for:

1. Cloud telephony / organizational numbers / SIP / WebRTC
2. Email
3. SMS
4. Telegram
5. WhatsApp
6. Instagram
7. Shad
8. Bale
9. Rubika
10. Future approved channels

Each provider/channel shall be implemented behind a **Channel Adapter Contract**. Provider credentials, tokens and secrets must never be embedded in the frontend, public repository, prompts, or evidence artifacts.

The system shall support inbound, outbound, routing, queueing, campaign orchestration, delivery status, retry, failure and escalation where the provider and applicable policy permit.

### Advertising boundary

Advertising is a governed business action. Bulk or promotional messaging must be subject to applicable consent, opt-out, platform rules, frequency controls, regional policy, campaign authorization and audit requirements. The AI may recommend a campaign but must not bypass those controls.

## 4. AI Business Intelligence and Combined Product Psychology

The phrase **combined product psychology** is interpreted as a structured commercial intelligence capability, not unrestricted psychological profiling.

The system shall combine:

- product characteristics;
- producer/importer business profile;
- price and commercial signals;
- supply and demand signals;
- channel behavior;
- historical interactions;
- campaign responses;
- geography/region;
- customer journey stage;
- market and competitor context;
- explicit preferences and declared business needs.

The resulting intelligence layer shall answer questions such as:

- Which producer/importer is commercially relevant for a target product?
- Which products show demand/supply opportunity?
- Which business actors are likely to need follow-up?
- Which channel and timing are appropriate under policy?
- Which message or offer is relevant to a business objective?
- What is the next recommended action?

**Prohibited architectural assumption:** infer sensitive personal traits or use covert/manipulative psychological targeting as a shortcut. The system remains focused on legitimate business/commercial signals, declared preferences, contextual behavior and explainable recommendations.

## 5. Customer / Producer / Importer 360

The core business record model shall converge around an authoritative identity/context layer:

```text
PERSON
ORGANIZATION
PRODUCER
IMPORTER
CUSTOMER
SUPPLIER
AGENT
AI AGENT
SERVICE IDENTITY
        ↓
AFAGHX IDENTITY / ENTITY RESOLUTION
        ↓
BUSINESS 360 / CUSTOMER 360
        ↓
INTERACTIONS + TRANSACTIONS + EVIDENCE
```

No channel may create an isolated identity that bypasses the authoritative identity/context layer.

## 6. AI Workforce

AI agents are workers inside the Virtual Office, not unrestricted autonomous administrators.

Agent lifecycle:

```text
Observe
  ↓
Understand
  ↓
Recommend
  ↓
Propose
  ↓
Policy Check
  ↓
Authorization
  ↓
Execute Approved Action
  ↓
Verify Result
  ↓
Create Evidence
```

Low-risk automated actions may be executed according to approved policy. Consequential actions must follow explicit authorization and human-approval rules defined by the action risk tier.

## 7. Central Command Surface

The existing homepage/dashboard is retained as the approved **operational command surface**. It shall not be redesigned as a generic dashboard.

Its responsibility is to expose the operating system state and provide controlled entry points into:

- AI Command;
- Missions;
- Workforce;
- Business 360;
- Operations;
- Communication;
- Governance;
- Evidence.

The visual layer is downstream of runtime truth.

## 8. Missions and Operational Orchestration

A user command or business trigger becomes a Mission.

```text
COMMAND
  ↓
MISSION
  ↓
PLAN
  ↓
TASKS
  ↓
AGENT / HUMAN ASSIGNMENT
  ↓
POLICY
  ↓
AUTHORIZATION
  ↓
EXECUTION
  ↓
RESULTS
  ↓
EVIDENCE
```

A Mission must have an explicit identity, tenant/workspace context, state, owner, correlation ID, policy context, action history and evidence references.

This is the capability required to turn the current operational surface into a true operating system.

## 9. Trust, Security and Governance

The architecture remains fail-closed.

Required principles:

- explicit authentication and session context;
- tenant/workspace isolation;
- deny-by-default authorization;
- policy decision before consequential action;
- secret-reference boundary;
- auditability;
- evidence integrity and lifecycle;
- replay/idempotency protection;
- regional controls;
- controlled failure and recovery;
- human approval where required.

Current P0-1 identity architecture uses Microsoft Entra ID with PKCE S256, persistent state, nonce validation and explicit tenant/workspace selection.

## 10. Evidence System

Evidence is part of the runtime, not decoration.

Every consequential flow should produce a traceable chain:

```text
INTENT
 → DECISION
 → POLICY
 → AUTHORIZATION
 → ACTION
 → EXECUTION
 → RESULT
 → EVIDENCE
```

Evidence states remain truthful. `CONTROLLED`, `UNVERIFIED`, `UNKNOWN`, and `BLOCKED` must never be silently promoted to production `PASS`.

Cryptographic or independent verification must be performed before evidence is treated as release-grade verification.

## 11. Regional Operation: Iran + China

The system is designed for dual-region business operation.

Each regional profile must define:

- permitted channels;
- data handling/residency rules;
- provider dependencies;
- operational mode;
- degraded/isolated behavior;
- retry/failover rules;
- evidence continuity;
- recovery ordering.

Possible runtime states:

`NORMAL → DEGRADED → ISOLATED → RECOVERING → NORMAL`

The system must fail safely without inventing successful communication or execution.

## 12. Layered System Architecture

```text
┌──────────────────────────────────────────────────────┐
│ PRODUCT EXPERIENCE                                   │
│ Command Surface / Workspaces / Customer Interaction │
├──────────────────────────────────────────────────────┤
│ OPERATING APPLICATIONS                               │
│ CRM / Business 360 / Commerce / Communication      │
│ Campaigns / Workflow / Missions                     │
├──────────────────────────────────────────────────────┤
│ AI + WORKFORCE RUNTIME                               │
│ Agents / Intent / Recommendation / Planning         │
│ Human Workforce / Assignment / Escalation           │
├──────────────────────────────────────────────────────┤
│ GOVERNED ACTION RUNTIME                              │
│ Policy / Authorization / Tool Contracts / Risk      │
│ Approval / Idempotency / Transaction Boundary       │
├──────────────────────────────────────────────────────┤
│ IDENTITY + CONTEXT                                   │
│ AFAGHX / Tenant / Workspace / Organization / Actor  │
├──────────────────────────────────────────────────────┤
│ COMMUNICATION + EVENT FABRIC                         │
│ Voice / Email / SMS / Social Adapters / Events      │
├──────────────────────────────────────────────────────┤
│ DATA + EVIDENCE                                      │
│ PostgreSQL / Transactions / Outbox / Audit / Proof   │
├──────────────────────────────────────────────────────┤
│ CLOUD / PLATFORM / RELIABILITY                       │
│ Runtime / Observability / Backup / Recovery / SRE   │
└──────────────────────────────────────────────────────┘
```

## 13. Architecture Law

The following are binding:

1. The Virtual Office is the product; individual pages are workspaces or surfaces.
2. AI is the runtime decision layer, not a cosmetic assistant.
3. Communication is an operational fabric, not a call-center mockup.
4. Business intelligence must connect customer, product, producer, importer, supply, demand and interaction evidence.
5. Every consequential AI action passes through policy and authorization.
6. Evidence is generated from execution and never fabricated by UI.
7. Public access, public data and enterprise access are separate concepts.
8. Frontend code never owns secrets or authoritative business truth.
9. Provider integrations use replaceable adapter boundaries.
10. Production status is earned through machine-verifiable evidence.

## 14. Final Acceptance Position

This document establishes the **final target architecture** for AFAGH Virtual Office v1.0.

It supersedes the previous narrow interpretation of the product as primarily a dashboard, CRM or communication center.

Implementation shall proceed against this architecture without redesigning the approved dashboard baseline.

The architecture is final; production authorization remains conditional on closure of the project release gates and evidence requirements.

**Architecture decision:** APPROVED AS TARGET ARCHITECTURE  
**Production release decision:** NOT YET AUTHORIZED
