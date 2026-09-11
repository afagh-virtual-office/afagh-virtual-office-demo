#!/usr/bin/env python3
"""Fail-closed validation for the public demo evidence contract."""
import json, sys
from pathlib import Path

p = Path('data/evidence.json')
if not p.exists():
    print('BLOCK: data/evidence.json missing'); sys.exit(1)
try:
    e = json.loads(p.read_text(encoding='utf-8'))
except Exception as exc:
    print(f'BLOCK: invalid JSON: {exc}'); sys.exit(1)

required = ['schema_version','snapshot_type','live','source_repository','reviewed_head','reviewed_run','gate','production','architecture_contracts','runtime_evidence','verifier','axes','blockers','evidence_sources']
missing = [k for k in required if k not in e]
if missing:
    print('BLOCK: missing fields:', ', '.join(missing)); sys.exit(1)

if e['live'] is not False:
    print('BLOCK: public demo evidence must explicitly declare live=false'); sys.exit(1)
if e['gate'] != 'PASSED' and e['production'] == 'READY':
    print('BLOCK: production READY is forbidden while Gate 1 is not PASSED'); sys.exit(1)
if len(e['reviewed_head']) != 40:
    print('BLOCK: reviewed_head must be a full 40-character commit SHA'); sys.exit(1)

for name in ('architecture_contracts','runtime_evidence','verifier'):
    obj = e[name]
    if obj['pass'] > obj['total']:
        print(f'BLOCK: {name}.pass exceeds total'); sys.exit(1)
if e['verifier']['blockers'] != len(e['blockers']):
    print('BLOCK: verifier blocker count does not match blocker records'); sys.exit(1)
if len(e['axes']) < 10:
    print('BLOCK: fewer than 10 architecture axes'); sys.exit(1)

print('PASS: evidence contract valid')
print(f"gate={e['gate']} production={e['production']} head={e['reviewed_head']} run={e['reviewed_run']}")
