import http from "node:http";
import crypto from "node:crypto";
import { URL } from "node:url";
import { requireBearer, requireTeamBearer, auditActor } from "./auth.mjs";
import { createState, appendEvent, appendEvidence, verifyEvidence, loadState, saveState } from "./state.mjs";
import { getCoreRepositoryStatus } from "./github.mjs";
import pg from "pg";
import { startAutonomousWorkLoop } from "./autonomous-loop.mjs";
import { executeCorePlan } from "./executor.mjs";
const { Pool } = pg;
const PORT = Number(process.env.PORT || 10000);
const ADMIN_TOKEN = process.env.AFAGH_AGENT00_ADMIN_TOKEN || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const pool = DATABASE_URL ? new Pool({connectionString:DATABASE_URL,ssl:process.env.PGSSL==="disable"?false:{rejectUnauthorized:false},max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:10000}) : null;

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
 {id:"T03",name:"Security / Quality / Governance",canBlock:false},
 {id:"T04",name:"AI & Intelligence Architecture",canBlock:false}
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

const tasks=[{id:"T-001",title:"Restore/Expose Core Repository",status:"BLOCKED",gate:"G01_CORE_REPOSITORY",owner:"Agent 00",priority:"P0",nextAction:"Verify Core repository exposure to the connected GitHub integration."}];
const decisions=[{id:"D-001",title:"Demo is not Core",status:"LOCKED",reason:"Protect Core/Demo boundary."}];
const audit=[{id:"A-001",severity:"BLOCKER",gate:"G01_CORE_REPOSITORY",finding:project.blocker,status:"OPEN"}];
let state = createState({project,teams,gates,tasks,decisions,audit});
function normalizeState(s){s.orchestrator ??= {status:"ACTIVE_OPERATIONAL_CONTROL",lastCycleAt:null,cycleCount:0,currentAction:null,nextAction:"Run orchestration cycle.",managedBy:"Agent 00",executionRule:"No gate bypass; no implementation before gate approval; every action produces evidence."};s.deliberations ??= [];s.auditDecisions ??= [];s.evidence ??= [];s.events ??= [];s.version ??= 1;return s}
function record(type,actor,payload){appendEvent(state,type,actor,payload);return appendEvidence(state,type,actor,payload)}
async function readiness(){const database=await dbReady();const authConfigured=Boolean(process.env.AFAGH_AGENT00_ADMIN_TOKEN);const evidence=verifyEvidence(state);return {ready:database&&authConfigured&&evidence.valid,database,authConfigured,evidence,currentGate:state.project.currentGate,gateStatus:state.project.gateStatus,timestamp:new Date().toISOString()}}
state.orchestrator = {
  status:"ACTIVE_OPERATIONAL_CONTROL",
  lastCycleAt:null,
  cycleCount:0,
  currentAction:null,
  nextAction:"Resolve G01 Core Repository blocker, then route the gate through four-team deliberation and audit.",
  managedBy:"Agent 00",
  executionRule:"No gate bypass; no implementation before gate approval; every action produces evidence."
};
async function persist(){await saveState(pool,state)}
function auth(req,res,role="operator"){const a=requireBearer(req,role);if(!a.ok){json(res,a.status,{error:a.error});return null}return a}
async function body(req){const chunks=[];for await(const c of req)chunks.push(c);if(!chunks.length)return {};try{return JSON.parse(Buffer.concat(chunks).toString("utf8"))}catch{return null}}
function gate(id){return state.gates.find(g=>g.id===id)}
function actor(req){return auditActor(req)}
function upsertManagedTask(task){
  const existing=state.tasks.find(t=>t.id===task.id);
  if(existing) Object.assign(existing,task);
  else state.tasks.push(task);
  return existing||task;
}
function executionEligible(task){return Boolean(task?.executionPlan && task.status==="APPROVED_FOR_EXECUTION" && state.project.gateStatus==="OPEN" && state.audit.filter(x=>x.gate===state.project.currentGate&&x.severity==="BLOCKER"&&x.status==="OPEN").length===0)}
async function executeApprovedTask(task){
  if(!executionEligible(task)) return {skipped:true,reason:"task_or_gate_not_execution_eligible"};
  const result=await executeCorePlan(task.executionPlan);
  task.status="EXECUTED_PENDING_TEST"; task.execution=result; task.nextAction="Run repository CI/tests and collect evidence before gate evaluation.";
  record("TASK_EXECUTED","Agent 00",{taskId:task.id,result});
  await persist();
  return result;
}
async function orchestrationCycle(source="manual"){
  const current=gate(state.project.currentGate);
  const cycleId=cryptoRandom();
  state.orchestrator.cycleCount += 1;
  state.orchestrator.lastCycleAt = new Date().toISOString();
  let action;
  if(!current){
    action={type:"STOP",reason:"current_gate_missing"};
  } else if(current.status==="BLOCKED" || state.audit.some(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN")){
    if(current.id==="G01_CORE_REPOSITORY"){
      const core=await getCoreRepositoryStatus();
      record("CORE_REPOSITORY_CHECK","Agent 00",core);
      if(core.exists){
        const blocker=state.audit.find(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN");
        if(blocker) blocker.status="RESOLVED";
        const t=state.tasks.find(x=>x.gate===current.id&&x.status==="BLOCKED");
        if(t) Object.assign(t,{status:"READY_FOR_DELIBERATION",nextAction:"Four teams must review Core Repository evidence."});
        state.project.blocker=null;
        current.status="OPEN";
        state.project.gateStatus="OPEN";
        action={type:"ROUTE_TO_DELIBERATION",gate:current.id,evidence:core};
      }else{
        upsertManagedTask({id:"T-001",title:"Restore/Expose Core Repository",status:"BLOCKED",gate:current.id,owner:"Agent 00",priority:"P0",nextAction:"Restore/expose afagh-virtual-office/afagh-virtual-office to the connected GitHub integration."});
        action={type:"BLOCKED",gate:current.id,reason:"Core repository is not reachable",evidence:core};
        record("ORCHESTRATION_BLOCKED","Agent 00",action);
      }
    }else{
      action={type:"BLOCKED",gate:current.id,reason:"Open blocker findings prevent execution."};
      record("ORCHESTRATION_BLOCKED","Agent 00",action);
    }
  } else {
    const deliberations=state.deliberations.filter(d=>d.gate===current.id);
    const missing=state.teams.map(t=>t.id).filter(id=>!deliberations.some(d=>d.teamId===id));
    if(missing.length){
      action={type:"REQUEST_TEAM_DELIBERATION",gate:current.id,teams:missing};
      for(const teamId of missing) upsertManagedTask({
        id:`DREQ-${current.id}-${teamId}`,
        title:`Deliberation required: ${current.name}`,
        status:"WAITING_TEAM",
        gate:current.id,
        owner:teamId,
        priority:"P0",
        nextAction:"Submit APPROVE, REJECT, or CONDITIONAL deliberation with findings."
      });
    }else{
      const approvals=state.teams.filter(t=>deliberations.some(d=>d.teamId===t.id&&d.decision==="APPROVE")).map(t=>t.id);
      const rejects=deliberations.filter(d=>d.decision==="REJECT").map(d=>d.teamId);
      if(rejects.length){
        action={type:"REWORK_REQUIRED",gate:current.id,rejectedBy:rejects};
      }else if(approvals.length===state.teams.length){
        action={type:"AUDIT_AND_GATE_DECISION_REQUIRED",gate:current.id,approvals};
      }else{
        action={type:"DELIBERATION_IN_PROGRESS",gate:current.id,approvals};
      }
    }
  }
  state.orchestrator.currentAction=action;
  state.orchestrator.nextAction=action.type==="BLOCKED"
    ? action.reason
    : action.type==="REQUEST_TEAM_DELIBERATION"
      ? `Collect deliberations from: ${action.teams.join(", ")}`
      : action.type==="AUDIT_AND_GATE_DECISION_REQUIRED"
        ? `Audit gate ${current.id}; advance only after evidence and blocker review.`
        : `Continue controlled execution for ${current.id}.`;
  record("ORCHESTRATION_CYCLE","Agent 00",{cycleId,source,action});
  await persist();
  return {cycleId,orchestrator:state.orchestrator,action,project:state.project};
}
function cryptoRandom(){return `CYC-${crypto.randomUUID()}`;}

async function dbReady(){ if(!pool) return false; try{await pool.query("select 1");return true}catch{return false}}
async function initDb(){
 if(!pool)return;
 await pool.query(`create table if not exists agent00_state (key text primary key,value jsonb not null,updated_at timestamptz not null default now())`);
 await pool.query(`insert into agent00_state(key,value) values($1,$2) on conflict(key) do nothing`,["project",JSON.stringify(project)]);
}
function json(res,status,data){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-agent":"AFAGH-Agent-00"});res.end(JSON.stringify(data));}

function dashboard(){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFAGH Command Center — Agent 00</title><style>body{font-family:Inter,Arial,sans-serif;background:#080d19;color:#eef2ff;margin:0}main{max-width:1200px;margin:auto;padding:24px}.top{display:flex;justify-content:space-between;align-items:center;gap:12px}.online{color:#7ff0a4}.offline{color:#ff8e8e}.muted{color:#9eabc9}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{background:#11192b;border:1px solid #263452;border-radius:14px;padding:16px;margin:12px 0}.value{font-size:22px;font-weight:700;margin-top:8px}.event{padding:10px 0;border-bottom:1px solid #24304b;font-family:ui-monospace,monospace;font-size:13px}.pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#202b46}.error{color:#ff9b9b}button{background:#1d2a47;color:#fff;border:1px solid #3a4a70;border-radius:8px;padding:8px 12px;cursor:pointer}</style></head><body><main><div class="top"><div><h1>AFAGH Command Center</h1><div class="muted">Live operational view · Agent 00 Runtime</div></div><div><span id="dot" class="offline">● OFFLINE</span> <button onclick="refresh()">Refresh</button></div></div><div class="grid"><div class="card"><div class="muted">Runtime</div><div id="runtime" class="value">Checking…</div></div><div class="card"><div class="muted">Current Gate</div><div id="gate" class="value">—</div></div><div class="card"><div class="muted">Orchestrator Cycles</div><div id="cycles" class="value">—</div></div><div class="card"><div class="muted">Last Cycle</div><div id="last" class="value">—</div></div></div><div class="card"><div class="muted">Current Action</div><div id="action" class="value">—</div><div id="next" class="muted" style="margin-top:8px"></div></div><div class="card"><h2>Recent Activity</h2><div id="events">Loading…</div></div><div class="card"><h2>Four-Team Governance</h2><div id="teams">Loading…</div></div><div class="card"><div class="muted">Auto-refresh: 5 seconds · Source: Agent 00 runtime APIs</div></div><script>async function j(p){const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw new Error(r.status);return r.json()}function esc(x){return String(x??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]))}async function refresh(){try{const [h,s,e,t]=await Promise.all([j("/api/v1/health"),j("/api/v1/orchestrator/status"),j("/api/v1/events"),j("/api/v1/teams")]);document.getElementById("dot").className="online";document.getElementById("dot").textContent="● ONLINE";document.getElementById("runtime").textContent=h.status.toUpperCase();document.getElementById("gate").textContent=s.currentGate+" · "+s.gateStatus;document.getElementById("cycles").textContent=s.cycleCount;document.getElementById("last").textContent=s.lastCycleAt?new Date(s.lastCycleAt).toLocaleString():"—";document.getElementById("action").textContent=s.currentAction?.type||"—";document.getElementById("next").textContent=(s.nextAction||"")+" · Loop: "+(s.autonomousLoop?.enabled?"ACTIVE":"STOPPED")+" · "+(s.autonomousLoop?.cyclesCompleted??0)+" completed";document.getElementById("events").innerHTML=(e.slice(-12).reverse().map(x=>'<div class="event"><b>'+esc(x.type)+'</b> · '+esc(x.actor)+' · '+esc(x.at||x.timestamp||"")+'</div>').join("")||"No events yet");document.getElementById("teams").innerHTML=t.map(x=>'<span class="pill">'+esc(x.id)+" · "+esc(x.name)+"</span> ").join("")}catch(e){document.getElementById("dot").className="offline";document.getElementById("dot").textContent="● OFFLINE";document.getElementById("runtime").innerHTML='<span class="error">unreachable</span>'}}refresh();setInterval(refresh,5000)</script></main></body></html>`}
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,`http://localhost:${PORT}`);
 if(req.method==="GET"&&u.pathname==="/"){res.writeHead(200,{"content-type":"text/html; charset=utf-8"});return res.end(dashboard())}
 if(req.method==="GET"&&u.pathname==="/api/v1/health")return json(res,200,{service:"afagh-agent-00",status:"ok",mode:project.mode,currentGate:project.currentGate,gateStatus:project.gateStatus,database:await dbReady(),timestamp:new Date().toISOString()});
 if(req.method==="GET"&&u.pathname==="/api/v1/project")return json(res,200,state.project);
 if(req.method==="GET"&&u.pathname==="/api/v1/ready"){const r=await readiness();return json(res,r.ready?200:503,r)}
 if(req.method==="GET"&&u.pathname==="/api/v1/evidence")return json(res,200,{verification:verifyEvidence(state),items:state.evidence});
 if(req.method==="GET"&&u.pathname==="/api/v1/gates")return json(res,200,state.gates);
 if(req.method==="GET"&&u.pathname==="/api/v1/teams")return json(res,200,state.teams);
 if(req.method==="GET"&&u.pathname==="/api/v1/tasks")return json(res,200,state.tasks);\n if(req.method==="GET"&&u.pathname==="/api/v1/execution/status")return json(res,200,{mode:"CONTROLLED_CORE_EXECUTION",coreRepository:process.env.AFAGH_CORE_REPOSITORY||"afagh-virtual-office/afagh-virtual-office",directMainWrites:false,executor:"allowlisted-plan-engine",eligibleTasks:state.tasks.filter(executionEligible).map(t=>t.id)});
 if(req.method==="GET"&&u.pathname==="/api/v1/decisions")return json(res,200,decisions);
 if(req.method==="GET"&&u.pathname==="/api/v1/audit")return json(res,200,state.audit);
 if(req.method==="GET"&&u.pathname==="/api/v1/orchestrator/status")return json(res,200,{...state.orchestrator,currentGate:state.project.currentGate,gateStatus:state.project.gateStatus,activeTasks:state.tasks.filter(t=>["BLOCKED","READY_FOR_DELIBERATION","WAITING_TEAM"].includes(t.status)),autonomousLoop:autonomousLoop.status});
 if(req.method==="GET"&&u.pathname==="/api/v1/events")return json(res,200,state.events);
 if(req.method==="GET"&&u.pathname==="/api/v1/deliberations")return json(res,200,state.deliberations);
 if(req.method==="GET"&&u.pathname==="/api/v1/github/core-status")return json(res,200,await getCoreRepositoryStatus());
 if(req.method==="POST"&&u.pathname==="/api/v1/orchestrator/cycle"){const a=auth(req,res);if(!a)return;const result=await orchestrationCycle("api");const task=state.tasks.find(executionEligible);if(task)result.execution=await executeApprovedTask(task);return json(res,200,result)}
 if(req.method==="POST"&&u.pathname==="/api/v1/deliberations"){const b=await body(req);if(!b||!b.gate||!b.teamId||!["APPROVE","REJECT","CONDITIONAL"].includes(b.decision))return json(res,400,{error:"invalid_deliberation"});if(!state.teams.some(t=>t.id===b.teamId)||!gate(b.gate))return json(res,400,{error:"unknown_team_or_gate"});const ta=requireTeamBearer(req,b.teamId);if(!ta.ok)return json(res,ta.status,{error:ta.error,teamId:b.teamId});const d={id:`D-${Date.now()}`,gate:b.gate,teamId:b.teamId,decision:b.decision,findings:Array.isArray(b.findings)?b.findings.slice(0,50):[],actor:`team:${b.teamId}`,at:new Date().toISOString()};state.deliberations=state.deliberations.filter(x=>!(x.gate===d.gate&&x.teamId===d.teamId));state.deliberations.push(d);record("TEAM_DELIBERATION",`team:${b.teamId}`,d);await persist();return json(res,201,d)}
 if(req.method==="POST"&&u.pathname==="/api/v1/audit/decision"){const ta=requireTeamBearer(req,"T04");if(!ta.ok)return json(res,ta.status,{error:ta.error,teamId:"T04"});const b=await body(req);if(!b||!b.gate||!["APPROVE","REJECT","CONDITIONAL"].includes(b.decision))return json(res,400,{error:"invalid_audit_decision"});if(!gate(b.gate))return json(res,400,{error:"unknown_gate"});const d={id:`AUD-${Date.now()}`,gate:b.gate,decision:b.decision,findings:Array.isArray(b.findings)?b.findings.slice(0,50):[],actor:"team:T04",at:new Date().toISOString()};state.auditDecisions=state.auditDecisions.filter(x=>x.gate!==d.gate);state.auditDecisions.push(d);record("INDEPENDENT_AUDIT_DECISION","team:T04",d);await persist();return json(res,201,d)}
 if(req.method==="POST"&&u.pathname==="/api/v1/gates/evaluate"){const a=auth(req,res);if(!a)return;const b=await body(req);const id=b?.gate||state.project.currentGate;if(!gate(id))return json(res,404,{error:"unknown_gate"});const ds=state.deliberations.filter(d=>d.gate===id);const approvals=state.teams.filter(t=>ds.some(d=>d.teamId===t.id&&d.decision==="APPROVE")).map(t=>t.id);const blockers=state.audit.filter(x=>x.gate===id&&x.severity==="BLOCKER"&&x.status==="OPEN");const auditDecision=state.auditDecisions.find(d=>d.gate===id);const evidence=verifyEvidence(state);const result={gate:id,eligible:approvals.length===state.teams.length&&auditDecision?.decision==="APPROVE"&&blockers.length===0&&evidence.valid,approvals,missingApprovals:state.teams.map(t=>t.id).filter(id=>!approvals.includes(id)),auditDecision:auditDecision||null,blockingFindings:blockers,evidence};record("GATE_EVALUATION",actor(req),result);await persist();return json(res,200,result)}
 if(req.method==="POST"&&u.pathname==="/api/v1/gates/advance"){const a=auth(req,res);if(!a)return;const current=gate(state.project.currentGate);const ds=state.deliberations.filter(d=>d.gate===current.id);const missing=state.teams.map(t=>t.id).filter(id=>!ds.some(d=>d.teamId===id&&d.decision==="APPROVE"));const blocking=state.audit.filter(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN");const auditDecision=state.auditDecisions.find(d=>d.gate===current.id);const evidence=verifyEvidence(state);if(missing.length||blocking.length||auditDecision?.decision!=="APPROVE"||!evidence.valid)return json(res,409,{error:"gate_blocked",gate:current.id,missingApprovals:missing,blockingFindings:blocking,auditDecision:auditDecision||null,evidence});current.status="PASSED";const i=state.gates.findIndex(g=>g.id===current.id);if(i<state.gates.length-1){state.gates[i+1].status="OPEN";state.project.currentGate=state.gates[i+1].id;state.project.gateStatus="OPEN";state.project.blocker=null}else{state.project.gateStatus="PASSED";state.project.releaseClass="RELEASED"}record("GATE_ADVANCED",actor(req),{gate:current.id,next:state.project.currentGate});await persist();return json(res,200,{ok:true,project:state.project,gates:state.gates})}
 json(res,404,{error:"not_found"});
});
const autonomousLoop = startAutonomousWorkLoop(orchestrationCycle, { intervalMs: Number(process.env.AFAGH_AGENT00_LOOP_INTERVAL_MS || 60000), runImmediately: false });
loadState(pool,state).then(async s=>{state=normalizeState(s);if(!state.orchestrator)state.orchestrator={status:"ACTIVE_OPERATIONAL_CONTROL",lastCycleAt:null,cycleCount:0,currentAction:null,nextAction:"Run autonomous work loop.",managedBy:"Agent 00",executionRule:"No gate bypass; no implementation before gate approval; every action produces evidence."}; await orchestrationCycle("startup"); autonomousLoop.start();}).catch(e=>console.error("state_load_or_loop_failed",e.message));
server.listen(PORT,"0.0.0.0",()=>console.log(`AFAGH Agent 00 listening on ${PORT}`));
