# AFAGH Communication OS — Provider Verification Harness V1

Status: IMPLEMENTED — CONTROLLED LIVE TESTING

## Purpose

The Provider Verification Harness provides a controlled path from the AI Command Center to real provider APIs without allowing the UI or model to fabricate delivery evidence.

## Live-test channels

- Email — Resend
- SMS — Twilio
- WhatsApp — Twilio
- Voice — Twilio

Other registered channels remain present in the channel registry but are not eligible for live verification until their provider adapters are implemented.

## Execution contract

1. Authenticated session is required.
2. Channel and recipient are mandatory.
3. A dry-run may inspect readiness without contacting a provider.
4. A live execution requires `confirm: true` in the request body.
5. Policy is fixed to `ALLOW` only inside this dedicated verification boundary; this endpoint is not a general-purpose send API.
6. Provider response is persisted as verification evidence.
7. Recipient values are stored only as a short SHA-256 reference in verification evidence.
8. `production_verified=true` is emitted only when the adapter reports `state=DELIVERED`.
9. Provider secrets are read only from runtime environment variables and never returned by the endpoint.

## Endpoints

### GET `/api/v1/communication/provider-tests`

Returns the executable test plan and required fields for every registered channel.

### POST `/api/v1/communication/provider-tests/run`

Runs either a dry-run or a confirmed live provider verification.

Example dry-run:

```json
{
  "channel": "email",
  "recipient": "recipient@example.com",
  "payload": {
    "subject": "AFAGH provider verification",
    "text": "Controlled provider verification test."
  },
  "dry_run": true
}
```

Example live execution shape:

```json
{
  "channel": "email",
  "recipient": "recipient@example.com",
  "payload": {
    "subject": "AFAGH provider verification",
    "text": "Controlled provider verification test."
  },
  "confirm": true
}
```

For SMS and WhatsApp, the payload uses `body` and provider sender configuration. For Voice, the payload uses `twiml_url` and the configured voice sender.

### GET `/api/v1/communication/provider-tests/evidence`

Returns persisted verification records scoped to the authenticated tenant and workspace. Provider message/call identifiers are retained for evidence correlation; secrets are never returned.

## Truth model

`READY_FOR_PROVIDER_TEST` → runtime and credential boundary available, no external request yet.

`DELIVERED` → provider accepted the request and returned a successful provider response.

`BLOCKED` → request was prevented by authentication, contract, configuration, provider error, or missing confirmation.

`NOT_LIVE` → adapter is registered but does not yet implement a real provider call.

The harness never converts a blocked or pending result into a success state.
