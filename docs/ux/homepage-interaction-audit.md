# AFAGH Virtual Office — Homepage UX / Interaction Audit

**Baseline:** `main` at `1e24fc4dfc2b411d42f9ad9a2651ab8e7450663d`
**Scope:** existing homepage only. No conceptual redesign.
**Audit mode:** static/code audit; no claim of live runtime verification.

## Executive result

The visual architecture is coherent, but the current page is still a presentation prototype. The highest-risk interaction defects are:

1. Architecture axis interactions use `alert()` and therefore have no scalable/readable detail surface.
2. Command Search is visual-only; it accepts no input and cannot route to anything.
3. Runtime/Evidence is not connected to the homepage.
4. Navigation has no explicit keyboard/focus contract and active state is partly scroll-position driven.
5. Status semantics are mostly truthful, but several controls can look operational while remaining controlled/demo.
6. Language switching is implemented, but not every visible string participates in the bilingual contract.
7. The homepage has no explicit runtime connection state model (`LIVE`, `UNAVAILABLE`, `CONTROLLED`) separate from architecture Gate state.

## Severity

- **P0:** Runtime/Evidence absent from Command Center; therefore no live operational proof can be presented.
- **P1:** Search is non-functional despite being styled as a command interaction.
- **P1:** A1–A10 use blocking browser alerts instead of an accessible detail interaction.
- **P1:** Keyboard focus/ARIA behavior is incomplete for navigation, language, axes and status changes.
- **P2:** Bilingual coverage is incomplete for some static labels.
- **P2:** Mobile navigation is responsive but not an explicit compact navigation interaction.

## Required interaction contract

Every operational surface must declare:

`intent → request → runtime source → response schema → UI state → evidence reference → failure state`

The UI must never mutate Gate, Evidence, Verification or Architecture Source-of-Truth state.

## Fix order

1. Make search functional as a local navigation/command index while clearly labeling it controlled.
2. Replace `alert()` axis inspection with an inline accessible detail panel.
3. Add keyboard/focus semantics and `aria-live` for runtime state.
4. Add a runtime adapter with fail-closed states; do not expose credentials or tokens.
5. Bind Command Center metrics/activity to verified runtime evidence only when available.
6. Preserve `BLOCKED`, `UNKNOWN`, `UNVERIFIED`, and `CONTROLLED` until live evidence proves otherwise.

## Exit criteria

UX audit is complete when all P1 interaction defects are fixed and the interaction contract is committed. Runtime integration is complete only when the deployed runtime returns schema-conforming evidence. P0-1 is not PASS until AUTH-001 through AUTH-005 execute successfully against the same runtime boundary.
