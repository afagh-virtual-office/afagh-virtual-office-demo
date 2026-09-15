import crypto from 'node:crypto';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export const MISSION_STATES = {
  RECEIVED: ['PLANNING', 'BLOCKED'],
  PLANNING: ['READY', 'BLOCKED'],
  READY: ['EXECUTING', 'CANCELLED', 'BLOCKED'],
  EXECUTING: ['WAITING_PROVIDER', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'BLOCKED'],
  WAITING_PROVIDER: ['EXECUTING', 'FAILED', 'BLOCKED'],
  WAITING_APPROVAL: ['EXECUTING', 'CANCELLED', 'BLOCKED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
  BLOCKED: []
};

export const RISK_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function classifyIntent(command = '') {
  const text = String(command).trim().toLowerCase();
  if (!text) return { intent: 'UNKNOWN', confidence: 0 };
  if (/(تماس|call|voice|زنگ)/.test(text)) return { intent: 'VOICE_OUTREACH', confidence: 0.9 };
  if (/(email|ایمیل)/.test(text)) return { intent: 'EMAIL_OUTREACH', confidence: 0.9 };
  if (/(sms|پیامک)/.test(text)) return { intent: 'SMS_OUTREACH', confidence: 0.9 };
  if (/(telegram|تلگرام)/.test(text)) return { intent: 'TELEGRAM_OUTREACH', confidence: 0.95 };
  if (/(whatsapp|واتس)/.test(text)) return { intent: 'WHATSAPP_OUTREACH', confidence: 0.95 };
  if (/(instagram|اینست)/.test(text)) return { intent: 'INSTAGRAM_OUTREACH', confidence: 0.95 };
  if (/(شاد|shad)/.test(text)) return { intent: 'SHAD_OUTREACH', confidence: 0.95 };
  if (/(بله|bale)/.test(text)) return { intent: 'BALE_OUTREACH', confidence: 0.95 };
  if (/(روبیکا|rubika)/.test(text)) return { intent: 'RUBIKA_OUTREACH', confidence: 0.95 };
  if (/(کمپین|campaign|تبلیغ|تبلیغات)/.test(text)) return { intent: 'CAMPAIGN', confidence: 0.9 };
  if (/(تولیدکننده|producer|تامین کننده|supplier)/.test(text)) return { intent: 'PRODUCER_INTELLIGENCE', confidence: 0.85 };
  if (/(واردکننده|importer)/.test(text)) return { intent: 'IMPORTER_INTELLIGENCE', confidence: 0.85 };
  if (/(مشتری|customer|client)/.test(text)) return { intent: 'CUSTOMER_INTELLIGENCE', confidence: 0.85 };
  return { intent: 'GENERAL_BUSINESS_OPERATION', confidence: 0.55 };
}

export function riskForIntent(intent) {
  if (['VOICE_OUTREACH','EMAIL_OUTREACH','SMS_OUTREACH'].includes(intent)) return 'MEDIUM';
  if (intent.endsWith('_OUTREACH')) return 'MEDIUM';
  if (intent === 'CAMPAIGN') return 'HIGH';
  if (intent.endsWith('_INTELLIGENCE')) return 'LOW';
  return 'LOW';
}

export async function createMission(pool, session, command, requestedChannels = []) {
  if (!session) throw Object.assign(new Error('AUTHENTICATION_REQUIRED'), { statusCode: 401 });
  const classified = classifyIntent(command);
  const riskTier = riskForIntent(classified.intent);
  const missionId = id();
  const correlationId = id();
  const channels = Array.isArray(requestedChannels) && requestedChannels.length ? requestedChannels : [];
  const mission = {
    mission_id: missionId,
    tenant_id: session.tenant_id,
    workspace_id: session.workspace_id,
    owner_subject_id: session.subject_id,
    command: String(command || '').trim(),
    intent: classified.intent,
    confidence: classified.confidence,
    risk_tier: riskTier,
    channels,
    state: riskTier === 'HIGH' || riskTier === 'CRITICAL' ? 'WAITING_APPROVAL' : 'PLANNING',
    correlation_id: correlationId,
    created_at: now()
  };
  await pool.query(
    `INSERT INTO missions (mission_id, tenant_id, workspace_id, owner_subject_id, command, intent, confidence, risk_tier, channels, state, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [missionId, session.tenant_id, session.workspace_id, session.subject_id, mission.command, mission.intent, mission.confidence, mission.risk_tier, JSON.stringify(channels), mission.state, correlationId]
  );
  return mission;
}

export async function getMissions(pool, session) {
  if (!session) throw Object.assign(new Error('AUTHENTICATION_REQUIRED'), { statusCode: 401 });
  const r = await pool.query(
    `SELECT mission_id, command, intent, confidence, risk_tier, channels, state, correlation_id, created_at, updated_at
       FROM missions WHERE tenant_id=$1 AND workspace_id=$2 ORDER BY created_at DESC LIMIT 100`,
    [session.tenant_id, session.workspace_id]
  );
  return r.rows;
}
