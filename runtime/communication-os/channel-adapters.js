const ENV_BY_CHANNEL = Object.freeze({
  voice: 'VOICE_PROVIDER_SECRET_REF',
  email: 'EMAIL_PROVIDER_SECRET_REF',
  sms: 'SMS_PROVIDER_SECRET_REF',
  telegram: 'TELEGRAM_BOT_SECRET_REF',
  whatsapp: 'WHATSAPP_PROVIDER_SECRET_REF',
  instagram: 'INSTAGRAM_PROVIDER_SECRET_REF',
  shad: 'SHAD_PROVIDER_SECRET_REF',
  bale: 'BALE_PROVIDER_SECRET_REF',
  rubika: 'RUBIKA_PROVIDER_SECRET_REF'
});

export const CHANNELS = Object.freeze([
  { id: 'voice', name: 'Cloud Voice / SIP / WebRTC', directions: ['inbound','outbound'] },
  { id: 'email', name: 'Email', directions: ['inbound','outbound'] },
  { id: 'sms', name: 'SMS', directions: ['inbound','outbound'] },
  { id: 'telegram', name: 'Telegram', directions: ['inbound','outbound'] },
  { id: 'whatsapp', name: 'WhatsApp', directions: ['inbound','outbound'] },
  { id: 'instagram', name: 'Instagram Business Messaging', directions: ['inbound','outbound'] },
  { id: 'shad', name: 'Shad', directions: ['inbound','outbound'] },
  { id: 'bale', name: 'Bale', directions: ['inbound','outbound'] },
  { id: 'rubika', name: 'Rubika', directions: ['inbound','outbound'] }
]);

function configured(channel) {
  const key = ENV_BY_CHANNEL[channel];
  return Boolean(key && process.env[key]);
}

export function channelStatus() {
  return CHANNELS.map(c => ({
    ...c,
    adapter: 'channel-adapter-v1',
    credential_boundary: 'SECRET_REFERENCE_ONLY',
    configured: configured(c.id),
    status: configured(c.id) ? 'READY_FOR_PROVIDER_TEST' : 'NOT_CONFIGURED'
  }));
}

export async function dispatch({ channel, direction, recipient, payload, policy }) {
  const def = CHANNELS.find(c => c.id === channel);
  if (!def) return { ok: false, state: 'BLOCKED', reason: 'CHANNEL_NOT_REGISTERED' };
  if (!def.directions.includes(direction)) return { ok: false, state: 'BLOCKED', reason: 'DIRECTION_NOT_ALLOWED' };
  if (!policy || policy.decision !== 'ALLOW') return { ok: false, state: 'BLOCKED', reason: 'POLICY_REQUIRED' };
  if (!configured(channel)) {
    return {
      ok: false,
      state: 'BLOCKED',
      reason: 'PROVIDER_NOT_CONFIGURED',
      channel,
      delivery: 'NOT_EXECUTED'
    };
  }
  // Provider-specific send/receive implementations are intentionally isolated behind this boundary.
  // No provider secret is read into model/UI context. Until a concrete provider adapter is configured,
  // the runtime refuses to claim delivery.
  return { ok: false, state: 'NOT_LIVE', reason: 'PROVIDER_ADAPTER_PENDING', channel, recipient, payload_hash: 'REDACTED' };
}
