import crypto from "node:crypto";

const CORE = process.env.AFAGH_CORE_REPOSITORY || "afagh-virtual-office/afagh-virtual-office";
const BASE = process.env.AFAGH_CORE_BASE_BRANCH || "main";

function ghHeaders() {
  const token = process.env.AFAGH_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
  if (!token) throw new Error("github_token_missing");
  return {
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "x-github-api-version": "2022-11-28",
    authorization: `Bearer ${token}`,
  };
}
async function gh(path, options={}) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), 10000);
  try {
    const res = await fetch("https://api.github.com" + path, {...options, signal:c.signal, headers:{...ghHeaders(),...(options.headers||{})}});
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = {raw:text}; }
    if (!res.ok) throw new Error(`github_${res.status}:${data.message||"request_failed"}`);
    return data;
  } finally { clearTimeout(timer); }
}

function assertSafePlan(plan) {
  if (!plan || plan.repository !== CORE) throw new Error("execution_repository_not_core");
  if (plan.baseBranch !== BASE) throw new Error("execution_base_branch_not_allowed");
  if (!["CREATE_FILE","UPDATE_FILE"].includes(plan.operation)) throw new Error("execution_operation_not_allowlisted");
  if (!/^docs\/[A-Za-z0-9._\/-]+\.md$/.test(plan.path)) throw new Error("execution_path_not_allowlisted");
  if (typeof plan.content !== "string" || plan.content.length > 50000) throw new Error("execution_content_invalid");
  if (plan.path.includes("..")) throw new Error("execution_path_traversal");
}

async function getRef() {
  return gh(`/repos/${CORE}/git/ref/heads/${encodeURIComponent(BASE)}`);
}

async function createBranch(branch, sha) {
  return gh(`/repos/${CORE}/git/refs`, {
    method:"POST",
    body:JSON.stringify({ref:`refs/heads/${branch}`,sha})
  });
}

async function getFile(path, branch) {
  try { return await gh(`/repos/${CORE}/contents/${path}?ref=${encodeURIComponent(branch)}`); }
  catch (e) { if (String(e.message).startsWith("github_404:")) return null; throw e; }
}

async function writeFile(plan, branch, existing) {
  const body = {
    message: plan.commitMessage || `agent-00: execute ${plan.path}`,
    content: Buffer.from(plan.content,"utf8").toString("base64"),
    branch,
  };
  if (existing?.sha) body.sha = existing.sha;
  return gh(`/repos/${CORE}/contents/${plan.path}`, {method:"PUT", body:JSON.stringify(body)});
}

async function openPr(branch, plan) {
  return gh(`/repos/${CORE}/pulls`, {
    method:"POST",
    body:JSON.stringify({
      title: plan.title || `Agent 00 execution: ${plan.path}`,
      head: branch,
      base: BASE,
      draft: true,
      body: [
        "## Agent 00 Controlled Execution",
        "",
        `- Task: ${plan.taskId}`,
        "- Mode: controlled execution",
        "- Repository: Core",
        "- Direct main writes: prohibited",
        "- Merge authority: human / repository governance",
        "",
        "This PR was created by an allowlisted Agent 00 execution plan."
      ].join("\n")
    })
  });
}

export async function executeCorePlan(plan) {
  assertSafePlan(plan);
  const ref = await getRef();
  const branch = `agent-00/task-${plan.taskId.replace(/[^A-Za-z0-9_-]/g,"-")}-${Date.now()}`;
  await createBranch(branch, ref.object.sha);
  const existing = await getFile(plan.path, branch);
  if (plan.operation === "CREATE_FILE" && existing) throw new Error("execution_create_target_exists");
  if (plan.operation === "UPDATE_FILE" && !existing) throw new Error("execution_update_target_missing");
  const write = await writeFile(plan, branch, existing);
  const pr = await openPr(branch, plan);
  return {
    executionId: `EXE-${crypto.randomUUID()}`,
    repository: CORE,
    baseBranch: BASE,
    branch,
    commit: write.commit?.sha || null,
    pullRequest: {number:pr.number,url:pr.html_url,state:pr.state,draft:pr.draft},
    operation: plan.operation,
    path: plan.path,
  };
}
