#!/usr/bin/env python3
"""Fail-closed verifier for the final AFAGH release-control chain.

It derives three independent states:
- GREEN_ARCHITECTURE_GATE
- PRODUCTION_AUTHORIZATION
- PRODUCTION_READY

No state is promoted from prose or UI assertions. The verifier requires explicit,
machine-readable prerequisites and keeps unresolved evidence blocked.
"""
from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "production-release-gate.json"
ARCH = ROOT / "data" / "architecture-closure-verification.json"
A3 = ROOT / "docs" / "architecture" / "A3-PROTOCOL-STATE.json"
REMAINING = ROOT / "data" / "remaining-work-board.json"
REQUIREMENTS = ROOT / "docs" / "requirements" / "REQUIREMENTS-CONTRACT-CHALLENGE-V3.md"

ARCHITECTURE_P0 = {
    "RW-001", "RW-002", "RW-003", "RW-004", "RW-005", "RW-006", "RW-007"
}
PRODUCTION_MANDATORY = {
    "RW-003", "RW-004", "RW-005", "RW-006", "RW-007",
    "RW-008", "RW-009", "RW-010", "RW-011", "RW-012"
}


def load_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def release_head() -> str:
    value = os.environ.get("GITHUB_SHA")
    if value:
        return value
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()
    except Exception:
        return "UNKNOWN"


def finding(id_: str, status: str, reason: str, evidence: list[str] | None = None) -> dict[str, Any]:
    return {"id": id_, "status": status, "reason": reason, "evidence": evidence or []}


def verify_architecture() -> tuple[str, list[dict[str, Any]]]:
    findings: list[dict[str, Any]] = []
    arch = load_json(ARCH)
    if not arch:
        findings.append(finding("ARCH-CLOSURE", "BLOCKED", "architecture closure evidence is missing or invalid", [str(ARCH.relative_to(ROOT))]))
        return "BLOCKED", findings
    if arch.get("status") != "PASS":
        findings.append(finding("ARCH-CLOSURE", "BLOCKED", f"architecture closure status is {arch.get('status')!r}, not PASS", [str(ARCH.relative_to(ROOT))]))
        return "BLOCKED", findings
    findings.append(finding("ARCH-CLOSURE", "PASS", "architecture closure evidence is PASS", [str(ARCH.relative_to(ROOT))]))

    a3 = load_json(A3)
    required = ["decision", "implementation", "credential_status", "ratification"]
    if not a3:
        findings.append(finding("A3-STATE", "BLOCKED", "A3 state is missing or invalid", [str(A3.relative_to(ROOT))]))
        return "BLOCKED", findings
    missing = [k for k in required if not isinstance(a3.get(k), dict) or not a3[k].get("status")]
    if missing:
        findings.append(finding("A3-STATE", "BLOCKED", "A3 dimensions are incomplete: " + ", ".join(missing), [str(A3.relative_to(ROOT))]))
        return "BLOCKED", findings
    unverified = [k for k in required if str(a3[k]["status"]).upper() not in {"VERIFIED", "PASS", "APPROVED", "PROVISIONED", "IMPLEMENTED"}]
    if unverified:
        findings.append(finding("A3-STATE", "BLOCKED", "A3 dimensions are not fully verified: " + ", ".join(unverified), [str(A3.relative_to(ROOT))]))
        return "BLOCKED", findings
    findings.append(finding("A3-STATE", "PASS", "all four A3 dimensions are independently verified", [str(A3.relative_to(ROOT))]))

    remaining = load_json(REMAINING)
    if not remaining:
        findings.append(finding("ARCH-P0", "BLOCKED", "remaining-work board is missing or invalid", [str(REMAINING.relative_to(ROOT))]))
        return "BLOCKED", findings
    blockers = [i for i in remaining.get("items", []) if i.get("id") in ARCHITECTURE_P0 and i.get("status") != "CLOSED"]
    if blockers:
        ids = ", ".join(f"{i.get('id')}={i.get('status')}" for i in blockers)
        findings.append(finding("ARCH-P0", "BLOCKED", "architecture P0 items are not closed: " + ids, [str(REMAINING.relative_to(ROOT))]))
        return "BLOCKED", findings
    findings.append(finding("ARCH-P0", "PASS", "all architecture P0 items are closed", [str(REMAINING.relative_to(ROOT))]))
    return "PASS", findings


def verify_production_authorization(architecture_status: str) -> tuple[str, list[dict[str, Any]]]:
    findings: list[dict[str, Any]] = []
    if architecture_status != "PASS":
        findings.append(finding("AUTH-CHAIN", "BLOCKED", "Green Architecture Gate is not PASS; production authorization is impossible"))
        return "BLOCKED", findings

    remaining = load_json(REMAINING)
    if not remaining:
        findings.append(finding("AUTH-PREREQS", "BLOCKED", "remaining-work board is missing or invalid", [str(REMAINING.relative_to(ROOT))]))
        return "BLOCKED", findings
    unresolved = [i for i in remaining.get("items", []) if i.get("id") in PRODUCTION_MANDATORY and i.get("status") != "CLOSED"]
    if unresolved:
        details = "; ".join(f"{i.get('id')}={i.get('status')}" for i in unresolved)
        findings.append(finding("AUTH-PREREQS", "BLOCKED", "mandatory production prerequisites unresolved: " + details, [str(REMAINING.relative_to(ROOT))]))
        return "BLOCKED", findings

    if REQUIREMENTS.exists() and "NO P0 CONTRACT APPROVED" in REQUIREMENTS.read_text(encoding="utf-8"):
        findings.append(finding("AUTH-CONTRACTS", "BLOCKED", "requirements contract challenge still declares NO P0 CONTRACT APPROVED", [str(REQUIREMENTS.relative_to(ROOT))]))
        return "BLOCKED", findings

    findings.append(finding("AUTH-CONTRACTS", "PASS", "requirements contract challenge no longer contains the NO P0 CONTRACT APPROVED blocker", [str(REQUIREMENTS.relative_to(ROOT))]))
    findings.append(finding("AUTH-PREREQS", "PASS", "all mandatory production authorization prerequisites are closed", [str(REMAINING.relative_to(ROOT))]))
    return "AUTHORIZED", findings


def verify_ready(authorization_status: str) -> tuple[str, list[dict[str, Any]]]:
    findings: list[dict[str, Any]] = []
    if authorization_status != "AUTHORIZED":
        findings.append(finding("READY-AUTH", "BLOCKED", "production authorization is not AUTHORIZED"))
        return "BLOCKED", findings
    ready_evidence = ROOT / "data" / "production-readiness-evidence.json"
    data = load_json(ready_evidence)
    if not data or data.get("status") != "PASS":
        findings.append(finding("READY-RUNTIME", "BLOCKED", "current release-head production readiness evidence is absent or not PASS", [str(ready_evidence.relative_to(ROOT))]))
        return "BLOCKED", findings
    findings.append(finding("READY-RUNTIME", "PASS", "current release-head production readiness evidence is PASS", [str(ready_evidence.relative_to(ROOT))]))
    return "PASS", findings


def main() -> int:
    head = release_head()
    architecture, arch_findings = verify_architecture()
    authorization, auth_findings = verify_production_authorization(architecture)
    ready, ready_findings = verify_ready(authorization)

    payload = {
        "schema_version": "afagh-production-release-gate.v1",
        "verifier_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "release_head": head,
        "states": {
            "green_architecture_gate": architecture,
            "production_authorization": authorization,
            "production_ready": ready,
        },
        "final_release": "PASS" if architecture == "PASS" and authorization == "AUTHORIZED" and ready == "PASS" else "BLOCKED",
        "findings": arch_findings + auth_findings + ready_findings,
        "rules": {
            "architecture_gate_requires_all_closure_checks": True,
            "authorization_requires_green_architecture": True,
            "authorization_requires_all_mandatory_production_prerequisites": True,
            "ready_requires_current_release_head_runtime_evidence": True,
            "fail_closed": True,
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if payload["final_release"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
