# Architecture Closure — VERIFIER-001 / VERIFIER-002

Status: CLOSURE IMPLEMENTED — pending verifier execution

## VERIFIER-001 — ADR status single source of truth

The canonical ADR status source is `docs/architecture/DECISION_LOG.md`.

`docs/architecture/ADR-INDEX.md` is an index/catalog only and MUST NOT independently assert a conflicting lifecycle status.

Machine-verifiable rule:

1. Parse every ADR identifier from ADR-INDEX.
2. Resolve its canonical status from DECISION_LOG.
3. Fail if an ADR is missing from DECISION_LOG.
4. Fail if ADR-INDEX contains a lifecycle status that differs from DECISION_LOG.
5. Fail on duplicate canonical status records for the same ADR.

Therefore there is exactly one authoritative status source: DECISION_LOG.

## VERIFIER-002 — A3 protocol implementation state

A3 protocol state is represented as four independent, machine-verifiable dimensions:

- `decision`: architectural protocol decision and selected protocol.
- `implementation`: repository/runtime implementation state.
- `credential_status`: whether required credentials/configuration are provisioned; secret values are never stored here.
- `ratification`: formal governance approval state.

A3 MUST NOT be considered fully closed unless all four dimensions are explicitly present and individually verified.

The verification contract is:

`decision != implementation != credential_status != ratification`

These dimensions are evidence fields, not UI assertions. Missing or ambiguous state remains BLOCKED/UNVERIFIED.

## Closure rule

VERIFIER-001 and VERIFIER-002 may transition to PASS only after the repository verifier independently parses and validates the canonical sources and records the result against the current commit.
