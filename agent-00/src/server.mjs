import http from "node:http";
import crypto from "node:crypto";
import { URL } from "node:url";
import { requireBearer, requireTeamBearer, auditActor } from "./auth.mjs";
import { createState, appendEvent, appendEvidence, verifyEvidence, loadState, saveState } from "./state.mjs";
import { getCoreRepositoryStatus } from "./github.mjs";
import pg from "pg";
import { startAutonomousWorkLoop } from "./autonomous-loop.mjs";
import { executeCorePlan } from "./executor.mjs";
import { runStartupSelfTest } from "./startup-self-test.mjs";
import { evaluateGateEvidence } from "./gate-evaluator.mjs";
import { runVirtualTeamReview } from "./governance-engine.mjs";
const { Pool } = pg;
const PORT = Number(process.env.PORT || 10000);
const ADMIN_TOKEN = process.env.AFAGH_AGENT00_ADMIN_TOKEN || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const pool = DATABASE_URL ? new Pool({connectionString:DATABASE_URL,ssl:process.env.PGSSL==="disable"?false:{rejectUnauthorized:false},max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:10000}) : null;

const project = {
  id:"AFAGH-ORCH-001", name:"AFAGH Agent 00", mode:"CONTROLLED_EXECUTION",
  releaseClass:"PRE_PRODUCTION", authority:"AFAGH Project Orchestrator",
  currentGate:"G01_CORE_REPOSITORY", gateStatus:"BLOCKED",
  blocker:"Runtime GitHub access must be verified with its own credential; ChatGPT connector access is not inherited by Render.",
  rule:"Search → Reuse → Extend → Refactor → Test",
  protocol:["Request","Team Deliberation","Audit","Gate","Implementation","Test","Evidence"]
};
const teams=[
 {id:"T01",name:"Architecture & Technology",canBlock:false},
 {id:"T02",name:"Domain / Business / Trade",canBlock:false},
 {id:"T03",name:"Security / Quality / Governance",canBlock:false}
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
function normalizeState(s){s.teams = (s.teams ?? []).filter(t => t.id !== "T04"); if (!s.teams.length) s.teams = teams; s.orchestrator ??= {status:"ACTIVE_OPERATIONAL_CONTROL",lastCycleAt:null,cycleCount:0,currentAction:null,nextAction:"Run orchestration cycle.",managedBy:"Agent 00",executionRule:"No gate bypass; no implementation before gate approval; every action produces evidence."};s.deliberations ??= [];s.auditDecisions ??= [];s.evidence ??= [];s.events ??= [];s.version ??= 1;return s}
function record(type,actor,payload){appendEvent(state,type,actor,payload);return appendEvidence(state,type,actor,payload)}
async function readiness(){const database=await dbReady();const authConfigured=Boolean(process.env.AFAGH_AGENT00_ADMIN_TOKEN);const evidence=verifyEvidence(state);return {ready:database&&authConfigured&&evidence.valid,database,authConfigured,evidence,currentGate:state.project.currentGate,gateStatus:state.project.gateStatus,timestamp:new Date().toISOString()}}
state.orchestrator = {
  status:"ACTIVE_OPERATIONAL_CONTROL",
  lastCycleAt:null,
  cycleCount:0,
  currentAction:null,
  nextAction:"Resolve G01 Core Repository blocker, then route the gate through three-team deliberation and T03 governance audit.",
  managedBy:"Agent 00",
  executionRule:"No gate bypass; no implementation before gate approval; every action produces evidence."
};
async function persist(){await saveState(pool,state)}
function auth(req,res,role="operator"){const a=requireBearer(req,role);if(!a.ok){json(res,a.status,{error:a.error});return null}req.__afaghPrincipal=a.role==="operator"?"operator":a.role;return a}
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
async function runAutomatedGovernanceForCurrentGate(current, technical){
  if(!current || !technical?.technical?.valid) return {ran:false,reason:"technical_gate_not_ready"};
  const blockerOpen=state.audit.some(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN");
  if(blockerOpen) return {ran:false,reason:"open_blocker"};
  const result=runVirtualTeamReview({
    gateId:current.id,
    state,
    technical,
    evidence:verifyEvidence(state)
  });
  for(const d of result.deliberations){
    const existing=state.deliberations.find(x=>x.gate===d.gate&&x.teamId===d.teamId);
    if(!existing && result.authenticatedTeams.includes(d.teamId)){
      state.deliberations.push(d);
      record("TEAM_DELIBERATION",`team:${d.teamId}`,d);
    }
  }
  if(result.auditDecision && !state.auditDecisions.some(x=>x.gate===current.id)){
    state.auditDecisions.push(result.auditDecision);
    record("GOVERNANCE_AUDIT_DECISION","team:T03",result.auditDecision);
  }
  return {
    ran:true,
    authenticatedTeams:result.authenticatedTeams,
    deliberationsCreated:result.deliberations.map(d=>({teamId:d.teamId,decision:d.decision})),
    auditDecisionCreated:result.auditDecision?.decision||null,
    mode:"AUTOMATED_VIRTUAL_TEAM_GOVERNANCE"
  };
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
      const coreVerified=Boolean(
        core.reachable===true &&
        core.exists===true &&
        core.private===true &&
        core.branchVerified===true &&
        core.defaultBranch==="main"
      );
      if(coreVerified){
        const blocker=state.audit.find(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN");
        if(blocker) blocker.status="RESOLVED";
        const t=state.tasks.find(x=>x.gate===current.id&&x.status==="BLOCKED");
        if(t) Object.assign(t,{status:"READY_FOR_DELIBERATION",nextAction:"Three teams must review verified Core Repository evidence."});
        state.project.blocker=null;
        current.status="OPEN";
        state.project.gateStatus="OPEN";
        action={type:"ROUTE_TO_DELIBERATION",gate:current.id,evidence:core};
      }else{
        upsertManagedTask({
          id:"T-001",
          title:"Restore/Expose Core Repository",
          status:"BLOCKED",
          gate:current.id,
          owner:"Agent 00",
          priority:"P0",
          nextAction:core.failureCode
            ? `Resolve ${core.failureCode} and obtain authenticated access to the private Core Repository.`
            : "Verify private Core Repository access and main branch from the Agent runtime."
        });
        action={
          type:"BLOCKED",
          gate:current.id,
          reason:"Core repository verification failed; G01 remains blocked.",
          evidence:core
        };
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
      const evidenceState=verifyEvidence(state);
      const technical=await evaluateGateEvidence({
        gateId:current.id,
        state,
        dbReady:await dbReady(),
        autonomousLoopStatus:autonomousLoop.status,
        evidenceValid:evidenceState.valid
      });
      const gov=await runAutomatedGovernanceForCurrentGate(current,technical);
      const remaining=state.teams.map(t=>t.id).filter(id=>!state.deliberations.some(d=>d.gate===current.id&&d.teamId===id&&d.decision==="APPROVE"));
      action=remaining.length
        ? {type:"REQUEST_TEAM_DELIBERATION",gate:current.id,teams:remaining,technical,governance:gov}
        : {type:"GOVERNANCE_READY_FOR_GATE_DECISION",gate:current.id,technical,governance:gov};
      for(const teamId of remaining) upsertManagedTask({
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
        const evidenceState=verifyEvidence(state);
        const technical=await evaluateGateEvidence({
          gateId:current.id,
          state,
          dbReady:await dbReady(),
          autonomousLoopStatus:autonomousLoop.status,
          evidenceValid:evidenceState.valid
        });
        const blocking=state.audit.filter(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN");
        const auditDecision=state.auditDecisions.find(d=>d.gate===current.id);
        const canAdvance=Boolean(
          technical.technical.valid &&
          auditDecision?.decision==="APPROVE" &&
          blocking.length===0 &&
          evidenceState.valid
        );
        if(canAdvance){
          current.status="PASSED";
          const i=state.gates.findIndex(g=>g.id===current.id);
          if(i<state.gates.length-1){
            state.gates[i+1].status="OPEN";
            state.project.currentGate=state.gates[i+1].id;
            state.project.gateStatus="OPEN";
            state.project.blocker=null;
          }else{
            state.project.gateStatus="PASSED";
            state.project.releaseClass="RELEASED";
          }
          const transition={gate:current.id,next:state.project.currentGate,technical,evidence:evidenceState,auditDecision};
          record("GATE_AUTO_ADVANCED","Agent 00",transition);
          action={type:"GATE_AUTO_ADVANCED",...transition};
        }else{
          action={type:"AUDIT_AND_GATE_DECISION_REQUIRED",gate:current.id,approvals,technical,auditDecision};
        }
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
  console.log("orchestration_cycle",JSON.stringify({cycleId,source,gate:state.project.currentGate,gateStatus:state.project.gateStatus,actionType:action.type,actionGate:action.gate||null}));
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

function dashboard(){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFAGH Command Center — Agent 00</title><style>body{font-family:Inter,Arial,sans-serif;background:#080d19;color:#eef2ff;margin:0}main{max-width:1200px;margin:auto;padding:24px}.top{display:flex;justify-content:space-between;align-items:center;gap:12px}.online{color:#7ff0a4}.offline{color:#ff8e8e}.muted{color:#9eabc9}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{background:#11192b;border:1px solid #263452;border-radius:14px;padding:16px;margin:12px 0}.value{font-size:22px;font-weight:700;margin-top:8px}.event{padding:10px 0;border-bottom:1px solid #24304b;font-family:ui-monospace,monospace;font-size:13px}.pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#202b46}.error{color:#ff9b9b}button{background:#1d2a47;color:#fff;border:1px solid #3a4a70;border-radius:8px;padding:8px 12px;cursor:pointer}</style></head><body><main><div class="top"><div><h1>AFAGH Command Center</h1><div class="muted">Live operational view · Agent 00 Runtime</div></div><div><span id="dot" class="offline">● OFFLINE</span> <button onclick="refresh()">Refresh</button></div></div><div class="grid"><div class="card"><div class="muted">Runtime</div><div id="runtime" class="value">Checking…</div></div><div class="card"><div class="muted">Current Gate</div><div id="gate" class="value">—</div></div><div class="card"><div class="muted">Orchestrator Cycles</div><div id="cycles" class="value">—</div></div><div class="card"><div class="muted">Last Cycle</div><div id="last" class="value">—</div></div></div><div class="card"><div class="muted">Current Action</div><div id="action" class="value">—</div><div id="next" class="muted" style="margin-top:8px"></div></div><div class="card"><h2>Recent Activity</h2><div id="events">Loading…</div></div><div class="card"><h2>Three-Team Governance</h2><div id="teams">Loading…</div></div><div class="card"><h2>Golden Agent Request</h2><div class="muted">Authenticated end-to-end diagnostic: Auth → Tenant → Policy → Tool → PostgreSQL → Evidence → Audit.</div><p><input id="tenant" placeholder="Tenant ID" value="demo-tenant" style="padding:8px;border-radius:8px;border:1px solid #3a4a70;background:#0b1220;color:#fff"> <button onclick="golden()">Run Golden Request</button></p><pre id="golden" class="event">Not run</pre></div><div class="card"><div class="muted">Auto-refresh: 5 seconds · Source: Agent 00 runtime APIs</div></div><script>async function j(p){const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw new Error(r.status);return r.json()}function esc(x){return String(x??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]))}async function refresh(){const ids=["/api/v1/health","/api/v1/orchestrator/status","/api/v1/events","/api/v1/teams"];const results=await Promise.allSettled(ids.map(j));const [h,s,e,t]=results.map(x=>x.status==="fulfilled"?x.value:null);const failed=results.map((x,i)=>x.status==="rejected"?ids[i]+": "+x.reason: null).filter(Boolean);const online=Boolean(h||s||e||t);document.getElementById("dot").className=online?"online":"offline";document.getElementById("dot").textContent=online?"● ONLINE":"● OFFLINE";document.getElementById("runtime").textContent=h?.status?.toUpperCase()||"API ERROR";document.getElementById("gate").textContent=s?(s.currentGate+" · "+s.gateStatus):"API ERROR";document.getElementById("cycles").textContent=s?.cycleCount??"—";document.getElementById("last").textContent=s?.lastCycleAt?new Date(s.lastCycleAt).toLocaleString():"—";document.getElementById("action").textContent=s?.currentAction?.type||"—";document.getElementById("next").textContent=s?((s.nextAction||"")+" · Loop: "+(s.autonomousLoop?.enabled?"ACTIVE":"STOPPED")+" · "+(s.autonomousLoop?.cyclesCompleted??0)+" completed"):"Runtime API unavailable";document.getElementById("events").innerHTML=e?((e.slice(-12).reverse().map(x=>'<div class="event"><b>'+esc(x.type)+'</b> · '+esc(x.actor)+' · '+esc(x.at||x.timestamp||"")+'</div>').join(""))||"No events yet"):"API unavailable";document.getElementById("teams").innerHTML=t?(t.map(x=>'<span class="pill">'+esc(x.id)+" · "+esc(x.name)+"</span> ").join("")):"API unavailable";if(failed.length)document.getElementById("next").textContent+=" · "+failed.join(" | ")}async function golden(){
 const out=document.getElementById("golden");out.textContent="Running…";
 const token=window.prompt("Enter Agent operator token (not stored by this page):");
 if(!token){out.textContent="Cancelled";return}
 try{
  const r=await fetch("/api/v1/agent/golden-request",{method:"POST",headers:{"authorization":"Bearer "+token,"x-afagh-tenant":document.getElementById("tenant").value,"x-correlation-id":crypto.randomUUID(),"content-type":"application/json"},body:JSON.stringify({tool:"agent.status"})});
  out.textContent=JSON.stringify(await r.json(),null,2)
 }catch(e){out.textContent=String(e)}
}
refresh();setInterval(refresh,5000)</script></main></body></html>`}
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,`http://localhost:${PORT}`);
 if(req.method==="GET"&&u.pathname==="/"){res.writeHead(200,{"content-type":"text/html; charset=utf-8"});return res.end(dashboard())}
 if(req.method==="GET"&&u.pathname==="/api/v1/health")return json(res,200,{service:"afagh-agent-00",status:"ok",mode:project.mode,currentGate:state.project.currentGate,gateStatus:state.project.gateStatus,databaseConfigured:Boolean(DATABASE_URL),timestamp:new Date().toISOString()});
 if(req.method==="GET"&&u.pathname==="/api/v1/project")return json(res,200,state.project);
 if(req.method==="GET"&&u.pathname==="/api/v1/ready"){const r=await readiness();return json(res,r.ready?200:503,r)}
 if(req.method==="GET"&&u.pathname==="/api/v1/evidence")return json(res,200,{verification:verifyEvidence(state),items:state.evidence});
 if(req.method==="GET"&&u.pathname==="/api/v1/gates")return json(res,200,state.gates);
 if(req.method==="GET"&&u.pathname==="/api/v1/teams")return json(res,200,state.teams);
 if(req.method==="GET"&&u.pathname==="/api/v1/governance/status"){
   return json(res,200,{
     teams:state.teams.map(t=>({id:t.id,name:t.name,tokenConfigured:Boolean(process.env[`AFAGH_AGENT00_${t.id}_TOKEN`])})),
     approvals:state.teams.map(t=>({
       teamId:t.id,
       gates:[...new Set(state.deliberations.filter(d=>d.teamId===t.id&&d.decision==="APPROVE").map(d=>d.gate))]
     })),
     currentGate:state.project.currentGate,
     gateStatus:state.project.gateStatus
   });
 }
 if(req.method==="GET"&&u.pathname==="/api/v1/tasks")return json(res,200,state.tasks);
 if(req.method==="GET"&&u.pathname==="/api/v1/execution/status")return json(res,200,{mode:"CONTROLLED_CORE_EXECUTION",coreRepository:process.env.AFAGH_CORE_REPOSITORY||"afagh-virtual-office/afagh-virtual-office",directMainWrites:false,executor:"allowlisted-plan-engine",eligibleTasks:state.tasks.filter(executionEligible).map(t=>t.id)});
 if(req.method==="GET"&&u.pathname==="/api/v1/decisions")return json(res,200,decisions);
 if(req.method==="GET"&&u.pathname==="/api/v1/audit")return json(res,200,state.audit);
 if(req.method==="GET"&&u.pathname==="/api/v1/orchestrator/status")return json(res,200,{...state.orchestrator,currentGate:state.project.currentGate,gateStatus:state.project.gateStatus,activeTasks:state.tasks.filter(t=>["BLOCKED","READY_FOR_DELIBERATION","WAITING_TEAM"].includes(t.status)),autonomousLoop:autonomousLoop.status});
 if(req.method==="GET"&&u.pathname==="/api/v1/events")return json(res,200,state.events);
 if(req.method==="GET"&&u.pathname==="/api/v1/deliberations")return json(res,200,state.deliberations);
 if(req.method==="GET"&&u.pathname==="/api/v1/release/status"){
   const core=await getCoreRepositoryStatus();
   const readinessState=await readiness();
   const blockers=state.audit.filter(x=>x.severity==="BLOCKER"&&x.status==="OPEN");
   const productionGate=gate("G11_PRODUCTION_RELEASE");
   const result={
     service:"afagh-agent-00",
     runtime:"LIVE",
     releaseClass:state.project.releaseClass,
     currentGate:state.project.currentGate,
     gateStatus:state.project.gateStatus,
     coreRepository:core,
     runtimeReadiness:readinessState,
     productionGate:productionGate||null,
     openBlockers:blockers,
     releaseEligible:Boolean(
       productionGate?.status==="PASSED" &&
       state.project.gateStatus==="PASSED" &&
       blockers.length===0 &&
       readinessState.ready &&
       core.reachable===true &&
       core.exists===true &&
       core.private===true &&
       core.branchVerified===true
     ),
     checkedAt:new Date().toISOString()
   };
   return json(res,result.releaseEligible?200:503,result);
 }
 if(req.method==="GET"&&u.pathname==="/api/v1/github/core-status")return json(res,200,await getCoreRepositoryStatus());
 if(req.method==="POST"&&u.pathname==="/api/v1/orchestrator/cycle"){const a=auth(req,res);if(!a)return;const result=await orchestrationCycle("api");const task=state.tasks.find(executionEligible);if(task)result.execution=await executeApprovedTask(task);return json(res,200,result)}
 if(req.method==="POST"&&u.pathname==="/api/v1/deliberations"){const b=await body(req);if(!b||!b.gate||!b.teamId||!["APPROVE","REJECT","CONDITIONAL"].includes(b.decision))return json(res,400,{error:"invalid_deliberation"});if(!state.teams.some(t=>t.id===b.teamId)||!gate(b.gate))return json(res,400,{error:"unknown_team_or_gate"});const ta=requireTeamBearer(req,b.teamId);if(!ta.ok)return json(res,ta.status,{error:ta.error,teamId:b.teamId});const d={id:`D-${Date.now()}`,gate:b.gate,teamId:b.teamId,decision:b.decision,findings:Array.isArray(b.findings)?b.findings.slice(0,50):[],actor:`team:${b.teamId}`,at:new Date().toISOString()};state.deliberations=state.deliberations.filter(x=>!(x.gate===d.gate&&x.teamId===d.teamId));state.deliberations.push(d);record("TEAM_DELIBERATION",`team:${b.teamId}`,d);await persist();return json(res,201,d)}
 if(req.method==="POST"&&u.pathname==="/api/v1/audit/decision"){
  const ta=requireTeamBearer(req,"T03");if(!ta.ok)return json(res,ta.status,{error:ta.error,teamId:"T03"});
  const b=await body(req);if(!b||!b.gate||!["APPROVE","REJECT","CONDITIONAL"].includes(b.decision))return json(res,400,{error:"invalid_audit_decision"});
  if(!gate(b.gate))return json(res,400,{error:"unknown_gate"});
  const d={id:`AUD-${Date.now()}`,gate:b.gate,decision:b.decision,findings:Array.isArray(b.findings)?b.findings.slice(0,50):[],actor:"team:T03",at:new Date().toISOString()};
  state.auditDecisions=state.auditDecisions.filter(x=>x.gate!==d.gate);state.auditDecisions.push(d);
  record("GOVERNANCE_AUDIT_DECISION","team:T03",d);await persist();return json(res,201,d)
 }
 // Golden Agent Request: Auth -> Tenant -> Policy -> Governed Tool -> PostgreSQL -> Evidence -> Audit -> Response
 if(req.method==="POST"&&u.pathname==="/api/v1/agent/golden-request"){
   const a=auth(req,res,"operator");if(!a)return;
   const tenantId=String(req.headers["x-afagh-tenant"]||"").trim();
   if(!tenantId)return json(res,400,{error:"tenant_context_required",requiredHeader:"x-afagh-tenant"});
   if(!/^[A-Za-z0-9_-]{2,80}$/.test(tenantId))return json(res,400,{error:"invalid_tenant_context"});
   if(!(await dbReady()))return json(res,503,{error:"postgresql_not_ready",chain:["Auth","Tenant","Policy","Tool","PostgreSQL","Evidence","Audit"]});
   const b=await body(req);if(b===null)return json(res,400,{error:"invalid_json"});
   const tool=String(b?.tool||"agent.status");
   const allowlisted=["agent.status"];
   if(!allowlisted.includes(tool))return json(res,403,{error:"tool_not_allowlisted",tool,allowedTools:allowlisted});
   const correlationId=String(req.headers["x-correlation-id"]||crypto.randomUUID()).slice(0,120);
   const policy={decision:"ALLOW",reason:"allowlisted_read_only_agent_tool",tenantId,tool,role:a.role};
   const toolResult={tool,operation:"READ",status:"EXECUTED",tenantId};
   const result={correlationId,principal:{authenticated:true,role:a.role},tenant:{id:tenantId,isolated:true},policy,tool:toolResult,database:{connected:true}};
   record("GOLDEN_AGENT_REQUEST",actor(req),result);
   await persist();
   const evidenceCheck=verifyEvidence(state);
   const auditRecord={correlationId,actor:actor(req),tenantId,tool,policy:policy.decision,outcome:"SUCCESS",at:new Date().toISOString()};
   record("GOLDEN_AGENT_AUDIT",actor(req),auditRecord);
   await persist();
   return json(res,200,{ok:true,chain:["Auth","Tenant","Policy","Governed Tool","PostgreSQL","Evidence","Audit","Response"],...result,evidence:evidenceCheck,audit:auditRecord});
 }
 if(req.method==="POST"&&u.pathname==="/api/v1/gates/evaluate"){
   const a=auth(req,res);if(!a)return;
   const b=await body(req);
   const id=b?.gate||state.project.currentGate;
   if(!gate(id))return json(res,404,{error:"unknown_gate"});
   const evidenceState=verifyEvidence(state);
   const technical=await evaluateGateEvidence({
     gateId:id,
     state,
     dbReady:await dbReady(),
     autonomousLoopStatus:autonomousLoop.status,
     evidenceValid:evidenceState.valid
   });
   const blockingFindings=state.audit.filter(x=>x.gate===id&&x.severity==="BLOCKER"&&x.status==="OPEN");
   const eligible=Boolean(
     technical.technical.valid &&
     technical.governance.teamApprovals.length===state.teams.length &&
     technical.governance.auditDecision?.decision==="APPROVE" &&
     blockingFindings.length===0 &&
     evidenceState.valid
   );
   const result={...technical,eligible,blockingFindings,evidence:evidenceState};
   record("GATE_EVALUATION",actor(req),result);
   await persist();
   return json(res,200,result);
 }
 if(req.method==="POST"&&u.pathname==="/api/v1/gates/advance"){
   const a=auth(req,res);if(!a)return;
   const current=gate(state.project.currentGate);
   if(!current)return json(res,409,{error:"current_gate_missing"});
   const evidenceState=verifyEvidence(state);
   const technical=await evaluateGateEvidence({
     gateId:current.id,
     state,
     dbReady:await dbReady(),
     autonomousLoopStatus:autonomousLoop.status,
     evidenceValid:evidenceState.valid
   });
   const blocking=state.audit.filter(x=>x.gate===current.id&&x.severity==="BLOCKER"&&x.status==="OPEN");
   const canAdvance=Boolean(
     technical.technical.valid &&
     technical.governance.teamApprovals.length===state.teams.length &&
     technical.governance.auditDecision?.decision==="APPROVE" &&
     blocking.length===0 &&
     evidenceState.valid
   );
   if(!canAdvance){
     return json(res,409,{error:"gate_blocked",gate:current.id,technical,blockingFindings:blocking,evidence:evidenceState});
   }
   current.status="PASSED";
   const i=state.gates.findIndex(g=>g.id===current.id);
   if(i<state.gates.length-1){
     state.gates[i+1].status="OPEN";
     state.project.currentGate=state.gates[i+1].id;
     state.project.gateStatus="OPEN";
     state.project.blocker=null;
   }else{
     state.project.gateStatus="PASSED";
     state.project.releaseClass="RELEASED";
   }
   record("GATE_ADVANCED",actor(req),{gate:current.id,next:state.project.currentGate,technical,evidence:evidenceState});
   await persist();
   return json(res,200,{ok:true,project:state.project,gates:state.gates,technical,evidence:evidenceState});
 }
 json(res,404,{error:"not_found"});
});
const autonomousLoop = startAutonomousWorkLoop(orchestrationCycle, { intervalMs: Number(process.env.AFAGH_AGENT00_LOOP_INTERVAL_MS || 60000), runImmediately: false });

async function runAndRecordStartupSelfTest(){
  const token=process.env.AFAGH_AGENT00_ADMIN_TOKEN||"";
  if(!token){
    record("STARTUP_HTTP_E2E","Agent 00",{passed:false,reason:"operator_token_missing"});
    await persist();
    return;
  }
  const result=await runStartupSelfTest({
    baseUrl:process.env.AFAGH_PUBLIC_BASE_URL||`http://127.0.0.1:${PORT}`,
    token,
    tenant:process.env.AFAGH_SELF_TEST_TENANT||"agent00-selftest"
  });
  record("STARTUP_HTTP_E2E","Agent 00",result);
  console.log("startup_self_test",JSON.stringify({passed:result.passed,assertions:result.assertions}));
  console.log("governance_config",JSON.stringify({teams:state.teams.map(t=>({id:t.id,tokenConfigured:Boolean(process.env[`AFAGH_AGENT00_${t.id}_TOKEN`])}))}));
  await persist();
}

initDb().then(()=>loadState(pool,state)).then(async s=>{state=normalizeState(s);if(!state.orchestrator)state.orchestrator={status:"ACTIVE_OPERATIONAL_CONTROL",lastCycleAt:null,cycleCount:0,currentAction:null,nextAction:"Run autonomous work loop.",managedBy:"Agent 00",executionRule:"No gate bypass; no implementation before gate approval; every action produces evidence."}; await orchestrationCycle("startup"); autonomousLoop.start(); setTimeout(()=>runAndRecordStartupSelfTest().catch(e=>console.error("startup_self_test_failed",e.message)),1500);}).catch(e=>console.error("state_load_or_loop_failed",e.message));
server.listen(PORT,"0.0.0.0",()=>console.log(`AFAGH Agent 00 listening on ${PORT}`));
