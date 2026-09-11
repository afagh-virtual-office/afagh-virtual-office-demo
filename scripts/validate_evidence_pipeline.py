#!/usr/bin/env python3
"""Fail-closed Evidence Pipeline validator.

This validator proves the public demo is structurally safe. It does not invent
upstream CI data and it never treats a controlled snapshot as live telemetry.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/evidence.json"
SCHEMA = ROOT / "schema/evidence.schema.json"

BLOCKS = []

def block(msg):
    BLOCKS.append(msg)

def required(obj, keys, label):
    for key in keys:
        if key not in obj:
            block(f"{label}: missing field {key}")

if not DATA.exists():
    block("evidence file missing")
else:
    try:
        evidence = json.loads(DATA.read_text(encoding="utf-8"))
    except Exception as exc:
        evidence = {}
        block(f"invalid evidence JSON: {exc}")

if not SCHEMA.exists():
    block("evidence schema missing")

if evidence:
    required(evidence, [
        "schema_version", "snapshot_type", "live", "source_repository",
        "reviewed_head", "reviewed_run", "gate", "production",
        "architecture_contracts", "runtime_evidence", "verifier",
        "axes", "blockers", "evidence_sources", "pipeline"
    ], "evidence")

    if evidence.get("live") is not False:
        block("public demo evidence must declare live=false")
    if evidence.get("gate") != "PASSED" and evidence.get("production") == "READY":
        block("production READY is forbidden while Gate 1 is not PASSED")
    if not re.fullmatch(r"[0-9a-f]{40}", str(evidence.get("reviewed_head", ""))):
        block("reviewed_head must be a full lowercase 40-character commit SHA")

    for name in ("architecture_contracts", "runtime_evidence", "verifier"):
        obj = evidence.get(name, {})
        if obj.get("pass", 0) > obj.get("total", 0):
            block(f"{name}.pass exceeds total")

    verifier = evidence.get("verifier", {})
    blockers = evidence.get("blockers", [])
    if verifier.get("blockers") != len(blockers):
        block("verifier blocker count does not match blocker records")
    if len(evidence.get("axes", {})) != 10:
        block("exactly 10 architecture axes are required")

    pipeline = evidence.get("pipeline", {})
    required(pipeline, [
        "contract_version", "upstream_connection", "snapshot_kind",
        "publication_policy", "fail_closed"
    ], "pipeline")
    if pipeline.get("fail_closed") is not True:
        block("pipeline fail_closed must be true")
    if pipeline.get("snapshot_kind") == "live" and evidence.get("live") is False:
        block("snapshot kind cannot be live when live=false")
    if evidence.get("production") == "READY" and evidence.get("gate") != "PASSED":
        block("production READY requires Gate 1 PASSED")

if BLOCKS:
    print("BLOCK: Evidence Pipeline validation failed")
    for item in BLOCKS:
        print(f" - {item}")
    sys.exit(1)

print("PASS: Evidence Pipeline contract valid")
print(f"source={evidence['source_repository']}")
print(f"reviewed_head={evidence['reviewed_head']}")
print(f"snapshot_kind={evidence['pipeline']['snapshot_kind']}")
print(f"upstream_connection={evidence['pipeline']['upstream_connection']}")
print(f"gate={evidence['gate']} production={evidence['production']}")
