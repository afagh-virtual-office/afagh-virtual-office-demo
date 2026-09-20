import { loadBaselineExperts } from "../../runtime/virtual-experts/catalog.mjs";
import { listExperts } from "../../runtime/virtual-experts/registry.mjs";

const COMMUNICATION_URL = process.env.AFAGH_COMMUNICATION_RUNTIME_URL || "https://afagh-communication-os-runtime.onrender.com";
let expertsInitialized = false;
function ensureExperts(){ if(!expertsInitialized){ loadBaselineExperts(); expertsInitialized=true; } }

export async function getModuleRegistry({state,dbReady,autonomousLoopStatus}){
  ensureExperts();
  let communication={status:"UNREACHABLE",url:COMMUNICATION_URL};
  try{
    const r=await fetch(COMMUNICATION_URL+"/api/v1/communication/health",{cache:"no-store"});
    const body=await r.json().catch(()=>({}));
    communication={status:r.ok?String(body.status||"OK"):"BLOCKED",httpStatus:r.status,url:COMMUNICATION_URL,build:body.build||null,productionVerified:body.production_verified===true,dbProof:body.db_proof||null};
  }catch(error){ communication={status:"UNREACHABLE",url:COMMUNICATION_URL,error:error?.message||String(error)}; }
  const evidence=state?.evidence||[];
  return {
    generatedAt:new Date().toISOString(),
    modules:[
      {id:"M01",key:"command-center",name:"AI Command Center",status:"ACTIVE",mode:"LIVE_RUNTIME",endpoint:"/api/v1/command",capabilities:["status","gates","evidence","golden-request"]},
      {id:"M02",key:"virtual-experts",name:"Virtual Expert Workforce",status:listExperts().length?"ACTIVE":"BLOCKED",mode:"CONTROLLED_EXECUTION",endpoint:"/api/v1/modules/virtual-experts",count:listExperts().length,capabilities:["catalog","routing","controlled-journey"]},
      {id:"M03",key:"intelligent-operations",name:"Intelligent Operations",status:autonomousLoopStatus?.enabled?"ACTIVE":"BLOCKED",mode:"AUTONOMOUS_GOVERNED_LOOP",endpoint:"/api/v1/modules/intelligent-operations",cycles:autonomousLoopStatus?.cyclesCompleted||0,capabilities:["orchestration","tasks","gate-advance"]},
      {id:"M04",key:"governance",name:"Governance & Decision Room",status:(state?.teams?.length===3&&state?.gates?.length===11)?"ACTIVE":"BLOCKED",mode:"GATE_BASED",endpoint:"/api/v1/modules/governance",teams:state?.teams?.length||0,currentGate:state?.project?.currentGate},
      {id:"M05",key:"evidence",name:"Evidence Center",status:evidence.length?"ACTIVE":"BLOCKED",mode:"HASH_CHAINED",endpoint:"/api/v1/modules/evidence",count:evidence.length,integrity:evidence.length?"VERIFIED_BY_RUNTIME":"EMPTY"},
      {id:"M06",key:"communication",name:"Communication OS",status:communication.status==="CONTROLLED"?"ACTIVE":"BLOCKED",mode:"EXTERNAL_RUNTIME_BOUND",endpoint:COMMUNICATION_URL,health:communication},
      {id:"M07",key:"authentication",name:"Authentication & Identity",status:process.env.AFAGH_AGENT00_ADMIN_TOKEN?"ACTIVE":"BLOCKED",mode:"BEARER_RUNTIME",endpoint:"/api/v1/modules/authentication"},
      {id:"M08",key:"settings",name:"System Settings",status:dbReady?"ACTIVE":"BLOCKED",mode:"CONTROLLED_CONFIG",endpoint:"/api/v1/modules/settings"}
    ]
  };
}

export function getVirtualExperts({workspaceId=null}={}){
  ensureExperts();
  const experts=listExperts({workspaceId}).map(e=>({...e}));
  return {experts,count:experts.length,mode:"CONTROLLED_EXECUTION"};
}