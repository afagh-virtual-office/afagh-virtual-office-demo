const LEVELS = Object.freeze({
  L0: 'OBSERVE_ANALYZE',
  L1: 'RECOMMEND_DRAFT',
  L2: 'LIMITED_EXECUTION',
  L3: 'AUTONOMOUS_WITHIN_POLICY'
});

const STATUS = Object.freeze({ ACTIVE: 'ACTIVE', DISABLED: 'DISABLED' });

const registry = new Map();

export function registerExpert(input) {
  const expert = {
    id: String(input.id),
    name: String(input.name),
    specialty: String(input.specialty),
    domains: [...(input.domains || [])],
    skills: [...(input.skills || [])],
    allowedChannels: [...(input.allowedChannels || [])],
    workspaceScopes: [...(input.workspaceScopes || ['*'])],
    authorityLevel: input.authorityLevel || LEVELS.L1,
    status: input.status || STATUS.ACTIVE,
    knowledgeScope: [...(input.knowledgeScope || [])],
    escalationTargets: [...(input.escalationTargets || [])],
    version: input.version || '1.0.0'
  };
  if (!expert.id || !expert.name || !expert.specialty) throw new Error('INVALID_EXPERT_DEFINITION');
  if (!Object.values(LEVELS).includes(expert.authorityLevel)) throw new Error('INVALID_AUTHORITY_LEVEL');
  registry.set(expert.id, Object.freeze(expert));
  return expert;
}

export function getExpert(id) {
  return registry.get(String(id)) || null;
}

export function listExperts({ status = STATUS.ACTIVE, workspaceId = null } = {}) {
  return [...registry.values()].filter(expert => {
    const statusOk = status ? expert.status === status : true;
    const scopeOk = !workspaceId || expert.workspaceScopes.includes('*') || expert.workspaceScopes.includes(workspaceId);
    return statusOk && scopeOk;
  });
}

export function clearRegistry() {
  registry.clear();
}

export { LEVELS, STATUS };
