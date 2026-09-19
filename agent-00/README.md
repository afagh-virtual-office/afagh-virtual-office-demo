# AFAGH Agent 00

AFAGH Project Orchestrator control-plane service.

## Runtime
- Node.js 22
- Render Web Service
- PostgreSQL-ready persistence layer
- Gate-controlled orchestration model

## Current control state
G01_CORE_REPOSITORY is BLOCKED until the intended Core repository is exposed and audited.

## Rule
Search → Reuse → Extend → Refactor → Test

## Endpoints
GET /api/v1/health
GET /api/v1/project
GET /api/v1/gates
GET /api/v1/teams
GET /api/v1/tasks
GET /api/v1/decisions
GET /api/v1/audit
