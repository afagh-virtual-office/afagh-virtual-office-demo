import http from "node:http";
import { URL } from "node:url";
import { requireBearer, auditActor } from "./auth.mjs";
import { createState, appendEvent, loadState, saveState } from "./state.mjs";
import { getCoreRepositoryStatus } from "./github.mjs";
import pg from "pg";
const { Pool } = pg;
const PORT = Number(process.env.PORT || 10000);
const ADMIN_TOKEN = process.env.AFAGH_AGENT00_ADMIN_TOKEN || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const pool = DATABASE_URL ? new Pool({connectionString:DATABASE_URL,ssl:process.env.PGSSL==="disable"?false:{rejectUnauthorized:false}}) : null;

const project = {
  id:"AFAGH-ORCH-001", name:"AFAGH Agent 00", mode:"CONTROLLED_EXECUTION",
  releaseClass:"PRE_PRODUCTION", authority:"AFAGH Project Orchestrator",
  currentGate:"G01_CORE_REPOSITORY", gateStatus:"BLOCKED",
  blocker:"Core repository afagh-virtual-office/afagh-virtual-office is not currently exposed to the connected GitHub integration.",
  rule:"Search → Reuse → Extend → Refactor → Test",
  protocol:["Request","Team Deliberation","Audit","Gate","Implementation","Test","Evidence"]
};
const teams=[
 {id:"T01",name:"Architecture & Technology",canBlock:false},
 {id:"T02",name:"Domain / Business / Trade",canBlock:false},
 {id:"T03",name:"AI / Governance / Trust",canBlock:false},
 {id:"T04",name:"Independent Architecture Audit",canBlock:true}
];
const gates=[
 ["G01_CORE_REPOSITORY","Core Repository","BLOCKED"],
 ["G02_ARCHITECTURE_BASELINE","Architecture Baseline","LOCKED"],
 ["G03_IDENTITY_AUTHENTICATION","Identity & Authentication","LOCKED"],
 ["G04_TENANT_WORKSPACE","Tenant / Workspace Isolation","LOCKED"],
 ["G05_RUNTIME_POSTGRESQL","Runtime + PostgreSQL","LOCKED"],
 ["G06_BUSINESS_GOLDEN_PATH","Business Golden Path","LOCKED"],
 ["G07_AI_WORKFORCE","AI Workforce","LOCKED"],
 ["G08_TRUST_EVIDENCE","Trust & Evidence","LOCKED"],
 ["G09_AUDIT","Audit","LOCKED"],
 ["G10_E2E","E2E","LOCKED"],
 ["G11_PRODUCTION_RELEASE","Production Release","LOCKED"]
].map(([id,name,status])=>({id,name,status}));

const tasks=[{id:"T-001",title:"Restore/Expose Core Repository",status:"BLOCKED",gate:"G01_CORE_REPOSITORY",owner:"Agent 00"}];
const decisions=[{id:"D-001",title:"Demo is not Core",status:"LOCKED",reason:"Protect Core/Demo boundary."}];
const audit=[{id:"A-001",severity:"BLOCKER",gate:"G01_CORE_REPOSITORY",finding:project.blocker,status:"OPEN"}];
let state = createState({project,teams,gates,tasks,decisions,audit});
async function persist(){await saveState(pool,state)}
function auth(req,res,role="operator"){const a=requireBearer(req,role);if(!a.ok){json(res,a.status,{error:a.error});return null}return a}
async function body(req){const chunks=[];for await(const c of req)chunks.push(c);if(!chunks.length)return {};try{return JSON.parse(Buffer.concat(chunks).toString("utf8"))}catch{return null}}
function gate(id){return state.gates.find(g=>g.id===id)}
function actor(req){return auditActor(req)}

async function dbReady(){ if(!pool) return false; try{await pool.query("select 1");return true}catch{return false}}
async function initDb(){
 if(!pool)return;
 await pool.query(`create table if not exists agent00_state (key text primary key,value jsonb not null,updated_at timestamptz not null default now())`);
 await pool.query(`insert into agent00_state(key,value) values($1,$2) on conflict(key) do nothing`,["project",JSON.stringify(project)]);
}
function json(res,status,data){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-agent":"AFAGH-Agent-00"});res.end(JSON.stringify(data));}

function dashboard(){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFAGH Agent 00</title><style>body{font-family:Inter,Arial,sans-serif;background:#0b1020;color:#eef2ff;margin:0}main{max-width:1100px;margin:40px auto;padding:24px}.card{background:#141b33;border:1px solid #2b3558;border-radius:16px;padding:20px;margin:14px 0}h1{margin:0 0 8px}pre{white-space:pre-wrap;line-height:1.5}.bad{color:#ffb4b4}.muted{color:#aab4d0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}</style></head><body><main><div class="card"><h1>AFAGH Agent 00</h1><div class="muted">Project Orchestrator · Control Plane</div></div><div class="grid"><div class="card"><b>Current Gate</b><h2 class="bad">${project.currentGate}</h2><div>${project.gateStatus}</div></div><div class="card"><b>Mode</b><h2>${project.mode}</h2><div>${project.releaseClass}</div></div><div class="card"><b>Teams</b><h2>4</h2><div>Auditor has blocking authority</div></div></div><div class="card"><h2>Active Blocker</h2><p class="bad">${project.blocker}</p></div><div class="card"><h2>Execution Protocol</h2><pre>${project.protocol.join(" → ")}</pre></div><div class="card"><h2>Control Rules</h2><pre>Search → Reuse → Extend → Refactor → Test
No gate bypass · No duplicate implementation · No Done without evidence</pre></div><div class="card"><h2>API</h2><pre>GET /api/v1/health
GET /api/v1/project
GET /api/v1/gates
GET /api/v1/teams
GET /api/v1/tasks
GET /api/v1/decisions
GET /api/v1/audit</pre></div></main></body></html>`}
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,`http://localhost:${PORT}`);
 if(req.method==="GET"&&u.pathname==="/"){res.writeHead(200,{"content-type":"text/html; charset=utf-8"});return res.end(dashboard())}
 if(req.method==="GET"&&u.pathname==="/api/v1/health")return json(res,200,{service:"afagh-agent-00",status:"ok",mode:project.mode,currentGate:project.currentGate,gateStatus:project.gateStatus,database:await dbReady(),timestamp:new Date().toISOString()});
 if(req.method==="GET"&&u.pathname==="/api/v1/project")return json(res,200,state.project);
 if(req.method==="GET"&&u.pathname==="/api/v1/gates")return json(res,200,state.gates);
 if(req.method==="GET"&&u.pathname==="/api/v1/teams")return json(res,200,state.teams);
 if(req.method==="GET"&&u.pathname==="/api/v1/tasks")return json(res,200,state.tasks);
 if(req.method==="GET"&&u.pathname==="/api/v1/decisions")return json(res,200,decisions);
 if(req.method==="GET"&&u.pathname==="/api/v1/audit")return json(res,200,state.audit);
 if(req.method==="GET"&&u.pathname==="/api/v1/events")return json(res,200,state.events);
 if(req.method==="GET"&&u.pathname==="/api/v1/deliberations")return json(res,200,state.deliberations);
 if(req.method==="GET"&&u.pathname==="/api/v1/github/core-status")return json(res,200,await getCoreRepositoryStatus());
 if(req.method==="POST"&&u.pathname==="/api/v1/deliberations"){const a=auth(req,res);if(!a)return;const b=await body(req);if(!b||!b.gate||!b.teamId||!["APPROVE","REJECT","CONDITIONAL"].includes(b.decision))return json(res,400,{error:"invalid_deliberation"});if(!state.teams.some(t=>t.id===b.teamId)||!gate(b.gate))return json(res,400,{error:"unknown_team_or_gate"});const d={id:`D-${Date.now()}`,gate:b.gate,teamId:b.teamId,decision:b.decision,findings:Array.isArray(b.findings)?b.findings.slice(0,50):[],actor:a.role,at:new Date().toISOString()};state.deliberations=state.deliberations.filter(x=>!(x.gate===d.gate&&x.teamId===d.teamId));state.deliberations.push(d);appendEvent(state,"TEAM_DELIBERATION",actor(req),d);await persist();return json(res,201,d)}
 if(req.method==="POST"&&u.pathname==="/api/v1/gates/evaluate"){const a=auth(req,res);if(!a)return;const b=await body(req);const id=b?.gate||state.project.currentGate;if(!gate(id))return json(res,404,{error:"unknown_gate"});const ds=state.deliberations.filter(d=>d.gate===id);const approvals=state.teams.filter(t=>ds.some(d=>d.teamId===t.id&&d.decision==="APPROVE")).map(t=>t.id);const blockers=state.audit.filter(x=>x.gate===id&&x.severity==="BLOCKER"&&x.status==="OPEN");const result={gate:id,eligible:approvals.length===state.teams.length&&blockers.length===0,approvals,missingApprovals:state.teams.map(t=>t.id).filter(id=>!approvals.includes(id)),blockingFindings:blockers};appendEvent(state,"GATE_EVALUATION",actor(req),result);await persist();return json(res,200,result)}
 if(req.method==="POST"&&u.pathname==="/api/v1/gates/advance"){const a=auth(req,res);if(!a)return;const current=gate(state.project.currentGate);const ds=state.deliberations.filter(d=>d.gate===current.id);const missing=state.teams.map(t=>t.id).filter(id=>!ds.some(d=>d.teamId===id&&d.decision==="APPROVE"));const blocking=state.audit.filter(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN");if(missing.length||blocking.length)return json(res,409,{error:"gate_blocked",gate:current.id,missingApprovals:missing,blockingFindings:blocking});current.status="PASSED";const i=state.gates.findIndex(g=>g.id===current.id);if(i<state.gates.length-1){state.gates[i+1].status="OPEN";state.project.currentGate=state.gates[i+1].id;state.project.gateStatus="OPEN";state.project.blocker=null}else{state.project.gateStatus="PASSED";state.project.releaseClass="RELEASED"}appendEvent(state,"GATE_ADVANCED",actor(req),{gate:current.id,next:state.project.currentGate});await persist();return json(res,200,{ok:true,project:state.project,gates:state.gates})}
 json(res,404,{error:"not_found"});
});
loadState(pool,state).then(s=>{state=s}).catch(e=>console.error("state_load_failed",e.message));
server.listen(PORT,"0.0.0.0",()=>console.log(`AFAGH Agent 00 listening on ${PORT}`));
