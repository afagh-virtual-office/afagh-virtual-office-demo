import crypto from 'node:crypto';
import { dispatch, CHANNELS, channelStatus } from './channel-adapters.js';

const TESTABLE = new Set(['email','sms','whatsapp','voice']);

function id(){ return crypto.randomUUID(); }

export function providerVerificationPlan(){
  return CHANNELS.map(channel => ({
    channel: channel.id,
    provider: channel.provider,
    supported_for_live_test: TESTABLE.has(channel.id),
    required: channel.id === 'email'
      ? ['recipient','subject','text','from']
      : channel.id === 'voice'
        ? ['recipient','from','twiml_url']
        : ['recipient','body','from'],
    safety: 'EXECUTE_REQUIRES_EXPLICIT_CONFIRMATION'
  }));
}

export async function runProviderVerification({ channel, recipient, payload = {}, confirm = false, correlation_id, dry_run = false }) {
  if (!TESTABLE.has(channel)) {
    return { ok:false, state:'BLOCKED', reason:'LIVE_TEST_NOT_SUPPORTED_FOR_CHANNEL', channel };
  }
  if (!recipient) return { ok:false, state:'BLOCKED', reason:'RECIPIENT_REQUIRED', channel };
  if (!dry_run && confirm !== true) {
    return {
      ok:false,
      state:'BLOCKED',
      reason:'EXPLICIT_CONFIRMATION_REQUIRED',
      channel,
      safety:'No external provider request was made.'
    };
  }
  const correlationId = correlation_id || id();
  if (dry_run) {
    return {
      ok:true,
      state:'READY_FOR_PROVIDER_TEST',
      channel,
      correlation_id:correlationId,
      delivery:'NOT_EXECUTED',
      safety:'DRY_RUN'
    };
  }
  const result = await dispatch({
    channel,
    direction: channel === 'voice' ? 'outbound' : 'outbound',
    recipient,
    payload,
    policy:{ decision:'ALLOW', source:'provider-verification-harness-v1' }
  });
  return { ...result, channel, correlation_id:correlationId };
}

export function sanitizeVerificationResult(result){
  const copy = JSON.parse(JSON.stringify(result));
  delete copy.error;
  return copy;
}
