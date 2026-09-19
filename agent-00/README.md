# AFAGH Agent 00

Operational Project Orchestrator / Control Plane for AFAGH.

## Non-negotiable rules
- Search → Reuse → Extend → Refactor → Test
- No gate bypass.
- No implementation before the relevant gate is approved.
- Team deliberation requires team-specific bearer credentials.
- Independent Audit (T04) requires a separate audit decision before gate advance.
- State-changing control actions produce hash-chained evidence.
- Demo is not Core.
- Render LIVE is not equivalent to Production RELEASE.

## Runtime
- Node.js 22
- Render Web Service
- PostgreSQL persistence via DATABASE_URL
- Liveness: GET /api/v1/health
- Readiness: GET /api/v1/ready

## Control API
- GET /api/v1/project
- GET /api/v1/gates
- GET /api/v1/teams
- GET /api/v1/tasks
- GET /api/v1/decisions
- GET /api/v1/audit
- GET /api/v1/evidence
- GET /api/v1/events
- GET /api/v1/deliberations
- GET /api/v1/orchestrator/status
- GET /api/v1/github/core-status
- POST /api/v1/orchestrator/cycle — operator only
- POST /api/v1/deliberations — team-specific token
- POST /api/v1/audit/decision — T04 only
- POST /api/v1/gates/evaluate — operator only
- POST /api/v1/gates/advance — operator only

## Required secrets
- AFAGH_AGENT00_ADMIN_TOKEN
- AFAGH_AGENT00_VIEWER_TOKEN (optional)
- AFAGH_AGENT00_T01_TOKEN
- AFAGH_AGENT00_T02_TOKEN
- AFAGH_AGENT00_T03_TOKEN
- AFAGH_AGENT00_T04_TOKEN
- AFAGH_GITHUB_TOKEN
- AFAGH_CORE_REPOSITORY (optional)
- DATABASE_URL

## Release rule
RELEASED is allowed only after all gates pass with verifiable evidence.