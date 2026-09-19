import crypto from "node:crypto";

export function requireBearer(req, requiredRole = "operator") {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return {ok:false, status:401, error:"bearer_token_required"};
  const token = match[1];
  const admin = process.env.AFAGH_AGENT00_ADMIN_TOKEN || "";
  const viewer = process.env.AFAGH_AGENT00_VIEWER_TOKEN || "";
  const expected = requiredRole === "viewer" ? [admin, viewer].filter(Boolean) : [admin].filter(Boolean);
  if (!expected.length) return {ok:false, status:503, error:"authentication_not_configured"};
  const valid = expected.some(v => { const a=Buffer.from(token); const b=Buffer.from(v); return a.length===b.length && crypto.timingSafeEqual(a,b); });
  return valid ? {ok:true, role: token === admin ? "operator" : "viewer"} : {ok:false, status:403, error:"invalid_bearer_token"};
}

export function auditActor(req) {
  const actor = req.headers["x-afagh-actor"];
  return typeof actor === "string" && actor.trim() ? actor.trim().slice(0,120) : "authenticated-client";
}
