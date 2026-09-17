import assert from 'node:assert/strict';
import { loadBaselineExperts } from './catalog.mjs';
import { routeExpert } from './router.mjs';
import { evaluateExpertPolicy } from './policy-boundary.mjs';
import { runControlledJourney } from './controlled-journey.mjs';

loadBaselineExperts();

const routed = routeExpert({ domain: 'trade', skills: ['supplier-buyer-matching'], channel: 'telegram' });
assert.equal(routed.ok, true);
assert.equal(routed.expert.id, 've.trade.iran-china');

const deniedL3 = evaluateExpertPolicy({
  expert: routed.expert,
  requestedLevel: 'AUTONOMOUS_WITHIN_POLICY',
  channel: 'telegram',
  actionRisk: 'HIGH',
  commercialActivationAuthorized: false
});
assert.equal(deniedL3.decision, 'DENY');
assert.equal(deniedL3.reason, 'REQUESTED_LEVEL_EXCEEDS_EXPERT_AUTHORITY');

const controlled = runControlledJourney({
  workspaceId: 'controlled',
  domain: 'trade',
  skills: ['supplier-buyer-matching'],
  channel: 'telegram',
  requestedLevel: 'RECOMMEND_DRAFT',
  actionRisk: 'NONE',
  intent: 'CONTROLLED_TRADE_EXPERT_TEST'
});
assert.equal(controlled.ok, true);
assert.equal(controlled.state, 'CONTROLLED_PASS');
assert.equal(controlled.stages.result, 'NO_EXTERNAL_SIDE_EFFECT');
assert.equal(controlled.stages.evidence.state, 'EVIDENCE_PENDING_PERSISTENCE');

console.log('Virtual Expert Workforce smoke test: PASS');
console.log(JSON.stringify({
  routedExpert: routed.expert.id,
  controlledState: controlled.state,
  correlationId: controlled.correlationId,
  l3WithoutActivation: deniedL3.decision
}, null, 2));
