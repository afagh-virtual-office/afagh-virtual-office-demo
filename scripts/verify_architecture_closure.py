#!/usr/bin/env python3
"""Fail-closed verifier for architecture closure blockers VERIFIER-001/002.

The verifier never promotes a blocker to PASS from documentation alone. It requires
canonical ADR and A3 source files to exist in this repository and validates their
machine-readable state.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RESULT_PATH = ROOT / "data" / "architecture-closure-verification.json"

ADR_INDEX = ROOT / "docs" / "architecture" / "ADR-INDEX.md"
DECISION_LOG = ROOT / "docs" / "architecture" / "DECISION_LOG.md"
A3_STATE = ROOT / "docs" / "architecture" / "A3-PROTOCOL-STATE.json"


def fail(results: list[dict[str, Any]], blocker: str, reason: str) -> None:
    results.append({"id": blocker, "status": "BLOCKED", "reason": reason})


def parse_adr_ids(text: str) -> list[str]:
    ids = re.findall(r"\bADR[- ]?\d{3,}\b", text, flags=re.IGNORECASE)
    return sorted(set(x.upper().replace(" ", "-", 1) for x in ids))


def canonical_statuses(text: str) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for line in text.splitlines():
        m = re.search(r"\b(ADR[- ]?\d{3,})\b.*?\b(PROPOSED|ACCEPTED|APPROVED|REJECTED|SUPERSEDED|DEPRECATED)\b", line, re.I)
        if m:
            adr = m.group(1).upper().replace(" ", "-", 1)
            out.setdefault(adr, []).append(m.group(2).upper())
    return out


def verify_001(results: list[dict[str, Any]]) -> None:
    if not ADR_INDEX.exists() or not DECISION_LOG.exists():
        missing = [str(p.relative_to(ROOT)) for p in (ADR_INDEX, DECISION_LOG) if not p.exists()]
        fail(results, "VERIFIER-001", "Canonical ADR sources missing: " + ", ".join(missing))
        return
    index = ADR_INDEX.read_text(encoding="utf-8")
    log = DECISION_LOG.read_text(encoding="utf-8")
    ids = parse_adr_ids(index)
    statuses = canonical_statuses(log)
    if not ids:
        fail(results, "VERIFIER-001", "ADR-INDEX contains no machine-detectable ADR identifiers")
        return
    errors: list[str] = []
    for adr in ids:
        vals = statuses.get(adr, [])
        if not vals:
            errors.append(f"{adr} missing from DECISION_LOG")
        elif len(set(vals)) != 1:
            errors.append(f"{adr} has conflicting canonical statuses: {sorted(set(vals))}")
    if errors:
        fail(results, "VERIFIER-001", "; ".join(errors))
    else:
        results.append({"id": "VERIFIER-001", "status": "PASS", "reason": "Every ADR in ADR-INDEX resolves to exactly one status in DECISION_LOG"})


def verify_002(results: list[dict[str, Any]]) -> None:
    if not A3_STATE.exists():
        fail(results, "VERIFIER-002", "A3 state source missing: docs/architecture/A3-PROTOCOL-STATE.json")
        return
    try:
        data = json.loads(A3_STATE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(results, "VERIFIER-002", f"A3 state is not valid JSON: {exc}")
        return
    required = ["decision", "implementation", "credential_status", "ratification"]
    missing = [k for k in required if k not in data]
    if missing:
        fail(results, "VERIFIER-002", "A3 state missing dimensions: " + ", ".join(missing))
        return
    invalid = [k for k in required if not isinstance(data[k], dict) or not data[k].get("status")]
    if invalid:
        fail(results, "VERIFIER-002", "A3 dimensions lack explicit machine-verifiable status: " + ", ".join(invalid))
        return
    blocked = [k for k in required if str(data[k]["status"]).upper() not in {"VERIFIED", "PASS", "APPROVED", "PROVISIONED", "IMPLEMENTED"}]
    if blocked:
        fail(results, "VERIFIER-002", "A3 dimensions are not fully verified: " + ", ".join(blocked))
    else:
        results.append({"id": "VERIFIER-002", "status": "PASS", "reason": "Decision, implementation, credential_status, and ratification are independently explicit"})


def main() -> int:
    results: list[dict[str, Any]] = []
    verify_001(results)
    verify_002(results)
    passed = sum(r["status"] == "PASS" for r in results)
    total = len(results)
    payload = {
        "schema_version": "architecture-closure-verification.v1",
        "status": "PASS" if passed == total == 2 else "BLOCKED",
        "pass": passed,
        "total": total,
        "blockers": total - passed,
        "results": results,
    }
    RESULT_PATH.parent.mkdir(parents=True, exist_ok=True)
    RESULT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if payload["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
