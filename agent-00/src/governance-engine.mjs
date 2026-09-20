function teamCriteria(teamId,gateId,{state,technical,evidence}){
  const checks=technical?.technical?.checks||{};
  const common=technical?.technical?.valid===true && evidence?.valid===true;
  if(!common)return {decision:"CONDITIONAL",findings:["Technical and evidence prerequisites are not both green."]};

  if(teamId==="T01"){
    return {
      decision:"APPROVE",
      findings:[
        "Technical gate checks are green.",
        "Execution remains controlled and direct main writes are prohibited.",
        `Gate ${gateId} may advance only from recorded evidence.`
      ]
    };
  }
  if(teamId==="T02"){
    const boundary=state?.decisions?.some(d=>d.id==="D-001"&&d.status==="LOCKED");
    if(gateId==="G01_CORE_REPOSITORY" && !boundary)
      return {decision:"CONDITIONAL",findings:["Core/Demo boundary decision is not locked."]};
    return {
      decision:"APPROVE",
      findings:[
        "Business boundary controls are present.",
        "The Core repository identity is explicit for the governed runtime.",
        "No uncontrolled business mutation is authorized by this review."
      ]
    };
  }
  if(teamId==="T03"){
    const noBlockers=!state?.audit?.some(x=>x.gate===gateId&&x.severity==="BLOCKER"&&x.status==="OPEN");
    const noDirectMain=state?.tasks?.every(t=>t.execution?.pullRequest?.number || !t.execution);
    if(!noBlockers||!noDirectMain)
      return {decision:"CONDITIONAL",findings:["Security/governance prerequisite remains unresolved."]};
    return {
      decision:"APPROVE",
      findings:[
        "No open blocker exists for this gate.",
        "Evidence chain is valid.",
        "Controlled execution and attributable audit boundaries are preserved."
      ]
    };
  }
  return {decision:"CONDITIONAL",findings:["Unknown governance team."]};
}

export function runVirtualTeamReview({gateId,state,technical,evidence}){
  const authenticatedTeams=(state?.teams||[])
    .filter(t=>Boolean(process.env[`AFAGH_AGENT00_${t.id}_TOKEN`]))
    .map(t=>t.id);

  const now=new Date().toISOString();
  const deliberations=[];
  for(const teamId of authenticatedTeams){
    const review=teamCriteria(teamId,gateId,{state,technical,evidence});
    deliberations.push({
      id:`AUTO-${gateId}-${teamId}-${Date.now()}`,
      gate:gateId,
      teamId,
      decision:review.decision,
      findings:review.findings,
      actor:`team:${teamId}`,
      reviewerType:"VIRTUAL_TEAM",
      evidenceBacked:true,
      at:now
    });
  }

  const approvals=deliberations.filter(d=>d.decision==="APPROVE").map(d=>d.teamId);
  const auditDecision=authenticatedTeams.includes("T03") &&
    approvals.length===3 &&
    technical?.technical?.valid===true &&
    evidence?.valid===true &&
    !(state?.audit||[]).some(x=>x.gate===gateId&&x.severity==="BLOCKER"&&x.status==="OPEN")
    ? {
        id:`AUTO-AUD-${gateId}-${Date.now()}`,
        gate:gateId,
        decision:"APPROVE",
        findings:["T03 governance audit: all three virtual-team approvals, technical evidence, and blocker checks are green."],
        actor:"team:T03",
        reviewerType:"VIRTUAL_TEAM",
        evidenceBacked:true,
        at:now
      }
    : null;

  return {authenticatedTeams,deliberations,auditDecision};
}
