import http from 'node:http';
import crypto from 'node:crypto';
import { Pool } from 'pg';
import { runControlledJourney } from './controlled-journey.mjs';

const PUBLIC_PORT = Number(process.env.PORT || 8787);
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const KEYWORDS = [
  { domain:'sourcing', skills:['supplier-discovery','supplier-evaluation','rfq-draft'], terms:['sourcing','supplier','procurement','rfq','چین','تأمین','تامین','خرید خارجی','استعلام تامین'] },
  { domain:'sales', skills:['lead-qualification','sales-response','follow-up-draft'], terms:['sales','customer','lead','فروش','مشتری','فروشنده','سرنخ'] },
  { domain:'logistics', skills:['route-analysis','shipment-status','logistics-escalation'], terms:['logistics','shipping','shipment','customs','حمل','ارسال','محموله','گمرک','بار'] },
  { domain:'finance', skills:['commercial-risk','payment-analysis','financing-draft'], terms:['finance','payment','funding','credit','ریسک مالی','پرداخت','تأمین مالی','تامین مالی'] },
  { domain:'compliance', skills:['policy-review','authorization-review','risk-escalation'], terms:['compliance','policy','authorization','قانون','مجوز','مقررات','اعتبارسنجی'] },
  { domain:'communication', skills:['channel-routing','message-orchestration','delivery-analysis'], terms:['communication','message','whatsapp','telegram','instagram','پیام','ارتباط','واتساپ','تلگرام','اینستاگرام'] },
  { domain:'customer-success', skills:['issue-triage','faq-response','escalation'], terms:['support','retention','complaint','پشتیبانی','شکایت','رضایت','پیگیری'] },
  { domain:'trade', skills:['trade-intelligence','market-analysis','supplier-buyer-matching'], terms:['trade','import','export','market','بازار','تجارت','واردات','صادرات','قیمت'] },
];

function analyzeRequest(request) {
  const normalized = String(request).trim().toLowerCase();
  if (!normalized) throw new Error('BUSINESS_REQUEST_REQUIRED');
  const ranked = KEYWORDS.map(rule => ({
    ...rule,
    hits: rule.terms.filter(term => normalized.includes(term.toLowerCase())).length,
  })).sort((a,b) => b.hits - a.hits);
  const winner = ranked[0].hits > 0 ? ranked[0] : KEYWORDS[7];
  const urgency = /urgent|asap|فوری|ضروری/.test(normalized) ? 'HIGH' : 'NORMAL';
  const objective = winner.domain === 'sourcing' ? 'SOURCE_AND_EVALUATE_SUPPLIERS'
    : winner.domain === 'sales' ? 'QUALIFY_AND_RESPOND_TO_CUSTOMER'
    : winner.domain === 'logistics' ? 'ANALYZE_AND_COORDINATE_SHIPMENT'
    : winner.domain === 'finance' ? 'REVIEW_COMMERCIAL_FINANCIAL_RISK'
    : winner.domain === 'compliance' ? 'REVIEW_POLICY_AND_AUTHORIZATION'
    : winner.domain === 'communication' ? 'ORCHESTRATE_BUSINESS_COMMUNICATION'
    : winner.domain === 'customer-success' ? 'TRIAGE_AND_FOLLOW_UP'
    : 'ANALYZE_TRADE_OPPORTUNITY';
  return {
    engine: 'golden-path-analysis-v1',
    mode: 'deterministic-baseline',
    request_language: /[\u0600-\u06FF]/.test(request) ? 'fa' : 'en',
    domain: winner.domain,
    skills: winner.skills,
    urgency,
    commercial_objective: objective,
    signal_count: winner.hits,
    confidence: winner.hits > 0 ? Math.min(0.97, 0.62 + winner.hits * 0.09) : 0.51,
    constraints: ['No sensitive personal profiling','No external side effect in Golden Path response stage','Policy and authorization remain mandatory'],
  };
}

function buildResponse({ request, analysis, expert }) {
  const next = {
    sourcing:'supplier discovery and evaluation',
    sales:'customer qualification and follow-up',
    logistics:'route/shipment assessment and escalation',
    finance:'commercial payment and risk review',
    compliance:'policy and authorization review',
    communication:'approved-channel communication orchestration',
    'customer-success':'issue triage and follow-up',
    trade:'Iran-China trade opportunity analysis',
  }[analysis.domain];
  return `درخواست کاری شما توسط ${expert.name} تحلیل شد. حوزه تشخیص‌داده‌شده: ${analysis.domain}. اقدام پیشنهادی بعدی: ${next}. این پاسخ در Golden Business Request Path تولید شده و برای اجرای اقدام خارجی، نیازمند Policy/Authorization و Evidence مستقل است.`;
}

function json(res,status,body,headers={}) {
  res.writeHead(status,{ 'content-type':'application/json; charset=utf-8','cache-control':'no-store', ...headers });
  res.end(JSON.stringify(body));
}
function cookie(req,name) {
  const m=(req.headers.cookie||'').match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
async function authenticate(pool, req) {
  const sessionId = cookie(req,'afagh_session');
  if (!sessionId) return null;
  const r = await pool.query('SELECT session_id,subject_id,display_name,tenant_id,workspace_id,roles,permissions,expires_at,revoked_at FROM sessions WHERE session_id=$1',[sessionId]);
  if (!r.rowCount) return null;
  const s=r.rows[0];
  if (s.revoked_at || new Date(s.expires_at) <= new Date()) return null;
  return s;
}
async function readJson(req,maxBytes=32768){
  return await new Promise((resolve,reject)=>{
    let size=0; let raw='';
    req.on('data',chunk=>{ size += chunk.length; if(size>maxBytes){ reject(Object.assign(new Error('REQUEST_TOO_LARGE'),{status:413})); req.destroy(); return;} raw += chunk; });
    req.on('end',()=>{ try { resolve(raw?JSON.parse(raw):{}); } catch { reject(Object.assign(new Error('INVALID_JSON'),{status:400})); } });
    req.on('error',reject);
  });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized:false } });

async function handleGolden(pool,req,res,u) {
  const session = await authenticate(pool,req);
  if (!session) return json(res,401,{error:'AUTHENTICATION_REQUIRED'});
  if (!(session.permissions||[]).includes('office:write') && !(session.permissions||[]).includes('office:admin')) return json(res,403,{error:'OFFICE_WRITE_PERMISSION_REQUIRED'});
  const payload = await readJson(req);
  const request = String(payload.request||payload.command||'').trim();
  if (!request) return json(res,422,{error:'BUSINESS_REQUEST_REQUIRED'});
  const correlationId = payload.correlation_id || id();
  const startedAt = now();
  const analysis = analyzeRequest(request);
  const journey = runControlledJourney({
    correlationId,
    workspaceId: session.workspace_id,
    domain: payload.domain || analysis.domain,
    skills: payload.skills || analysis.skills,
    requestedLevel: 'RECOMMEND_DRAFT',
    actionRisk: 'NONE',
    actor: session.subject_id,
    identity: session.subject_id,
    context: { tenantId: session.tenant_id, workspaceId: session.workspace_id },
    intent: `BUSINESS_REQUEST:${analysis.commercial_objective}`,
    commercialActivationAuthorized: false,
  });
  if (!journey.ok) return json(res,409,{state:'BLOCKED',correlation_id:correlationId,stage:journey.stage,reason:journey.reason,journey});
  const expert = { expert_id: journey.stages.expertSelection.expertId, score: journey.stages.expertSelection.score };
  const proposedResponse = buildResponse({request,analysis,expert:{name:expert.expert_id}});
  const authorization = (session.permissions||[]).includes('office:write') || (session.permissions||[]).includes('office:admin')
    ? 'AUTHORIZED_FOR_GOLDEN_PATH'
    : 'DENY';
  const finishedAt = now();
  const result = {
    request,
    identity: { subject_id:session.subject_id, display_name:session.display_name },
    context: { tenant_id:session.tenant_id, workspace_id:session.workspace_id },
    intent: analysis.commercial_objective,
    expert_routing: journey.stages.expertSelection,
    analysis,
    proposed_response: proposedResponse,
    policy: journey.stages.policy,
    authorization: { decision: authorization },
    execution: { state:'EXECUTED', side_effect:false, mode:'INTERNAL_RESPONSE' },
    communication: { channel:'HTTP_RESPONSE', state:'RESPONDED' },
    result: { status:'SUCCESS', response:proposedResponse },
    correlation_id:correlationId,
    evidence: { state:'RUNTIME_GENERATED_PENDING_VERIFIER', release_head:process.env.SOURCE_BUILD||'UNKNOWN' },
    started_at:startedAt,
    finished_at:finishedAt,
  };
  await pool.query(`INSERT INTO golden_business_requests
    (request_id,tenant_id,workspace_id,actor_subject_id,request_text,domain,expert_id,expert_score,analysis,proposed_response,policy_decision,authorization_decision,execution_state,communication_channel,communication_state,result_status,correlation_id,evidence_state,release_head,started_at,finished_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,[
      id(),session.tenant_id,session.workspace_id,session.subject_id,request,analysis.domain,expert.expert_id,expert.score,JSON.stringify(analysis),proposedResponse,journey.stages.policy.decision,authorization,'EXECUTED','HTTP_RESPONSE','RESPONDED','SUCCESS',correlationId,'RUNTIME_GENERATED_PENDING_VERIFIER',process.env.SOURCE_BUILD||'UNKNOWN',startedAt,finishedAt
    ]);
  return json(res,200,{golden_path:'PASS',...result});
}

async function readEvidence(pool,req,res) {
  const session = await authenticate(pool,req);
  if (!session) return json(res,401,{error:'AUTHENTICATION_REQUIRED'});
  const r = await pool.query(`SELECT request_id,request_text,domain,expert_id,expert_score,policy_decision,authorization_decision,execution_state,communication_channel,communication_state,result_status,correlation_id,evidence_state,release_head,started_at,finished_at,created_at FROM golden_business_requests WHERE tenant_id=$1 AND workspace_id=$2 ORDER BY created_at DESC LIMIT 100`,[session.tenant_id,session.workspace_id]);
  return json(res,200,{items:r.rows,count:r.rowCount,auth:'VALID'});
}

async function main(req,res){
  const u=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='OPTIONS') return json(res,204,{}, {'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'});
  if(req.method==='GET'&&u.pathname==='/api/v1/golden/health') return json(res,200,{service:'afagh-golden-business-request-runtime',status:'CONTROLLED',port:PUBLIC_PORT,build:process.env.SOURCE_BUILD||'UNKNOWN'});
  if(req.method==='POST'&&u.pathname==='/api/v1/golden/business-request') { try { return await handleGolden(pool,req,res,u); } catch(e){ console.error(e); return json(res,e.status||500,{error:e.message||'GOLDEN_PATH_FAILED'}); } }
  if(req.method==='GET'&&u.pathname==='/api/v1/golden/business-request/evidence') { try { return await readEvidence(pool,req,res); } catch(e){ console.error(e); return json(res,500,{error:'GOLDEN_EVIDENCE_READ_FAILED'}); } }
  const targetPort = Number(process.env.COMMUNICATION_GATEWAY_PORT || (PUBLIC_PORT+1));
  const p=http.request({hostname:'127.0.0.1',port:targetPort,path:req.url,method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode||500,r.headers);r.pipe(res);});
  p.on('error',()=>json(res,502,{error:'COMMUNICATION_GATEWAY_UNAVAILABLE'}));
  req.pipe(p);
}

http.createServer((req,res)=>main(req,res).catch(e=>{console.error(e);json(res,500,{error:'internal_error'});})).listen(PUBLIC_PORT,'0.0.0.0',()=>console.log(`Golden Business Request Path listening on :${PUBLIC_PORT}`));
