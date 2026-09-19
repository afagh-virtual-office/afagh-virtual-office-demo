const API = "https://api.github.com";

export async function githubRequest(path, options = {}) {
  const token = process.env.AFAGH_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
  if (!token) return {ok:false, status:503, error:"github_token_not_configured"};
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "accept":"application/vnd.github+json",
      "x-github-api-version":"2022-11-28",
      "authorization":`Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = {raw:text}; }
  return {ok:res.ok,status:res.status,data};
}

export async function getRepository(fullName) {
  return githubRequest(`/repos/${encodeURIComponent(fullName).replace("%2F","/")}`);
}

export async function getBranch(fullName, branch) {
  return githubRequest(`/repos/${encodeURIComponent(fullName).replace("%2F","/")}/branches/${encodeURIComponent(branch)}`);
}

export async function getCoreRepositoryStatus() {
  const fullName = process.env.AFAGH_CORE_REPOSITORY || "afagh-virtual-office/afagh-virtual-office";
  const result = await getRepository(fullName);
  return {
    repository: fullName,
    reachable: result.ok,
    status: result.status,
    exists: result.ok,
    private: result.ok ? !!result.data.private : null,
    defaultBranch: result.ok ? result.data.default_branch : null,
    error: result.ok ? null : (result.data?.message || result.error || "github_request_failed")
  };
}
