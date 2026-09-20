const CORE="afagh-virtual-office/afagh-virtual-office";
const ARCHITECTURE_DOCS=[
  "docs/architecture/PHASE-1-FINAL-REVIEW.md",
  "docs/architecture/ADR-INDEX.md",
  "docs/architecture/DECISION_LOG.md",
  "docs/architecture/DOMAIN_ARCHITECTURE.md",
  "docs/architecture/EVENT_CATALOG.md",
  "docs/architecture/SCENARIO_CONTRACT_MATRIX.md",
  "docs/architecture/DEPENDENCY_RULES.md"
];

async function githubGet(path){
  const token=process.env.AFAGH_GITHUB_TOKEN||process.env.GITHUB_TOKEN||"";
  const res=await fetch("https://api.github.com"+path,{
    headers:{
      accept:"application/vnd.github+json",
      "x-github-api-version":"2022-11-28",
      ...(token?{authorization:"Bearer "+token}:{})
    }
  });
  const text=await res.text();
  let data; try{data=JSON.parse(text)}catch{data={raw:text}};
  return {ok:res.ok,status:res.status,data};
}

async function architectureEvidence(){
  const files=[];
  for(const path of ARCHITECTURE_DOCS){
    const r=await githubGet(`/repos/${CORE}/contents/${path}?ref=main`);
    const text=Buffer.from(String(r.data?.content||"").replace(/\n/g,""),"base64").toString("utf8");
    files.push({
      path,
      reachable:r.ok,
      status:r.status,
      approvedMarker:/APPROVED/i.test(text),
      contentMarker:Boolean(text)
    });
  }
  const phase=files.find(x=>x.path.endsWith("PHASE-1-FINAL-REVIEW.md"));
  const adr=files.find(x=>x.path.endsWith("ADR-INDEX.md"));
  return {
    valid:Boolean(phase?.reachable&&adr?.reachable&&phase?.approvedMarker&&adr?.approvedMarker&&files.every(x=>x.reachable&&x.contentMarker)),
    files
  };
}

export async function evaluateGateEvidence({gateId,state,dbReady,autonomousLoopStatus,evidenceValid}){
  const evidence=Array.isArray(state?.evidence)?state.evidence:[];
  const latest=(type)=>[...evidence].reverse().find(x=>x.type===type);
  const startup=latest("STARTUP_HTTP_E2E");
  const golden=latest("GOLDEN_AGENT_REQUEST");
  const goldenAudit=latest("GOLDEN_AGENT_AUDIT");
  const governanceAudit=state?.auditDecisions?.find(x=>x.gate===gateId);
  const result={gate:gateId,technical:{valid:false,checks:{}}};

  if(gateId==="G01_CORE_REPOSITORY"){
    const core=latest("CORE_REPOSITORY_CHECK")?.payload;
    result.technical.checks.coreRepository=Boolean(core?.reachable&&core?.exists&&core?.private&&core?.branchVerified&&core?.defaultBranch==="main");
  }else if(gateId==="G02_ARCHITECTURE_BASELINE"){
    result.technical.checks.architecture=await architectureEvidence();
  }else if(gateId==="G03_IDENTITY_AUTHENTICATION"){
    result.technical.checks.authConfigured=Boolean(
      process.env.AFAGH_AGENT00_ADMIN_TOKEN &&
      process.env.AFAGH_AGENT00_T01_TOKEN &&
      process.env.AFAGH_AGENT00_T02_TOKEN &&
      process.env.AFAGH_AGENT00_T03_TOKEN
    );
    result.technical.checks.httpAuthEvidence=Boolean(startup?.payload?.assertions);
    result.technical.checks.authFailureBoundary=Array.isArray(startup?.payload?.results)
      && startup.payload.results.some(x=>x.name==="tenant_required" && x.status===400);
  }else if(gateId==="G04_TENANT_WORKSPACE"){
    result.technical.checks.tenantRequired=Boolean(startup?.payload?.assertions?.tenantIsolationBoundary);
    result.technical.checks.goldenTenantEcho=Boolean(golden?.payload?.tenant?.isolated===true);
  }else if(gateId==="G05_RUNTIME_POSTGRESQL"){
    result.technical.checks.database=Boolean(dbReady);
    result.technical.checks.readyEvidence=Boolean(startup?.payload?.results?.some(x=>x.name==="ready"&&x.status===200));
  }else if(gateId==="G06_BUSINESS_GOLDEN_PATH"){
    result.technical.checks.goldenExecuted=Boolean(golden?.payload?.policy?.decision==="ALLOW"&&golden?.payload?.tool?.status==="EXECUTED");
    result.technical.checks.goldenAudit=Boolean(goldenAudit?.payload?.outcome==="SUCCESS");
  }else if(gateId==="G07_AI_WORKFORCE"){
    result.technical.checks.autonomousLoop=Boolean(autonomousLoopStatus?.enabled && (autonomousLoopStatus?.cyclesCompleted||0)>0);
    result.technical.checks.controlledExecution=Boolean(state?.project?.mode==="CONTROLLED_EXECUTION");
    result.technical.checks.noDirectMainWrites=state?.tasks?.every(t=>t.execution?.baseBranch!=="main" || t.execution?.pullRequest?.number);
    result.technical.checks.workerEvidence=Boolean(evidence.some(x=>x.type==="ORCHESTRATION_CYCLE"));
  }else if(gateId==="G08_TRUST_EVIDENCE"){
    result.technical.checks.evidenceValid=Boolean(evidenceValid===true && state?.evidence?.length>=1);
  }else if(gateId==="G09_AUDIT"){
    result.technical.checks.goldenAudit=Boolean(goldenAudit?.payload?.outcome==="SUCCESS");
    result.technical.checks.auditDecisionRequired=Boolean(governanceAudit || gateId==="G09_AUDIT");
    result.technical.checks.attributableActor=Boolean(goldenAudit?.actor);
  }else if(gateId==="G10_E2E"){
    result.technical.checks.startupE2E=Boolean(startup?.payload?.passed===true);
    result.technical.checks.chain=Boolean(startup?.payload?.assertions?.goldenChain===true);
  }else if(gateId==="G11_PRODUCTION_RELEASE"){
    const priorIds=["G01_CORE_REPOSITORY","G02_ARCHITECTURE_BASELINE","G03_IDENTITY_AUTHENTICATION","G04_TENANT_WORKSPACE","G05_RUNTIME_POSTGRESQL","G06_BUSINESS_GOLDEN_PATH","G07_AI_WORKFORCE","G08_TRUST_EVIDENCE","G09_AUDIT","G10_E2E"];
    result.technical.checks.priorGates=priorIds.every(id=>state?.gates?.find(g=>g.id===id)?.status==="PASSED");
    result.technical.checks.noOpenBlockers=!state?.audit?.some(x=>x.severity==="BLOCKER"&&x.status==="OPEN");
    result.technical.checks.evidenceValid=Boolean(state?.evidence?.length);
  }else{
    result.technical.checks.unsupportedGate=false;
  }

  result.technical.valid=Object.values(result.technical.checks).every(v=>v===true || (v&&v.valid===true));
  result.governance={
    teamApprovals:(state?.teams||[]).map(t=>t.id).filter(id=>(state?.deliberations||[]).some(d=>d.gate===gateId&&d.teamId===id&&d.decision==="APPROVE")),
    auditDecision:governanceAudit||null
  };
  result.eligible=Boolean(result.technical.valid && result.governance.teamApprovals.length===(state?.teams||[]).length && governanceAudit?.decision==="APPROVE");
  return result;
}
