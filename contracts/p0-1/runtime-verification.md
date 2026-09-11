# P0-1 Runtime Verification Plan

Status: READY FOR RUNTIME IMPLEMENTATION

## Gate

`P0-1 PASS` requires all five verification cases in `backend-contract.md` to pass against the same deployed runtime boundary used by the UI.

## Assertions

- [ ] Authenticated subject is server-derived.
- [ ] Session validity is server-derived.
- [ ] Tenant/workspace context is server-derived and isolated.
- [ ] Role and permission evaluation is server-side.
- [ ] Requested resource and action are traceable by request ID.
- [ ] Authorization decision has a decision ID.
- [ ] Audit event has an event ID and actor.
- [ ] Evidence has a source and integrity status.
- [ ] No credentials/tokens/secrets are returned to the browser.
- [ ] Schema validation succeeds.
- [ ] DENY paths are tested, not only ALLOW.

## Runtime evidence package

For each test case retain:

1. request identifier
2. sanitized request metadata
3. response conforming to schema
4. authorization decision identifier
5. audit event identifier
6. evidence identifier
7. verifier result
8. runtime build/commit identifier

## Failure policy

Any missing identifier, client-derived security claim, cross-tenant access, schema mismatch, leaked credential material, or unverifiable evidence blocks P0-1 and therefore blocks production readiness.
