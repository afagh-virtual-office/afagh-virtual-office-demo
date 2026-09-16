const ENV_BY_CHANNEL = Object.freeze({
  voice: 'TWILIO_ACCOUNT_SID',
  email: 'RESEND_API_KEY',
  sms: 'TWILIO_ACCOUNT_SID',
  telegram: 'TELEGRAM_BOT_TOKEN',
  whatsapp: 'TWILIO_ACCOUNT_SID',
  instagram: 'INSTAGRAM_ACCESS_TOKEN',
  shad: 'SHAD_BOT_TOKEN',
  bale: 'BALE_BOT_TOKEN',
  rubika: 'RUBIKA_BOT_TOKEN'
});

export const CHANNELS = Object.freeze([
  { id: 'voice', name: 'Cloud Voice / SIP / WebRTC', directions: ['inbound','outbound'], provider: process.env.VOICE_PROVIDER || 'twilio' },
  { id: 'email', name: 'Email', directions: ['inbound','outbound'], provider: process.env.EMAIL_PROVIDER || 'resend' },
  { id: 'sms', name: 'SMS', directions: ['inbound','outbound'], provider: process.env.SMS_PROVIDER || 'twilio' },
  { id: 'telegram', name: 'Telegram', directions: ['inbound','outbound'], provider: process.env.TELEGRAM_PROVIDER || 'telegram' },
  { id: 'whatsapp', name: 'WhatsApp', directions: ['inbound','outbound'], provider: process.env.WHATSAPP_PROVIDER || 'twilio' },
  { id: 'instagram', name: 'Instagram Business Messaging', directions: ['inbound','outbound'], provider: process.env.INSTAGRAM_PROVIDER || 'meta' },
  { id: 'shad', name: 'Shad', directions: ['inbound','outbound'], provider: process.env.SHAD_PROVIDER || 'shad' },
  { id: 'bale', name: 'Bale', directions: ['inbound','outbound'], provider: process.env.BALE_PROVIDER || 'bale' },
  { id: 'rubika', name: 'Rubika', directions: ['inbound','outbound'], provider: process.env.RUBIKA_PROVIDER || 'rubika' }
]);

function configured(channel) {
  const key = ENV_BY_CHANNEL[channel];
  return Boolean(key && process.env[key]);
}

export function channelStatus() {
  return CHANNELS.map(c => ({
    ...c,
    adapter: 'channel-adapter-v2',
    credential_boundary: 'SECRET_REFERENCE_ONLY',
    configured: configured(c.id),
    status: configured(c.id) ? 'READY_FOR_PROVIDER_TEST' : 'NOT_CONFIGURED'
  }));
}

function formBody(values) {
  return new URLSearchParams(Object.entries(values).filter(([,v]) => v !== undefined && v !== null && v !== '')).toString();
}

async function sendTwilioMessage({ to, from, body, messagingServiceSid, contentSid, contentVariables }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return { ok:false, state:'BLOCKED', reason:'TWILIO_CREDENTIALS_MISSING' };
  if (!to || (!from && !messagingServiceSid) || (!body && !contentSid)) {
    return { ok:false, state:'BLOCKED', reason:'TWILIO_MESSAGE_PARAMETERS_MISSING' };
  }
  const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method:'POST',
    headers:{
      'content-type':'application/x-www-form-urlencoded',
      authorization:`Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
    },
    body: formBody({ To:to, From:from, MessagingServiceSid:messagingServiceSid, Body:body, ContentSid:contentSid, ContentVariables:contentVariables })
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok) return { ok:false, state:'BLOCKED', reason:'TWILIO_API_ERROR', provider_status:result.status, provider_code:data.code || null };
  return { ok:true, state:'DELIVERED', provider:'twilio', provider_message_id:data.sid || null, provider_status:data.status || null };
}

async function sendTwilioVoice({ to, from, url, method }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return { ok:false, state:'BLOCKED', reason:'TWILIO_CREDENTIALS_MISSING' };
  if (!to || !from || !url) return { ok:false, state:'BLOCKED', reason:'TWILIO_VOICE_PARAMETERS_MISSING' };
  const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method:'POST',
    headers:{
      'content-type':'application/x-www-form-urlencoded',
      authorization:`Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
    },
    body: formBody({ To:to, From:from, Url:url, Method:method || 'POST' })
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok) return { ok:false, state:'BLOCKED', reason:'TWILIO_VOICE_API_ERROR', provider_status:result.status, provider_code:data.code || null };
  return { ok:true, state:'DELIVERED', provider:'twilio', provider_call_id:data.sid || null, provider_status:data.status || null };
}

async function sendResend({ to, from, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok:false, state:'BLOCKED', reason:'RESEND_CREDENTIAL_MISSING' };
  if (!to || !from || !subject || (!text && !html)) return { ok:false, state:'BLOCKED', reason:'RESEND_EMAIL_PARAMETERS_MISSING' };
  const result = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'content-type':'application/json', authorization:`Bearer ${apiKey}` },
    body:JSON.stringify({ from, to:Array.isArray(to) ? to : [to], subject, text, html })
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok) return { ok:false, state:'BLOCKED', reason:'RESEND_API_ERROR', provider_status:result.status };
  return { ok:true, state:'DELIVERED', provider:'resend', provider_message_id:data.id || null };
}

export async function dispatch({ channel, direction, recipient, payload = {}, policy }) {
  const def = CHANNELS.find(c => c.id === channel);
  if (!def) return { ok: false, state: 'BLOCKED', reason: 'CHANNEL_NOT_REGISTERED' };
  if (!def.directions.includes(direction)) return { ok: false, state: 'BLOCKED', reason: 'DIRECTION_NOT_ALLOWED' };
  if (!policy || policy.decision !== 'ALLOW') return { ok: false, state: 'BLOCKED', reason: 'POLICY_REQUIRED' };
  if (!configured(channel)) {
    return { ok:false, state:'BLOCKED', reason:'PROVIDER_NOT_CONFIGURED', channel, delivery:'NOT_EXECUTED' };
  }

  try {
    if (channel === 'email') {
      return await sendResend({
        to: recipient,
        from: payload.from || process.env.EMAIL_FROM,
        subject: payload.subject,
        text: payload.text,
        html: payload.html
      });
    }
    if (channel === 'sms') {
      return await sendTwilioMessage({
        to: recipient,
        from: payload.from || process.env.TWILIO_SMS_FROM,
        messagingServiceSid: payload.messaging_service_sid || process.env.TWILIO_MESSAGING_SERVICE_SID,
        body: payload.body,
        contentSid: payload.content_sid,
        contentVariables: payload.content_variables
      });
    }
    if (channel === 'whatsapp') {
      const to = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`;
      const fromRaw = payload.from || process.env.TWILIO_WHATSAPP_FROM;
      const from = fromRaw && fromRaw.startsWith('whatsapp:') ? fromRaw : fromRaw ? `whatsapp:${fromRaw}` : undefined;
      return await sendTwilioMessage({
        to,
        from,
        body: payload.body,
        contentSid: payload.content_sid,
        contentVariables: payload.content_variables
      });
    }
    if (channel === 'voice') {
      return await sendTwilioVoice({
        to: recipient,
        from: payload.from || process.env.TWILIO_VOICE_FROM,
        url: payload.twiml_url,
        method: payload.twiml_method
      });
    }
    return { ok:false, state:'NOT_LIVE', reason:'PROVIDER_ADAPTER_PENDING', channel, provider:def.provider, recipient, payload_hash:'REDACTED' };
  } catch (error) {
    return { ok:false, state:'BLOCKED', reason:'PROVIDER_REQUEST_FAILED', provider:def.provider, error_class:error?.name || 'Error' };
  }
}
