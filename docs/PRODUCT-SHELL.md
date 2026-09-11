# Product Shell Contract

## Purpose

Provide the first real application shell for the AFAGH Virtual Office public sandbox without pretending that demo telemetry is production telemetry.

## Navigation contract

`Dashboard -> Architecture -> Organizations -> Business 360 -> AI Workforce -> Workflow -> Trust & Security -> Evidence Center -> Governance`

## Evidence contract

The dashboard consumes `data/evidence.json` as a controlled snapshot. The snapshot identifies its source repository, reviewed HEAD, CI run, evidence sources, blockers, and non-live status.

## Fail-closed rules

1. Missing evidence renders `UNKNOWN`.
2. A blocker cannot be hidden by UI state.
3. Demo PASS values must retain their evidence context.
4. Gate 1 cannot be inferred from individual green checks.
5. Production readiness is never implied by this sandbox.

## Next integration target

Replace the controlled snapshot with a deterministically generated artifact from the canonical repository CI, while preserving the same schema and fail-closed behavior.
