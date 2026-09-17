const ORDER = Object.freeze({
  OBSERVE_ANALYZE: 0,
  RECOMMEND_DRAFT: 1,
  LIMITED_EXECUTION: 2,
  AUTONOMOUS_WITHIN_POLICY: 3
});

export function evaluateExpertPolicy({ expert, requestedLevel, channel, actionRisk, commercialActivationAuthorized = false } = {}) {
  if (!expert) return { decision: 'DENY', reason: 'EXPERT_REQUIRED' };
  if (expert.status !== 'ACTIVE') return { decision: 'DENY', reason: 'EXPERT_NOT_ACTIVE' };
  if (channel && !expert.allowedChannels.includes(channel)) return { decision: 'DENY', reason: 'CHANNEL_OUT_OF_SCOPE' };

  const level = requestedLevel || expert.authorityLevel;
  if (!(level in ORDER)) return { decision: 'DENY', reason: 'INVALID_AUTHORITY_LEVEL' };
  if (ORDER[level] > ORDER[expert.authorityLevel]) return { decision: 'DENY', reason: 'REQUESTED_LEVEL_EXCEEDS_EXPERT_AUTHORITY' };
  if (level === 'AUTONOMOUS_WITHIN_POLICY' && !commercialActivationAuthorized) {
    return { decision: 'DENY', reason: 'COMMERCIAL_ACTIVATION_REQUIRED' };
  }
  if (level === 'RECOMMEND_DRAFT' && actionRisk && actionRisk !== 'NONE') {
    return { decision: 'DENY', reason: 'DRAFT_MODE_SIDE_EFFECT_RISK' };
  }
  if (level === 'OBSERVE_ANALYZE' && actionRisk && actionRisk !== 'NONE') {
    return { decision: 'DENY', reason: 'OBSERVE_MODE_SIDE_EFFECT_RISK' };
  }

  return {
    decision: 'ALLOW',
    authorityLevel: level,
    commercialActivationRequired: level === 'AUTONOMOUS_WITHIN_POLICY'
  };
}
