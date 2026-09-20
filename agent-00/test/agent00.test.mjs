import test from "node:test";
import assert from "node:assert/strict";
import {createState,appendEvidence,verifyEvidence} from "../src/state.mjs";
import {requireBearer,requireTeamBearer,auditActor} from "../src/auth.mjs";
import {runStartupSelfTest} from "../src/startup-self-test.mjs";

test("evidence chain verifies",()=>{
  const s=createState({project:{},teams:[],gates:[],tasks:[],decisions:[],audit:[]});
  appendEvidence(s,"TEST","test",{ok:true});
  appendEvidence(s,"TEST","test",{ok:true});
  assert.equal(verifyEvidence(s).valid,true);
});

test("evidence tampering is detected",()=>{
  const s=createState({project:{},teams:[],gates:[],tasks:[],decisions:[],audit:[]});
  appendEvidence(s,"TEST","test",{ok:true});
  s.evidence[0].payload.ok=false;
  assert.equal(verifyEvidence(s).valid,false);
});

test("operator authentication never trusts client actor headers",()=>{
  const old=process.env.AFAGH_AGENT00_ADMIN_TOKEN;
  process.env.AFAGH_AGENT00_ADMIN_TOKEN="operator-test";
  const req={headers:{authorization:"Bearer operator-test","x-afagh-actor":"attacker"}};
  const result=requireBearer(req,"operator");
  assert.equal(result.ok,true);
  req.__afaghPrincipal="operator";
  assert.equal(auditActor(req),"operator");
  if(old===undefined) delete process.env.AFAGH_AGENT00_ADMIN_TOKEN; else process.env.AFAGH_AGENT00_ADMIN_TOKEN=old;
});

test("team authentication is team-specific",()=>{
  const old=process.env.AFAGH_AGENT00_T01_TOKEN;
  process.env.AFAGH_AGENT00_T01_TOKEN="t01-test";
  const ok=requireTeamBearer({headers:{authorization:"Bearer t01-test"}},"T01");
  const bad=requireTeamBearer({headers:{authorization:"Bearer t01-test"}},"T02");
  assert.equal(ok.ok,true);
  assert.equal(bad.ok,false);
  if(old===undefined) delete process.env.AFAGH_AGENT00_T01_TOKEN; else process.env.AFAGH_AGENT00_T01_TOKEN=old;
});

test("startup self-test validates the real HTTP contract",async()=>{
  const responses=new Map([
    ["/api/v1/health",{status:200,body:{status:"ok"}}],
    ["/api/v1/ready",{status:200,body:{ready:true}}],
    ["/api/v1/agent/golden-request",{status:200,body:{
      ok:true,
      chain:["Auth","Tenant","Policy","Governed Tool","PostgreSQL","Evidence","Audit","Response"]
    }}]
  ]);
  const oldFetch=global.fetch;
  global.fetch=async (_url,options={})=>{
    const path=new URL(_url).pathname;
    const entry=responses.get(path);
    if(path==="/api/v1/agent/golden-request"){
      const body=JSON.parse(options.body);
      if(!options.headers?.authorization)return {status:401,ok:false,json:async()=>({error:"bearer_token_required"})};
      if(!options.headers?.["x-afagh-tenant"])return {status:400,ok:false,json:async()=>({error:"tenant_context_required"})};
      if(body.tool!=="agent.status")return {status:403,ok:false,json:async()=>({error:"tool_not_allowlisted"})};
      if(options.headers?.["x-afagh-tenant"] && body.tool==="agent.forbidden")return {status:403,ok:false,json:async()=>({error:"tool_not_allowlisted"})};
    }
    if(path==="/api/v1/agent/golden-request" && !options.headers?.["x-afagh-tenant"])
      return {status:400,ok:false,json:async()=>({error:"tenant_context_required"})};
    if(path==="/api/v1/agent/golden-request" && options.headers?.["x-afagh-tenant"] && JSON.parse(options.body).tool!=="agent.status")
      return {status:403,ok:false,json:async()=>({error:"tool_not_allowlisted"})};
    if(entry)return {status:entry.status,ok:entry.status>=200&&entry.status<300,json:async()=>entry.body};
    return {status:404,ok:false,json:async()=>({error:"not_found"})};
  };
  const result=await runStartupSelfTest({baseUrl:"http://127.0.0.1:10000",token:"operator-test",tenant:"test-tenant"});
  global.fetch=oldFetch;
  assert.equal(result.passed,true);
});
