import http from 'node:http';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { Pool } from 'pg';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const PORT = Number(process.env.PORT || 8787);
const DATABASE_URL = process.env.DATABASE_URL;
const OIDC_ISSUER = process.env.OIDC_ISSUER;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI;
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 3600);
const POLICY_VERSION = 'p0-1.policy.v1';

if (!DATABASE_URL || !OIDC_ISSUER || !OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET || !OIDC_REDIRECT_URI) {
  throw new Error('Missing required production environment configuration');
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false } });
const oidcIssuer = OIDC_ISSUER.replace(/\/$/, '');
const jwks = createRemoteJWKSet(new URL(`${oidcIssuer}/.well-known/jwks.json`));
const sessions = new Map(); // only transient PKCE state; authenticated sessions live in PostgreSQL.

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const json = (res, status, body, headers = {}) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8', ...headers}); res.end(JSON.stringify(body)); };
const parseCookies = req => Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(x => { const i=x.indexOf('='); return [x.slice(0,i).trim(), decodeURIComponent(x.slice(i+1))]; }));
const requiredPermission = action => ({read:'office:read',write:'office:write',admin:'office:admin'}[action] || `office:${action}`);

async function discovery() {
  const r = await fetch(`${oidcIssuer}/.well-known/openid-configuration`);
  if (!r.ok) throw new Error(`OIDC discovery failed: ${r.status}`);
  return r.json();
}

async function login(req, res) {
  const d = await discovery();
  const state = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  sessions.set(state, { verifier, expires: Date.now() + 10 * 60 * 1000 });
  const u = new URL(d.authorization_endpoint);
  u.searchParams.set('response_type','code');
  u.searchParams.set('client_id',OIDC_CLIENT_ID);
  u.searchParams.set('redirect_uri',OIDC_REDIRECT_URI);
  u.searchParams.set('scope','openid profile email');
  u.searchParams.set('state',state);
  u.searchParams.set('code_challenge',challenge);
  u.searchParams.set('code_challenge_method','S256');
  res.writeHead(302,{Location:u.toString(), 'cache-control':'no-store'}); res.end();
}

async function callback(req, res) {
  const u = new URL(req.url,'http://localhost');
  const state=u.searchParams.get('state'), code=u.searchParams.get('code');
  const pending=sessions.get(state); sessions.delete(state);
  if(!state || !code || !pending || pending.expires < Date.now()) return json(res,400,{error:'invalid_oidc_callback'});
  const d=await discovery();
  const tokenRes=await fetch(d.token_endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:OIDC_REDIRECT_URI,client_id:OIDC_CLIENT_ID,client_secret:OIDC_CLIENT_SECRET,code_verifier:pending.verifier})});
  if(!tokenRes.ok) return json(res,401,{error:'token_exchange_failed'});
  const tokens=await tokenRes.json();
  if(!tokens.id_token) return json(res,401,{error:'missing_id_token'});
  const {payload}=await jwtVerify(tokens.id_token,jwks,{issuer:oidcIssuer,audience:OIDC_CLIENT_ID});
  const subject=String(payload.sub);
  const displayName=String(payload.name || payload.preferred_username || payload.email || subject);
  const email=payload.email ? String(payload.email) : null;
  const membership=await pool.query('SELECT tenant_id, workspace_id, roles, permissions FROM tenant_memberships WHERE subject_id=$1 ORDER BY tenant_id, workspace_id LIMIT 1',[subject]);
  if(!membership.rowCount) return json(res,403,{error:'tenant_membership_required'});
  const m=membership.rows[0];
  const sid=id();
  await pool.query('INSERT INTO sessions(session_id,subject_id,display_name,tenant_id,workspace_id,roles,permissions,issued_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,now(),now()+($8 || \' seconds\')::interval)',[sid,subject,displayName,m.tenant_id,m.workspace_id,m.roles,m.permissions,SESSION_TTL_SECONDS]);
  const cookie=`afagh_session=${encodeURIComponent(sid)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
  res.writeHead(302,{'set-cookie':cookie,Location:'/auth-evidence.html','cache-control':'no-store'}); res.end();
}

async function logout(req,res){ const sid=parseCookies(req).afagh_session; if(sid) await pool.query('UPDATE sessions SET revoked_at=now() WHERE session_id=$1',[sid]); json(res,200,{status:'signed_out'},{'set-cookie':'afagh_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'}); }

async function authenticate(req){
  const sid=parseCookies(req).afagh_session;
  if(!sid) return {status:'UNKNOWN',session:null};
  const r=await pool.query('SELECT session_id,subject_id,display_name,tenant_id,workspace_id,roles,permissions,issued_at,expires_at,revoked_at FROM sessions WHERE session_id=$1',[sid]);
  if(!r.rowCount) return {status:'UNKNOWN',session:null};
  const s=r.rows[0];
  if(s.revoked_at) return {status:'REVOKED',session:s};
  if(new Date(s.expires_at).getTime() <= Date.now()) return {status:'EXPIRED',session:s};
  return {status:'VALID',session:s};
}

async function audit(actor, tenant, workspace, outcome, requestId, resource, action){
  const eventId=id();
  await pool.query('INSERT INTO audit_events(event_id,request_id,actor_subject_id,tenant_id,workspace_id,event_type,resource,action,outcome,timestamp) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now())',[eventId,requestId,actor||'anonymous',tenant||'unknown',workspace||'unknown','AUTHORIZATION_DECISION',resource,action,outcome]);
  return {event_id:eventId,event_type:'AUTHORIZATION_DECISION',actor_subject_id:actor||'anonymous',outcome,timestamp:now()};
}

async function evidence(req,res){
  const auth=await authenticate(req); const u=new URL(req.url,'http://localhost');
  const resource=u.searchParams.get('resource') || '/api/v1/office'; const action=u.searchParams.get('action') || 'read';
  const requestId=id(); const ts=now(); const s=auth.session; const required=requiredPermission(action);
  const allow=auth.status==='VALID' && (s.permissions||[]).includes(required);
  const auditEvent=await audit(s?.subject_id,s?.tenant_id,s?.workspace_id,allow?'SUCCESS':'DENIED',requestId,resource,action);
  const body={schema_version:'p0-1.auth-evidence.v1',request:{request_id:requestId,method:req.method,resource,action,timestamp:ts},identity:{subject_id:s?.subject_id||'anonymous',display_name:s?.display_name||'Anonymous'},session:{session_id:s?.session_id||'unknown',status:auth.status,issued_at:s?.issued_at?new Date(s.issued_at).toISOString():ts,expires_at:s?.expires_at?new Date(s.expires_at).toISOString():ts},context:{tenant_id:s?.tenant_id||'unknown',workspace_id:s?.workspace_id||'unknown'},authorization:{decision:allow?'ALLOW':'DENY',decision_id:id(),roles:s?.roles||[],permissions:s?.permissions||[],policy_version:POLICY_VERSION},audit:auditEvent,evidence:{evidence_id:id(),type:'AUTH_DECISION',source:'afagh-runtime/p0-1',integrity:'VERIFIED',created_at:ts}};
  json(res,allow?200:403,body,{'cache-control':'no-store'});
}

const server=http.createServer(async(req,res)=>{try{
  if(req.method==='GET' && req.url==='/api/v1/auth/login') return login(req,res);
  if(req.method==='GET' && req.url?.startsWith('/api/v1/auth/callback')) return callback(req,res);
  if(req.method==='POST' && req.url==='/api/v1/auth/logout') return logout(req,res);
  if(req.method==='GET' && (req.url==='/api/v1/auth/evidence' || req.url?.startsWith('/api/v1/auth/evidence?'))) return evidence(req,res);
  if(req.method==='GET' && req.url==='/api/v1/health') return json(res,200,{service:'afagh-p0-1-runtime',status:'ok',mode:'production',policy_version:POLICY_VERSION});
  return json(res,404,{error:'not_found'});
}catch(e){console.error(e);return json(res,500,{error:'internal_error'});}});

server.listen(PORT,()=>console.log(`AFAGH P0-1 production runtime listening on :${PORT}`));
