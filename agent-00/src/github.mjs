const API="https://api.github.com";
const DEFAULT_CORE_REPOSITORY="afagh-virtual-office/afagh-virtual-office";
const DEFAULT_BRANCH="main";

function githubHeaders(token,extra={}){
  return {
    "accept":"application/vnd.github+json",
    "x-github-api-version":"2022-11-28",
    ...(token?{"authorization":"Bearer "+token}:{}),
    ...extra
  };
}

export async function githubRequest(path,options={}){
  const token=process.env.AFAGH_GITHUB_TOKEN||process.env.GITHUB_TOKEN||"";
  const c=new AbortController();
  const t=setTimeout(()=>c.abort(),8000);
  try{
    const res=await fetch(API+path,{
      ...options,
      signal:c.signal,
      headers:githubHeaders(token,options.headers||{})
    });
    const text=await res.text();
    let data;
    try{data=JSON.parse(text)}catch{data={raw:text}}
    return{
      ok:res.ok,
      status:res.status,
      data,
      tokenConfigured:Boolean(token),
      rateLimitRemaining:res.headers.get("x-ratelimit-remaining"),
      rateLimitReset:res.headers.get("x-ratelimit-reset"),
      rateLimitResource:res.headers.get("x-ratelimit-resource")
    };
  }catch(e){
    return{
      ok:false,
      status:502,
      error:e?.name==="AbortError"?"github_request_timeout":"github_request_failed",
      tokenConfigured:Boolean(token)
    };
  }finally{
    clearTimeout(t);
  }
}

export async function getRepository(fullName){
  return githubRequest("/repos/"+fullName.split("/").map(encodeURIComponent).join("/"));
}

export async function getBranch(fullName,branch){
  return githubRequest(
    "/repos/"+fullName.split("/").map(encodeURIComponent).join("/")
    +"/branches/"+encodeURIComponent(branch)
  );
}

function classifyFailure(result){
  if(result.status===401){
    return {code:"GITHUB_AUTH_INVALID",message:"GitHub rejected the runtime credential."};
  }
  if(result.status===403){
    const rateLimited=String(result.data?.message||"").toLowerCase().includes("rate limit")
      || result.rateLimitRemaining==="0";
    return rateLimited
      ? {code:"GITHUB_RATE_LIMITED",message:"GitHub API rate limit blocked the runtime request; authenticated runtime access must be verified."}
      : {code:"GITHUB_FORBIDDEN",message:"GitHub denied the runtime credential for this repository."};
  }
  if(result.status===404){
    return {code:"GITHUB_REPOSITORY_NOT_FOUND_OR_UNAUTHORIZED",message:"GitHub returned 404; the repository may be missing or the runtime credential may not have access."};
  }
  if(result.status===502){
    return {code:"GITHUB_NETWORK_FAILURE",message:result.error||"GitHub request failed."};
  }
  return {code:"GITHUB_REQUEST_FAILED",message:result.data?.message||result.error||"GitHub request failed."};
}

export async function getCoreRepositoryStatus(){
  const repository=process.env.AFAGH_CORE_REPOSITORY||DEFAULT_CORE_REPOSITORY;
  const expectedBranch=process.env.AFAGH_CORE_REPOSITORY_BRANCH||DEFAULT_BRANCH;
  const repo=await getRepository(repository);

  if(!repo.ok){
    const failure=classifyFailure(repo);
    return{
      repository,
      expectedBranch,
      tokenConfigured:repo.tokenConfigured,
      authenticatedRuntimeAccess:repo.tokenConfigured && repo.status!==401 && repo.status!==403,
      reachable:false,
      exists:false,
      private:null,
      defaultBranch:null,
      branchVerified:false,
      status:repo.status,
      failureCode:failure.code,
      error:failure.message,
      rateLimitRemaining:repo.rateLimitRemaining??null,
      rateLimitReset:repo.rateLimitReset??null,
      checkedAt:new Date().toISOString()
    };
  }

  const privateRepo=repo.data?.private===true;
  const defaultBranch=repo.data?.default_branch||null;
  const branch=await getBranch(repository,expectedBranch);

  if(!branch.ok){
    const failure=classifyFailure(branch);
    return{
      repository,
      expectedBranch,
      tokenConfigured:repo.tokenConfigured,
      authenticatedRuntimeAccess:true,
      reachable:true,
      exists:true,
      private:privateRepo,
      defaultBranch,
      branchVerified:false,
      status:branch.status,
      failureCode:failure.code,
      error:failure.message,
      rateLimitRemaining:branch.rateLimitRemaining??null,
      rateLimitReset:branch.rateLimitReset??null,
      checkedAt:new Date().toISOString()
    };
  }

  return{
    repository,
    expectedBranch,
    tokenConfigured:repo.tokenConfigured,
    authenticatedRuntimeAccess:true,
    reachable:true,
    exists:true,
    private:privateRepo,
    defaultBranch,
    branchVerified:true,
    status:200,
    failureCode:null,
    error:null,
    rateLimitRemaining:repo.rateLimitRemaining??null,
    rateLimitReset:repo.rateLimitReset??null,
    checkedAt:new Date().toISOString()
  };
}
