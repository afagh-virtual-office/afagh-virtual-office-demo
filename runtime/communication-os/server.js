import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const BUILD = process.env.SOURCE_BUILD || 'CONTROLLED_RUNTIME_0.1.0';
const events = new Map();
const actions = new Map();

const STATES = {
  communication: new Set(['OFFERED','ROUTING','QUEUED','RINGING','CONNECTED','ACTIVE','TRANSFERRING','COMPLETED','MISSED','REJECTED','FAILED','CANCELLED','BLOCKED']),
  ai: new Set(['RECOMMENDATION','DECISION_PROPOSAL','APPROVED_ACTION','EXECUTING','COMPLETED','DENIED','EXPIRED','CANCELLED','FAILED','BLOCKED'])
};

const transitions = {
  OFFERED:['ROUTING','REJECTED','CANCELLED','BLOCKED'], ROUTING:['QUEUED','RINGING','FAILED','BLOCKED'],
  QUEUED:['RINGING','CANCELLED','BLOCKED'], RINGING:['CONNECTED','MISSED','REJECTED','FAILED'],
  CONNECTED:['ACTIVE','TRANSFERRING','COMPLETED','FAILED'], ACTIVE:['TRANSFERRING','COMPLETED','FAILED'],
  TRANSFERRING:['RINGING','ACTIVE','FAILED'], COMPLETED:[], MISSED:[], REJECTED:[], FAILED:[], CANCELLED:[], BLOCKED:[]
};

function json(res, status, body) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
  res.end(JSON.stringify(body));
}
function read(req) { return new Promise((resolve,reject)=>{let s=''; req.on('data',c=>s+=c); req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});}); }
function id(prefix){return `${prefix}_${crypto.randomUUID()}`;}
function evidence(correlation_id, state='CONTROLLED') { return {evidence_id:id('ev'), evidence_type:'runtime_event', source:'communication-os-runtime', verifier:'runtime-contract-engine', state, integrity:'UNSIGNED_CONTROLLED', provenance:'server-generated', correlation_id, source_build:BUILD, generated_at:new Date().toISOString(), verified_at:null}; }
function policy(body){
  const required=['subject','identity_class','capability','resource','data_class','action','tenant','workspace','region','assurance','policy_version'];
  if(required.some(k=>!body[k])) return {decision:'DENY',reason:'MISSING_AUTHORITATIVE_CONTEXT'};
  if(!['IRAN','CHINA'].includes(body.region)) return {decision:'DENY',reason:'REGION_NOT_ALLOWED'};
  return {decision:'ALLOW',reason:'CONTROLLED_POLICY_MATCH'};
}

async function handler(req,res){
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='GET' && url.pathname==='/api/v1/communication/health') return json(res,200,{status:'CONTROLLED',runtime:'communication-os',build:BUILD,production_verified:false});
  if(req.method==='GET' && url.pathname==='/api/v1/communication/events') return json(res,200,{items:[...events.values()],count:events.size});
  if(req.method==='GET' && url.pathname==='/api/v1/communication/actions') return json(res,200,{items:[...actions.values()],count:actions.size});
  if(req.method!=='POST') return json(res,404,{error:'NOT_FOUND'});
  let body; try{body=await read(req)}catch{return json(res,400,{error:'INVALID_JSON'});}

  if(url.pathname==='/api/v1/communication/policy/decide') {
    const decision=policy(body); const record={decision_id:id('pd'),...body,...decision,timestamp:new Date().toISOString()};
    return json(res,decision.decision==='ALLOW'?200:403,{policy_decision:record,evidence:evidence(body.correlation_id||id('corr'))});
  }

  if(url.pathname==='/api/v1/communication/events') {
    const required=['communication_id','channel','actor','participants','tenant','workspace','region','correlation_id','policy_decision_id','authorization_decision_id'];
    const missing=required.filter(k=>!body[k]); if(missing.length) return json(res,422,{error:'CONTRACT_VIOLATION',contract:'COM-C03',missing});
    const event={event_id:id('evt'),...body,lifecycle_state:'OFFERED',source_build:BUILD,timestamp:new Date().toISOString()}; events.set(event.event_id,event);
    return json(res,201,{event,evidence:evidence(event.correlation_id)});
  }

  if(url.pathname.startsWith('/api/v1/communication/events/') && url.pathname.endsWith('/transition')) {
    const eventId=url.pathname.split('/')[5]; const event=events.get(eventId); if(!event) return json(res,404,{error:'EVENT_NOT_FOUND'});
    const next=body.state; if(!STATES.communication.has(next) || !transitions[event.lifecycle_state]?.includes(next)) return json(res,409,{error:'INVALID_STATE_TRANSITION',from:event.lifecycle_state,to:next});
    event.lifecycle_state=next; event.timestamp=new Date().toISOString(); events.set(eventId,event); return json(res,200,{event,evidence:evidence(event.correlation_id)});
  }

  if(url.pathname==='/api/v1/communication/actions') {
    const required=['agent_id','risk_tier','policy_version','approval','tool_scope','model','correlation_id','idempotency_key'];
    const missing=required.filter(k=>!body[k]); if(missing.length) return json(res,422,{error:'CONTRACT_VIOLATION',contract:'COM-C04',missing});
    if(body.approval!=='HUMAN_APPROVED' && body.risk_tier!=='LOW') return json(res,403,{error:'FAIL_CLOSED',reason:'APPROVAL_REQUIRED'});
    const action={action_id:id('act'),...body,action_state:'APPROVED_ACTION',timestamp:new Date().toISOString()}; actions.set(action.action_id,action);
    return json(res,201,{action,evidence:evidence(action.correlation_id)});
  }

  return json(res,404,{error:'NOT_FOUND'});
}

http.createServer(handler).listen(PORT,()=>console.log(`Communication OS runtime listening on ${PORT}`));
