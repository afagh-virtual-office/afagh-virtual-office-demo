export async function runStartupSelfTest({baseUrl,token,tenant="agent00-selftest"}) {
  const results = [];
  async function call(name, path, options={}) {
    try {
      const res = await fetch(baseUrl + path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(token ? { authorization: `Bearer ${token}` } : {})
        }
      });
      let body;
      try { body = await res.json(); } catch { body = null; }
      const ok = res.ok;
      results.push({name,status:res.status,ok,body});
      return {res,body};
    } catch (error) {
      results.push({name,status:0,ok:false,error:error?.message||String(error)});
      return {res:null,body:null};
    }
  }

  await call("health","/api/v1/health");
  await call("ready","/api/v1/ready");
  await call("homepage","/");
  await call("virtual_experts_page","/virtual-experts.html");
  await call("settings_page","/settings.html");
  const modules = await call("module_registry","/api/v1/modules");
  const experts = await call("virtual_experts","/api/v1/modules/virtual-experts");
  const operations = await call("intelligent_operations","/api/v1/modules/intelligent-operations");
  const governance = await call("governance","/api/v1/modules/governance");
  const evidenceModule = await call("evidence_module","/api/v1/modules/evidence");
  const authModule = await call("authentication_module","/api/v1/modules/authentication");
  const settingsModule = await call("settings_module","/api/v1/modules/settings");
  const communicationHealth = await call("communication_health","/api/v1/communication/health");
  const communicationProof = await call("communication_db_proof","/api/v1/communication/proof/db");
  const communicationEvents = await call("communication_events","/api/v1/communication/events");
  const communicationActions = await call("communication_actions","/api/v1/communication/actions");
  const commandCenter = await call("command_center","/api/v1/command",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({command:"status"})
  });
  const golden = await call("golden_request","/api/v1/agent/golden-request",{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-afagh-tenant":tenant,
      "x-correlation-id":`startup-${Date.now()}`
    },
    body:JSON.stringify({tool:"agent.status"})
  });
  const missingTenant = await call("tenant_required","/api/v1/agent/golden-request",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({tool:"agent.status"})
  });
  const unknownTool = await call("tool_allowlist","/api/v1/agent/golden-request",{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-afagh-tenant":tenant
    },
    body:JSON.stringify({tool:"agent.forbidden"})
  });

  const chain = golden.body?.chain || [];
  const chainExpected = ["Auth","Tenant","Policy","Governed Tool","PostgreSQL","Evidence","Audit","Response"];
  return {
    test:"STARTUP_HTTP_E2E",
    passed:
      results.find(x=>x.name==="health")?.status===200 &&
      results.find(x=>x.name==="ready")?.status===200 &&
      golden.res?.status===200 &&
      golden.body?.ok===true &&
      JSON.stringify(chain)===JSON.stringify(chainExpected) &&
      missingTenant.res?.status===400 &&
      unknownTool.res?.status===403 &&
      modules.res?.status===200 &&
      Array.isArray(modules.body?.modules) &&
      modules.body.modules.length===8 &&
      modules.body.modules.every(x=>x.status==="ACTIVE") &&
      experts.res?.status===200 && (experts.body?.count||0)>=8 &&
      operations.res?.status===200 &&
      governance.res?.status===200 &&
      evidenceModule.res?.status===200 &&
      authModule.res?.status===200 &&
      settingsModule.res?.status===200 &&
      communicationHealth.res?.status===200 &&
      communicationProof.res?.status===200 &&
      communicationProof.body?.connection?.ok===true &&
      communicationProof.body?.communication_tables?.complete===true &&
      communicationEvents.res?.status===200 &&
      communicationActions.res?.status===200 &&
      commandCenter.res?.status===200,
    results,
    assertions:{
      goldenChain:JSON.stringify(chain)===JSON.stringify(chainExpected),
      tenantIsolationBoundary:missingTenant.res?.status===400,
      toolGovernanceBoundary:unknownTool.res?.status===403,
      moduleRegistry:modules.res?.status===200,
      allModulesActive:Array.isArray(modules.body?.modules) && modules.body.modules.length===8 && modules.body.modules.every(x=>x.status==="ACTIVE"),
      virtualExpertWorkforce:(experts.res?.status===200 && (experts.body?.count||0)>=8),
      intelligentOperations:operations.res?.status===200,
      governanceModule:governance.res?.status===200,
      evidenceModule:evidenceModule.res?.status===200,
      authenticationModule:authModule.res?.status===200,
      settingsModule:settingsModule.res?.status===200,
      communicationHealth:communicationHealth.res?.status===200,
      communicationDbProof:communicationProof.res?.status===200 && communicationProof.body?.communication_tables?.complete===true,
      communicationEvents:communicationEvents.res?.status===200,
      communicationActions:communicationActions.res?.status===200,
      commandCenter:commandCenter.res?.status===200,
      staticPages:results.filter(x=>["homepage","virtual_experts_page","settings_page"].includes(x.name)).every(x=>x.status===200)
    },
    moduleStatuses:modules.body?.modules||[]
  };
}
