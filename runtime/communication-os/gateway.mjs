import http from 'node:http';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { Pool } from 'pg';
import { createMission, getMissions } from './orchestrator.js';
import { CHANNELS, channelStatus, dispatch } from './channel-adapters.js';
import { providerVerificationPlan, runProviderVerification, sanitizeVerificationResult } from './provider-verification.mjs';

const PORT = Number(process.env.PORT || 8787);
const CORE_PORT = PORT + 1;
const DATABASE_URL = process.env.DATABASE_URL;
const BUILD = process.env.SOURCE_BUILD || 'COMMUNICATION_OS_RUNTIME_0.3.0';
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const pool = new Pool({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false } });
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const recipientRef = value => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0,24);

function send(res, status, body, headers = {}) {
  const h = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'access-control-allow-credentials':'true', ...headers };
  if (process.env.CORS_ORIGIN) h['access-control-allow-origin'] = process.env.CORS_ORIGIN;
  res.writeHead(status, h); res.end(JSON.stringify(body));
}
function cookie(req,n){ const m=(req.headers.cookie||'').match(new RegExp(`(?:^|; )${n}=([^;]+)`)); return m?decodeURIComponent(m[1]):null; }
async function auth(req){
  const sid=cookie(req,'afagh_session'); if(!sid) return null;
  const r=await pool.query('SELECT session_id,subject_id,display_name,tenant_id,workspace_id,roles,permissions,expires_at,revoked_at FROM sessions WHERE session_id=$1',[sid]);
  if(!r.rowCount) return null; const s=r.rows[0];
  if(s.revoked_at||new Date(s.expires_at)<=new Date()) return null; return s;
}
async function body(req){ return await new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});}); }

async function releaseReadiness(){
  const startedAt=now();
  const gates={
    G01:'BLOCKED', G02:'BLOCKED', G03:'BLOCKED', G04:'UNKNOWN',
    G05:'BLOCKED', G06:'BLOCKED', G07:'BLOCKED', G08:'BLOCKED', G09:'BLOCKED'
  };
  const evidence=[]; const blockers=[];
  let dbIdentity=null;
  try {
    const r=await pool.query('SELECT current_database() AS database, current_user AS database_user, current_schema() AS schema');
    dbIdentity=r.rows[0];
    gates.G01='PASS';
    evidence.push({gate:'G01',type:'DB_CONNECTION',status:'PASS',database:r.rows[0].database,schema:r.rows[0].schema});
  } catch(e){ blockers.push({gate:'G01',reason:'DB_CONNECTION_FAILED'}); }

  if(gates.G01==='PASS'){
    try {
      const r=await pool.query("SELECT to_regclass('public.schema_migrations') AS table_name");
      if(r.rows[0].table_name){
        const c=await pool.query('SELECT COUNT(*)::int AS count FROM schema_migrations');
        gates.G02=c.rows[0].count>0?'PASS':'BLOCKED';
        evidence.push({gate:'G02',type:'MIGRATION_STATE',status:gates.G02,migration_rows:c.rows[0].count});
        if(gates.G02!=='PASS') blockers.push({gate:'G02',reason:'NO_APPLIED_MIGRATIONS'});
      } else blockers.push({gate:'G02',reason:'SCHEMA_MIGRATIONS_MISSING'});
    } catch(e){ blockers.push({gate:'G02',reason:'MIGRATION_PROBE_FAILED'}); }
  }

  try {
    const required=['provider_verification_runs','channel_operations'];
    const r=await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])",[required]);
    const names=new Set(r.rows.map(x=>x.table_name));
    if(names.has('provider_verification_runs') && names.has('channel_operations')){
      gates.G03='PASS'; evidence.push({gate:'G03',type:'COMMUNICATION_CORE',status:'PASS'});
      gates.G06='UNKNOWN';
    } else blockers.push({gate:'G03',reason:'COMMUNICATION_SCHEMA_INCOMPLETE'});
  } catch(e){ blockers.push({gate:'G03',reason:'COMMUNICATION_SCHEMA_PROBE_FAILED'}); }

  try {
    const r=await pool.query('SELECT COUNT(*)::int AS count FROM provider_verification_runs WHERE created_at > now() - interval \'24 hours\' AND production_verified=true');
    if(r.rows[0].count>0){ gates.G04='PASS'; evidence.push({gate:'G04',type:'PROVIDER_VERIFICATION',status:'PASS',verified_runs:r.rows[0].count}); }
    else evidence.push({gate:'G04',type:'PROVIDER_VERIFICATION',status:'UNKNOWN',verified_runs:0});
  } catch(e){ blockers.push({gate:'G04',reason:'PROVIDER_EVIDENCE_PROBE_FAILED'}); }

  try {
    const r=await pool.query('SELECT COUNT(*)::int AS count FROM provider_verification_runs WHERE created_at > now() - interval \'24 hours\'');
    if(r.rows[0].count>0){ gates.G06='PASS'; evidence.push({gate:'G06',type:'EVIDENCE_PERSISTENCE',status:'PASS',recent_records:r.rows[0].count}); }
  } catch(e){ blockers.push({gate:'G06',reason:'EVIDENCE_PERSISTENCE_PROBE_FAILED'}); }

  const finishedAt=now();
  return {schema_version:'afagh-release-readiness.v1',build:BUILD,release_head:process.env.SOURCE_BUILD||'UNKNOWN',started_at:startedAt,finished_at:finishedAt,gates,evidence,blockers,db_identity:dbIdentity,security:{status:'BLOCKED',reason:'requires controlled authenticated security evidence'},virtual_expert:{status:'BLOCKED',reason:'requires G05 authorization evidence'},commercial_activation:{status:'BLOCKED',requires:'G08_PASS_AND_FOUR_TEAM_APPROVAL'}};
}

function proxy(req,res){
  const p=http.request({hostname:'127.0.0.1',port:CORE_PORT,path:req.url,method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode||500,r.headers);r.pipe(res);});
  p.on('error',()=>send(res,502,{error:'CORE_RUNTIME_UNAVAILABLE'}));
  req.pipe(p);
}

async function main(req,res){
  const u=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='OPTIONS') return send(res,204,{}, {'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'});
  if(req.method==='GET' && u.pathname==='/api/v1/release/readiness') {
    try { const result=await releaseReadiness(); return send(res,200,result); }
    catch(e){ return send(res,500,{schema_version:'afagh-release-readiness.v1',status:'BLOCKED',error:'READINESS_PROBE_FAILED'}); }
  }
  if(req.method==='GET' && u.pathname==='/api/v1/communication/channels') {
    return send(res,200,{service:'afagh-communication-os-runtime',build:BUILD,status:'CONTROLLED',channels:channelStatus()});
  }
  if(req.method==='GET' && u.pathname==='/api/v1/communication/provider-tests') {
    return send(res,200,{service:'afagh-communication-os-runtime',build:BUILD,harness:'provider-verification-v1',mode:'CONTROLLED',tests:providerVerificationPlan()});
  }
  const s=await auth(req);
  if(req.method==='POST' && u.pathname==='/api/v1/missions') {
    try { const b=await body(req); if(!b.command) return send(res,422,{error:'COMMAND_REQUIRED'}); const mission=await createMission(pool,s,b.command,b.channels); return send(res,201,{mission,evidence:{state:'CONTROLLED',production_verified:false,correlation_id:mission.correlation_id}}); }
    catch(e){ return send(res,e.statusCode||500,{error:e.message||'MISSION_CREATE_FAILED'}); }
  }
  if(req.method==='GET' && u.pathname==='/api/v1/missions') {
    try { return send(res,200,{items:await getMissions(pool,s)}); } catch(e){ return send(res,e.statusCode||500,{error:e.message||'MISSION_LIST_FAILED'}); }
  }
  if(req.method==='POST' && u.pathname==='/api/v1/communication/provider-tests/run') {
    if(!s) return send(res,401,{error:'AUTHENTICATION_REQUIRED'});
    let b; try{b=await body(req)}catch{return send(res,400,{error:'INVALID_JSON'});}
    if(!b.channel || !b.recipient) return send(res,422,{error:'HARNESS_CONTRACT_VIOLATION',missing:['channel','recipient'].filter(k=>!b[k])});
    const correlationId=b.correlation_id||id(); const startedAt=now();
    const result=await runProviderVerification({channel:b.channel,recipient:b.recipient,payload:b.payload||{},confirm:b.confirm===true,correlation_id:correlationId,dry_run:b.dry_run===true});
    const finishedAt=now(); const sanitized=sanitizeVerificationResult(result);
    const evidence={evidence_id:id(),type:'PROVIDER_VERIFICATION',state:result.ok?'CONTROLLED':'BLOCKED',production_verified:Boolean(result.ok&&result.state==='DELIVERED'),provider_verified:Boolean(result.ok&&result.state==='DELIVERED'),channel:b.channel,provider:result.provider||null,correlation_id:correlationId,started_at:startedAt,finished_at:finishedAt,result:sanitized};
    try { await pool.query(`INSERT INTO provider_verification_runs(verification_id,tenant_id,workspace_id,channel,provider,recipient_ref,state,provider_message_id,provider_call_id,provider_status,provider_code,correlation_id,started_at,finished_at,production_verified,result) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,[evidence.evidence_id,s.tenant_id,s.workspace_id,b.channel,result.provider||null,recipientRef(b.recipient),result.state||'BLOCKED',result.provider_message_id||null,result.provider_call_id||null,result.provider_status||null,result.provider_code||null,correlationId,startedAt,finishedAt,evidence.production_verified,sanitized]); }
    catch(e) { return send(res,500,{error:'EVIDENCE_PERSISTENCE_FAILED',correlation_id:correlationId}); }
    try { if(b.mission_id) await pool.query('UPDATE missions SET updated_at=now() WHERE mission_id=$1 AND tenant_id=$2 AND workspace_id=$3',[b.mission_id,s.tenant_id,s.workspace_id]); } catch {}
    return send(res,result.state==='DELIVERED'?200:409,{harness:'provider-verification-v1',operation:{channel:b.channel,correlation_id:correlationId,state:result.state,delivery:result.ok?'DELIVERED':'NOT_EXECUTED'},result:sanitized,evidence});
  }
  if(req.method==='GET' && u.pathname==='/api/v1/communication/provider-tests/evidence') {
    if(!s) return send(res,401,{error:'AUTHENTICATION_REQUIRED'});
    const r=await pool.query(`SELECT verification_id,channel,provider,recipient_ref,state,provider_message_id,provider_call_id,provider_status,provider_code,correlation_id,started_at,finished_at,production_verified,created_at FROM provider_verification_runs WHERE tenant_id=$1 AND workspace_id=$2 ORDER BY created_at DESC LIMIT 100`,[s.tenant_id,s.workspace_id]);
    return send(res,200,{items:r.rows,count:r.rowCount,auth:'VALID'});
  }
  if(req.method==='POST' && u.pathname==='/api/v1/communication/operations/dispatch') {
    if(!s) return send(res,401,{error:'AUTHENTICATION_REQUIRED'});
    let b; try{b=await body(req)}catch{return send(res,400,{error:'INVALID_JSON'});} 
    const required=['channel','direction','recipient','policy']; const missing=required.filter(k=>b[k]===undefined); if(missing.length) return send(res,422,{error:'CONTRACT_VIOLATION',missing});
    const operationId=id(), correlationId=b.correlation_id||id(), key=b.idempotency_key||`${b.channel}:${b.recipient}:${correlationId}`;
    try { await pool.query(`INSERT INTO channel_operations(operation_id,mission_id,tenant_id,workspace_id,channel,direction,recipient,state,correlation_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,'PLANNED',$8,$9)`,[operationId,b.mission_id||null,s.tenant_id,s.workspace_id,b.channel,b.direction,b.recipient,correlationId,key]); const result=await dispatch({channel:b.channel,direction:b.direction,recipient:b.recipient,payload:b.payload||{},policy:b.policy}); const state=result.ok?'DELIVERED':result.state==='NOT_LIVE'?'NOT_LIVE':'BLOCKED'; await pool.query(`UPDATE channel_operations SET state=$1,error_code=$2,updated_at=now() WHERE operation_id=$3`,[state,result.ok?null:result.reason,operationId]); return send(res,result.ok?200:409,{operation:{operation_id:operationId,correlation_id:correlationId,channel:b.channel,state,delivery:result.ok?'DELIVERED':'NOT_EXECUTED'},result,evidence:{state:'CONTROLLED',production_verified:false,correlation_id:correlationId}}); }
    catch(e){ if(e.code==='23505') return send(res,409,{error:'IDEMPOTENCY_CONFLICT'}); return send(res,500,{error:'CHANNEL_OPERATION_FAILED'}); }
  }
  if(req.method==='GET' && u.pathname==='/api/v1/communication/operations') {
    if(!s) return send(res,401,{error:'AUTHENTICATION_REQUIRED'}); const r=await pool.query(`SELECT * FROM channel_operations WHERE tenant_id=$1 AND workspace_id=$2 ORDER BY created_at DESC LIMIT 100`,[s.tenant_id,s.workspace_id]); return send(res,200,{items:r.rows,count:r.rowCount,auth:'VALID'});
  }
  return proxy(req,res);
}

const child=spawn(process.execPath,['server-core.js'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:String(CORE_PORT),SOURCE_BUILD:BUILD},stdio:['ignore','inherit','inherit']});
child.on('exit',code=>{if(code&&code!==0) process.exitCode=code;});
http.createServer((req,res)=>main(req,res).catch(e=>{console.error(e);send(res,500,{error:'internal_error'});})).listen(PORT,()=>console.log(`Communication OS gateway :${PORT}; core :${CORE_PORT}; build ${BUILD}`));
const shutdown=async()=>{child.kill('SIGTERM');await pool.end();process.exit(0)};
process.on('SIGTERM',shutdown); process.on('SIGINT',shutdown);
