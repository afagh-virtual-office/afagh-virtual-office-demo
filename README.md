# AFAGH Virtual Office — Public Demo / Sandbox

This repository is the public product-experience sandbox for AFAGH Virtual Office.

## Important boundary

- Canonical architecture repository: `afagh-virtual-office/afagh-virtual-office`
- This repository is **not** the production system.
- The product shell is functional as a static application experience.
- Evidence shown in the dashboard is a **controlled snapshot**, not live telemetry.
- Gate 1 remains **NOT PASSED** and production implementation remains **BLOCKED** until the canonical architecture gate is formally approved.

## Product shell

Navigation currently covers:

- Central Dashboard
- Architecture
- Organizations
- Business 360
- AI Workforce
- Workflow
- Trust & Security
- Evidence Center
- Governance

The dashboard deliberately fails closed: missing or unavailable evidence becomes `UNKNOWN`, and unresolved blockers remain visible.
