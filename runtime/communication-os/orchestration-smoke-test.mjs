import assert from 'node:assert/strict';
import { classifyIntent, riskForIntent, MISSION_STATES } from './orchestrator.js';
import { CHANNELS, channelStatus, dispatch } from './channel-adapters.js';

assert.equal(CHANNELS.length, 9);
assert.equal(classifyIntent('ارسال پیام در تلگرام').intent, 'TELEGRAM_OUTREACH');
assert.equal(classifyIntent('برای واردکننده‌ها تحلیل انجام بده').intent, 'IMPORTER_INTELLIGENCE');
assert.equal(riskForIntent('CAMPAIGN'), 'HIGH');
assert.ok(MISSION_STATES.EXECUTING.includes('WAITING_PROVIDER'));
assert.equal(channelStatus().every(c => c.status === 'NOT_CONFIGURED' || c.status === 'READY_FOR_PROVIDER_TEST'), true);

const denied = await dispatch({ channel:'telegram', direction:'outbound', recipient:'x', payload:{text:'test'}, policy:{decision:'DENY'} });
assert.equal(denied.state, 'BLOCKED');

console.log(JSON.stringify({
  contract:'AFAGH Virtual Office orchestration/channel runtime',
  channels:CHANNELS.map(c=>c.id),
  checks:'PASS',
  production_verified:false
}, null, 2));
