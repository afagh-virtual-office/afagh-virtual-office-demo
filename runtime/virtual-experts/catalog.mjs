import { registerExpert, LEVELS } from './registry.mjs';

export function loadBaselineExperts() {
  const common = {
    workspaceScopes: ['*'],
    allowedChannels: ['whatsapp', 'telegram', 'instagram', 'bale', 'shad', 'rubika'],
    status: 'ACTIVE',
    authorityLevel: LEVELS.L2,
    version: '1.0.1'
  };

  [
    {
      id: 've.trade.iran-china',
      name: 'Trade Intelligence Expert',
      specialty: 'Iran-China trade intelligence',
      domains: ['trade', 'import', 'export', 'market-intelligence'],
      skills: ['trade-intelligence', 'market-analysis', 'supplier-buyer-matching']
    },
    {
      id: 've.sourcing.china',
      name: 'China Sourcing Expert',
      specialty: 'China sourcing and supplier evaluation',
      domains: ['sourcing', 'procurement', 'china'],
      skills: ['supplier-discovery', 'supplier-evaluation', 'rfq-draft']
    },
    {
      id: 've.sales.iran',
      name: 'Iran Sales Expert',
      specialty: 'Iran sales and customer engagement',
      domains: ['sales', 'customer-engagement', 'iran'],
      skills: ['lead-qualification', 'sales-response', 'follow-up-draft']
    },
    {
      id: 've.customer.success',
      name: 'Customer Success Expert',
      specialty: 'Customer support and retention',
      domains: ['customer-success', 'support', 'retention'],
      skills: ['issue-triage', 'faq-response', 'escalation']
    },
    {
      id: 've.logistics.crossborder',
      name: 'Cross-Border Logistics Expert',
      specialty: 'International logistics coordination',
      domains: ['logistics', 'shipping', 'customs'],
      skills: ['route-analysis', 'shipment-status', 'logistics-escalation']
    },
    {
      id: 've.finance.trade',
      name: 'Trade Finance Expert',
      specialty: 'Trade finance and commercial risk analysis',
      domains: ['finance', 'trade-finance', 'risk'],
      skills: ['commercial-risk', 'payment-analysis', 'financing-draft']
    },
    {
      id: 've.communication.ops',
      name: 'Communication Operations Expert',
      specialty: 'Omnichannel communication operations',
      domains: ['communication', 'routing', 'messaging'],
      skills: ['channel-routing', 'message-orchestration', 'delivery-analysis']
    },
    {
      id: 've.compliance.governance',
      name: 'Compliance & Governance Expert',
      specialty: 'Policy, authorization and compliance review',
      domains: ['governance', 'compliance', 'policy'],
      skills: ['policy-review', 'authorization-review', 'risk-escalation']
    }
  ].forEach(def => registerExpert({ ...common, ...def }));

  return true;
}
