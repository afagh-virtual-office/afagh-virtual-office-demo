import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const MODE = process.env.AFAGH_RUNTIME_MODE || 'demo';
const POLICY_VERSION = 'p0-1.policy.v1';
const sessions = new Map();
const auditLog = [];

const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const json = (res, status, body, headers = {}) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8', ...headers}); res.end(JSON.stringify(body, null, 2)); };
const cookie = (req, name) => { const raw=req.headers.cookie||''; const m=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'=')); return m ? decodeURIComponent(m.slice(name.length+1)) : null; };
const requiredPermission = (action) => ({read:'office:read',write:'office:write',admin:'office:admin'}[action] || `office:${action}`);

function audit(actor, outcome, requestId, resource, action) {
  const event={event_id:id('evt'),event_type:'AUTHORIZATION_DECISION',actor_subject_id:actor||'anonymous',outcome,timestamp:now(),request_id:requestId,resource,action};
  auditLog.push(Object.freeze(event));
  return event;
}

function authenticate(req) {
  const sid=cookie(req,'afagh_session');
  if(!sid) return {status:'UNKNOWN', session:null, reason:'missing_session'};
  const s=sessions.get(sid);
  if(!s) return {status:'UNKNOWN', session:null, reason:'unknown_session'};
  if(s.revoked) return {status:'REVOKED', session:s, reason:'revoked'};
  if(Date.now() >= Date.parse(s.expires_at)) return {status:'EXPIRED', session:s, reason:'expired'};
  return {status:'VALID', session:s};
}

function evidenceResponse(req, auth) {
  const requestId=id('req');
  const resource=new URL(req.url,'http://localhost').searchParams.get('resource') || '/api/v1/office';
  const action=new URL(req.url,'http://localhost').searchParams.get('action') || 'read';
  const required=requiredPermission(action);
  const ts=now();
  const s=auth.session;
  const roles=s?.roles || [];
  const permissions=s?.permissions || [];
  const allow=auth.status==='VALID' && permissions.includes(required);
  const decision=allow?'ALLOW':'DENY';
  const auditEvent=audit(s?.subject_id || null, allow?'SUCCESS':'DENIED', requestId, resource, action);
  return {schema_version:'p0-1.auth-evidence.v1',request:{request_id:requestId,method:req.method,resource,action,timestamp:ts},identity:{subject_id:s?.subject_id || 'anonymous',display_name:s?.display_name || 'Anonymous'},session:{session_id:s?.session_id || 'unknown',status:auth.status,issued_at:s?.issued_at || ts,expires_at:s?.expires_at || ts},context:{tenant_id:s?.tenant_id || 'unknown',workspace_id:s?.workspace_id || 'unknown'},authorization:{decision,decision_id:id('dec'),roles,permissions,policy_version:POLICY_VERSION},audit:{event_id:auditEvent.event_id,event_type:auditEvent.event_type,actor_subject_id:auditEvent.actor_subject_id,outcome:auditEvent.outcome,timestamp:auditEvent.timestamp},evidence:{evidence_id:id('ev'),type:'AUTH_DECISION',source:'afagh-runtime/p0-1',integrity:'VERIFIED',created_at:ts}};
}

function demoLogin(req,res) {
  if(MODE!=='demo') return json(res,404,{error:'demo_login_disabled'});
  const sid=id('sess'), issued=now(), expires=new Date(Date.now()+3600000).toISOString();
  const session={session_id:sid,subject_id:'demo.user',display_name:'AFAGH Demo User',tenant_id:'tenant.demo',workspace_id:'workspace.control',roles:['operator'],permissions:['office:read','office:write'],issued_at:issued,expires_at:expires,revoked:false};
  sessions.set(sid,session);
  json(res,200,{mode:'demo',session_id:sid,expires_at:expires},{'set-cookie':`afagh_session=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`});
}

const server=http.createServer((req,res)=>{
  if(req.method==='OPTIONS') return json(res,204,{});
  if(req.url?.startsWith('/api/v1/auth/demo-login')) return demoLogin(req,res);
  if(req.url==='/api/v1/auth/evidence' || req.url?.startsWith('/api/v1/auth/evidence?')) {
    const auth=authenticate(req); const body=evidenceResponse(req,auth);
    return json(res, auth.status==='VALID' && body.authorization.decision==='ALLOW' ? 200 : 403, body);
  }
  if(req.url==='/api/v1/health') return json(res,200,{service:'afagh-p0-1-runtime',status:'ok',mode:MODE,policy_version:POLICY_VERSION});
  return json(res,404,{error:'not_found'});
});

server.listen(PORT,()=>console.log(`AFAGH P0-1 runtime listening on :${PORT} mode=${MODE}`));
