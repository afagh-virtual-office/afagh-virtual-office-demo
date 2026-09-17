import crypto from 'node:crypto';
import { runControlledJourney } from '../virtual-experts/controlled-journey.mjs';
import { evaluateExpertPolicy } from '../virtual-experts/policy-boundary.mjs';
import { dispatch } from './channel-adapters.js';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const redactResult = result => ({
  ok: Boolean(result?.ok),
  state: result?.state || null,
  reason: result?.reason || null,
  provider: result?.provider || null,
  provider_message_id: result?.provider_message_id || null,
  provider_status: result?.provider_status || null,
});

export async function runVirtualExpertCommunication({
  pool,
  session,
  actor,
  context,
  intent,
  domain,
  skills = [],
  channel,
  recipient,
  message,
  requestedLevel = 'LIMITED_EXECUTION',
  confirm = false,
  correlationId = id(),
  providerPayload = {},
} = {}) {
  if (!pool) throw new Error('DATABASE_POOL_REQUIRED');
  if (!session) return { ok:false, state:'BLOCKED', reason:'AUTHENTICATION_REQUIRED', correlation_id:correlationId };
  if (!channel || !recipient || !message) return { ok:false, state:'BLOCKED', reason:'CONTROLLED_COMMUNICATION_INPUT_REQUIRED', correlation_id:correlationId };
  if (confirm !== true) return { ok:false, state:'BLOCKED', reason:'CONTROLLED_TEST_CONFIRMATION_REQUIRED', correlation_id:correlationId };

  const startedAt = now();
  const journey = runControlledJourney({
    correlationId,
    workspaceId: session.workspace_id,
    domain,
    skills,
    channel,
    requestedLevel,
    actionRisk: 'EXTERNAL_COMMUNICATION',
    actor: actor || session.subject_id,
    identity: session.subject_id,
    context: context || { tenantId: session.tenant_id, workspaceId: session.workspace_id },
    intent: intent || 'CONTROLLED_VIRTUAL_EXPERT_COMMUNICATION',
    commercialActivationAuthorized: false,
  });

  if (!journey.ok) {
    return { ...journey, correlation_id: correlationId };
  }

  const expertId = journey.stages.expertSelection.expertId;
  const expert = journey._expert || null;
  const policy = journey.stages.policy;
  const authorization = {
    decision: 'AUTHORIZED_FOR_CONTROLLED_TEST',
    scope: 'SINGLE_CONTROLLED_MESSAGE',
    actor: session.subject_id,
    tenant_id: session.tenant_id,
    workspace_id: session.workspace_id,
  };

  const result = await dispatch({
    channel,
    direction: 'outbound',
    recipient,
    payload: { ...providerPayload, body: providerPayload.body || message },
    policy,
  });
  const finishedAt = now();
  const delivered = Boolean(result?.ok && result?.state === 'DELIVERED');
  const state = delivered ? 'CONTROLLED_DELIVERED' : 'CONTROLLED_BLOCKED';

  const evidence = {
    run_id: id(),
    type: 'VIRTUAL_EXPERT_COMMUNICATION',
    schema_version: 'afagh-ve-communication-evidence.v1',
    release_head: process.env.SOURCE_BUILD || 'UNKNOWN',
    expert_id: expertId,
    channel,
    requested_level: requestedLevel,
    policy_decision: policy?.decision || 'DENY',
    authorization_decision: authorization.decision,
    correlation_id: correlationId,
    intent: intent || 'CONTROLLED_VIRTUAL_EXPERT_COMMUNICATION',
    action_risk: 'EXTERNAL_COMMUNICATION',
    provider: result?.provider || null,
    provider_message_id: result?.provider_message_id || null,
    provider_status: result?.provider_status || null,
    state,
    external_side_effect: delivered,
    started_at: startedAt,
    finished_at: finishedAt,
    result: redactResult(result),
  };

  try {
    await pool.query(`
      INSERT INTO virtual_expert_communication_runs
      (run_id,tenant_id,workspace_id,expert_id,channel,requested_level,policy_decision,authorization_decision,correlation_id,intent,action_risk,provider,provider_message_id,provider_status,state,external_side_effect,started_at,finished_at,result)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    `, [
      evidence.run_id,
      session.tenant_id,
      session.workspace_id,
      expertId,
      channel,
      requestedLevel,
      evidence.policy_decision,
      evidence.authorization_decision,
      correlationId,
      evidence.intent,
      evidence.action_risk,
      evidence.provider,
      evidence.provider_message_id,
      evidence.provider_status,
      state,
      evidence.external_side_effect,
      startedAt,
      finishedAt,
      JSON.stringify(evidence.result),
    ]);
  } catch (error) {
    return {
      ok:false,
      state:'BLOCKED',
      reason:'VIRTUAL_EXPERT_EVIDENCE_PERSISTENCE_FAILED',
      correlation_id:correlationId,
      expert_id:expertId,
      provider_result:redactResult(result),
    };
  }

  return {
    ok: delivered,
    state,
    correlation_id:correlationId,
    expert_id:expertId,
    policy,
    authorization,
    channel,
    provider: redactResult(result),
    evidence,
  };
}
