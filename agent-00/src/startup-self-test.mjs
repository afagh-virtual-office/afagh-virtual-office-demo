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
      unknownTool.res?.status===403,
    results,
    assertions:{
      goldenChain:JSON.stringify(chain)===JSON.stringify(chainExpected),
      tenantIsolationBoundary:missingTenant.res?.status===400,
      toolGovernanceBoundary:unknownTool.res?.status===403
    }
  };
}
