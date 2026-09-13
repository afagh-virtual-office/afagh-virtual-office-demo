const base = process.env.BASE_URL || 'http://localhost:8787';
async function post(path, body){const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
const correlation_id='smoke-'+Date.now();
const denied=await post('/api/v1/communication/policy/decide',{correlation_id});
if(denied.status!==403 || denied.body.policy_decision?.decision!=='DENY') throw new Error('COM-C05 fail-closed test failed');
const event=await post('/api/v1/communication/events',{communication_id:'smoke-call',channel:'VOICE',actor:'agent:test',participants:['contact:test'],tenant:'controlled',workspace:'communication',region:'IRAN',correlation_id,policy_decision_id:'pd-test',authorization_decision_id:'auth-test'});
if(event.status!==201 || event.body.event?.lifecycle_state!=='OFFERED') throw new Error('COM-C03 creation test failed');
const ai=await post('/api/v1/communication/actions',{agent_id:'ai:test',risk_tier:'HIGH',policy_version:'v0.1',approval:'NONE',tool_scope:['communication:recommend'],model:'controlled-model',correlation_id,idempotency_key:'smoke-key'});
if(ai.status!==403 || ai.body.error!=='FAIL_CLOSED') throw new Error('COM-C04 approval boundary failed');
console.log(JSON.stringify({status:'PASS',tests:['policy-deny-by-default','event-contract','ai-approval-boundary'],production_verified:false},null,2));
