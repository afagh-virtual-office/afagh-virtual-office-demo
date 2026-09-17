import { loadBaselineExperts } from './catalog.mjs';
import { routeExpert } from './router.mjs';
import { evaluateExpertPolicy } from './policy-boundary.mjs';

export function runControlledJourney(input = {}) {
  loadBaselineExperts();
  const correlationId = input.correlationId || `ve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const routing = routeExpert({
    workspaceId: input.workspaceId,
    domain: input.domain,
    skills: input.skills,
    channel: input.channel,
    expertId: input.expertId
  });
  if (!routing.ok) {
    return { ok: false, state: 'BLOCKED', correlationId, stage: 'EXPERT_SELECTION', reason: routing.reason };
  }

  const policy = evaluateExpertPolicy({
    expert: routing.expert,
    requestedLevel: input.requestedLevel,
    channel: input.channel,
    actionRisk: input.actionRisk || 'NONE',
    commercialActivationAuthorized: Boolean(input.commercialActivationAuthorized)
  });
  if (policy.decision !== 'ALLOW') {
    return {
      ok: false,
      state: 'BLOCKED',
      correlationId,
      stage: 'POLICY',
      expertId: routing.expert.id,
      policy
    };
  }

  return {
    ok: true,
    state: 'CONTROLLED_PASS',
    correlationId,
    stages: {
      actor: input.actor || 'controlled-test-actor',
      identity: input.identity || 'controlled-test-identity',
      context: input.context || { workspaceId: input.workspaceId || 'controlled' },
      intent: input.intent || 'CONTROLLED_EXPERT_TEST',
      expertSelection: { expertId: routing.expert.id, score: routing.score },
      policy,
      authorization: { decision: 'AUTHORIZED_FOR_CONTROLLED_TEST' },
      channel: input.channel || null,
      provider: 'BOUNDARY_ONLY',
      result: 'NO_EXTERNAL_SIDE_EFFECT',
      evidence: { required: true, state: 'EVIDENCE_PENDING_PERSISTENCE' }
    }
  };
}
