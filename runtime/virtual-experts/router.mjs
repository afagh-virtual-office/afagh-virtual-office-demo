import { listExperts } from './registry.mjs';

function score(expert, request) {
  let value = 0;
  if (request.expertId && expert.id === request.expertId) value += 100;
  if (request.domain && expert.domains.includes(request.domain)) value += 40;
  for (const skill of request.skills || []) if (expert.skills.includes(skill)) value += 15;
  if (request.channel && expert.allowedChannels.includes(request.channel)) value += 20;
  return value;
}

export function routeExpert(request = {}) {
  const candidates = listExperts({ workspaceId: request.workspaceId });
  const ranked = candidates
    .map(expert => ({ expert, score: score(expert, request) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return { ok: false, state: 'BLOCKED', reason: 'NO_ELIGIBLE_VIRTUAL_EXPERT' };
  }

  if (request.expertId && ranked[0].expert.id !== request.expertId) {
    return { ok: false, state: 'BLOCKED', reason: 'REQUESTED_EXPERT_UNAVAILABLE' };
  }

  return {
    ok: true,
    state: 'ROUTED',
    expert: ranked[0].expert,
    score: ranked[0].score,
    candidates: ranked.map(x => ({ id: x.expert.id, score: x.score }))
  };
}
