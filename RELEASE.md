# AFAGH Virtual Office — Final Bilingual Control Plane Release

**Release:** `v2.0.0-final-ui`
**Repository:** `afagh-virtual-office/afagh-virtual-office-demo`
**Scope:** Bilingual Persian/English Control Plane UI and evidence-driven presentation layer.

## Four-team governance review

### Team 1 — Architecture & Technology
- Confirmed the UI remains downstream of Evidence and Gate data.
- Confirmed the 10 architecture axes are presentation views, not independent architecture truth.
- Confirmed no UI control is allowed to mutate architecture status.

**Decision:** UI architecture accepted for this release scope.

### Team 2 — Domain / Business / Trade
- Confirmed navigation covers the intended operating model: Organizations, Business 360, AI Workforce, Workflow, Trust & Security, Evidence Center, and Governance.
- Confirmed the Control Tower presents the architecture as an operating model rather than a CRM-only product.

**Decision:** Domain presentation accepted for this release scope.

### Team 3 — Security / Quality / Governance
- Confirmed controlled/demo evidence is not presented as live production proof.
- Confirmed `BLOCKED`, `PASS`, `UNKNOWN`, and `UNVERIFIED` remain machine/verification states and are not cosmetically translated.
- Confirmed release status remains fail-closed where upstream evidence is missing.

**Decision:** Governance presentation accepted; production security gate remains open.

### Team 4 — AI & Intelligence Architecture
- Confirmed AI Workforce is represented as a governed operating domain, not as an unsupported claim of live AI execution.
- Confirmed Evidence, Verification, Governance, and Release Control remain first-class surfaces for future AI agents and orchestration.

**Decision:** AI presentation accepted for this release scope.

## Final release boundary

This release is **final for the bilingual Control Plane UI scope**. It is **not a declaration that the AFAGH production architecture has passed its production release gates**.

The architecture/runtime gate remains fail-closed until the canonical architecture sources and live P0-1 verification are available. In particular, the missing canonical sources (`docs/architecture/ADR-INDEX.md`, `docs/architecture/DECISION_LOG.md`, and `docs/architecture/A3-PROTOCOL-STATE.json`) must not be fabricated.

## Non-negotiable invariants

1. Evidence first; dashboard later.
2. Visual state is never architecture proof.
3. Unverified data is never presented as proof.
4. UI cannot manually promote a Gate to PASS.
5. Production credentials and tokens are never exposed to the browser UI.
6. Architecture Source of Truth remains outside the presentation layer.
7. Release remains fail-closed when mandatory evidence is missing.

## Included

- Persian/English responsive interface.
- AFAGH visual identity and dark enterprise Control Plane.
- Global command header.
- Responsive navigation shell.
- Release Gate hierarchy.
- Evidence/Runtime/Verifier metrics.
- 10-axis Architecture Control Tower.
- Governance authority cards for four teams.
- Blocker-first presentation.
- Architecture-axis detail views.
- Data-driven rendering from the existing `data/*.json` sources.

## Status

**UI release:** FINAL

**Production release gate:** BLOCKED

**Reason:** upstream architecture/runtime evidence is not yet sufficient for a truthful production PASS.
