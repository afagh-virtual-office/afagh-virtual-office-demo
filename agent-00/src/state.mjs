import crypto from "node:crypto";

function canonicalize(value){
  if(Array.isArray(value)) return value.map(canonicalize);
  if(value && typeof value==="object"){
    return Object.keys(value).sort().reduce((out,key)=>{out[key]=canonicalize(value[key]);return out}, {});
  }
  return value;
}
function digestEvidence(evidence){
  return crypto.createHash("sha256").update(JSON.stringify(canonicalize(evidence))).digest("hex");
}
function rehashEvidenceChain(state){
  if(!Array.isArray(state.evidence)||state.evidence.length===0){state.evidenceSchemaVersion=2;return false}
  let previous="GENESIS";
  let changed=false;
  for(const item of state.evidence){
    const copy={...item,previousHash:previous};
    delete copy.hash;
    const hash=digestEvidence(copy);
    if(item.previousHash!==previous||item.hash!==hash){item.previousHash=previous;item.hash=hash;changed=true}
    previous=hash;
  }
  state.evidenceSchemaVersion=2;
  return changed;
}
export function createState({project,teams,gates,tasks,decisions,audit}){return{project:structuredClone(project),teams:structuredClone(teams),gates:structuredClone(gates),tasks:structuredClone(tasks),decisions:structuredClone(decisions),audit:structuredClone(audit),deliberations:[],auditDecisions:[],evidence:[],events:[],version:1,evidenceSchemaVersion:2}}
export function appendEvent(state,type,actor,payload){const event={id:crypto.randomUUID(),seq:state.events.length+1,type,actor:actor||"system",payload,at:new Date().toISOString()};state.events.push(event);state.version+=1;return event}
export function appendEvidence(state,type,actor,payload){const previous=state.evidence.at(-1)?.hash||"GENESIS";const evidence={id:crypto.randomUUID(),seq:state.evidence.length+1,type,actor:actor||"system",payload,previousHash:previous,at:new Date().toISOString()};evidence.hash=digestEvidence(evidence);state.evidence.push(evidence);state.evidenceSchemaVersion=2;state.version+=1;return evidence}
export function verifyEvidence(state){let previous="GENESIS";for(const item of state.evidence){const copy={...item};delete copy.hash;const expected=digestEvidence(copy);if(item.previousHash!==previous||item.hash!==expected)return{valid:false,failedEvidenceId:item.id};previous=item.hash}return{valid:true,count:state.evidence.length,lastHash:previous}}
export async function loadState(pool,fallback){
  if(!pool)return fallback;
  await pool.query("create table if not exists agent00_state (key text primary key,value jsonb not null,updated_at timestamptz not null default now())");
  const r=await pool.query("select value from agent00_state where key='orchestrator_state' limit 1");
  if(!r.rowCount){await saveState(pool,fallback);return fallback}
  const state=r.rows[0].value;
  if(state.evidenceSchemaVersion!==2){
    if(rehashEvidenceChain(state)){state.version=(state.version||0)+1}
    await saveState(pool,state);
  }
  return state;
}
export async function saveState(pool,state){if(!pool)return;await pool.query("insert into agent00_state(key,value,updated_at) values('orchestrator_state',$1,now()) on conflict(key) do update set value=excluded.value,updated_at=now()",[JSON.stringify(state)])}
