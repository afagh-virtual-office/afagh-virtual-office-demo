# AFAGH Production Release Gate Architecture v1.0

**Status:** AUTHORITATIVE CONTROL CONTRACT  
**Mode:** Fail-closed / evidence-gated  
**Authority:** Four-Team Architecture Council

## 1. Purpose

Define the final, machine-verifiable separation between:

1. **Green Architecture Gate** — the architecture and its canonical control sources are internally consistent and verified.
2. **Production Authorization** — the release is formally authorized for production execution.
3. **Production Ready** — the authorized release has current runtime evidence proving operational readiness.

These states are distinct and MUST NOT be collapsed into one status.

## 2. Non-negotiable law

```text
UI status            != evidence
Document assertion   != verification
Architecture PASS    != production authorization
Authorization        != runtime readiness
```

A missing, stale, conflicting or unverifiable prerequisite keeps the derived state `BLOCKED` or `UNKNOWN`.

## 3. State machine

```text
ARCHITECTURE
  BLOCKED / UNKNOWN
       |
       | all architecture closure checks PASS
       v
GREEN ARCHITECTURE GATE
       |
       | all mandatory production authorization gates PASS
       v
PRODUCTION AUTHORIZED
       |
       | current release-head runtime readiness evidence PASS
       v
PRODUCTION READY
```

Any failed prerequisite causes the derived state to remain non-green. A later stage can never bypass an earlier failed stage.

## 4. Green Architecture Gate

The gate is `PASS` only when all are true:

- canonical ADR identifiers resolve to exactly one authoritative status in `DECISION_LOG.md`;
- A3 has explicit `decision`, `implementation`, `credential_status`, and `ratification` dimensions;
- the A3 dimensions are individually verified, not merely present;
- the architecture closure verifier records `PASS` for every mandatory architecture verifier;
- repository governance/branch-protection evidence required by the release policy is verified;
- no architecture P0 blocker remains open, blocked, in progress, or waiting for evidence.

Otherwise:

`GREEN_ARCHITECTURE_GATE = BLOCKED`

## 5. Production Authorization

Production authorization is a **derived governance decision**, not a deployment action.

It becomes `AUTHORIZED` only when Green Architecture Gate is `PASS` and all mandatory production controls are `PASS`:

- canonical CRM/business evidence;
- approved provider connectivity and provider evidence;
- representative consequential transaction proof;
- production security evidence;
- authorization evidence;
- production event/evidence continuity;
- live SLI/cost telemetry validation;
- formal four-team release approval against the exact release head.

No credential, secret, or private enterprise datum is stored in the authorization artifact.

## 6. Production Ready

Production readiness becomes `PASS` only when Production Authorization is `AUTHORIZED` and the current release head has fresh runtime evidence covering:

- deployment health and immutable release identity;
- database/migration health;
- authentication E2E proof;
- representative production transaction execution;
- communication/provider health;
- security/fail-closed behavior;
- observability and SLI/SLO signals;
- rollback/recovery or DR verification;
- no unresolved release-gating blocker.

A release can be authorized yet not ready.

## 7. Evidence freshness

Every release decision MUST bind to an exact reviewed commit/release head.

Evidence is invalid for release authorization when it is:

- absent;
- generated from another release head;
- expired according to its evidence class;
- superseded without a current replacement;
- contradictory;
- marked `UNKNOWN`, `BLOCKED`, or `UNVERIFIED`.

## 8. Failure semantics

If any mandatory input cannot be evaluated deterministically, the gate returns `BLOCKED` rather than assuming success.

```text
missing evidence       -> BLOCKED
conflicting evidence   -> BLOCKED
stale evidence         -> BLOCKED
untrusted assertion    -> BLOCKED
runtime failure        -> BLOCKED
unknown prerequisite   -> BLOCKED
```

## 9. Machine-readable output

The authoritative machine output is:

`data/production-release-gate.json`

It MUST contain:

- exact release head;
- architecture gate state;
- production authorization state;
- production readiness state;
- prerequisite results;
- blockers;
- evidence references;
- generated timestamp;
- verifier version.

## 10. Release rule

```text
Green Architecture Gate = PASS
        AND
Production Authorization = AUTHORIZED
        AND
Production Ready = PASS
        AND
Four-Team approval = PASS
```

Only then may the project be declared production-ready.

**Current posture:** `BLOCKED` until the evidence chain is complete.
