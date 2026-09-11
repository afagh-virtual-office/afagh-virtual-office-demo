import fs from 'node:fs';

const cases=process.argv.slice(2);
if(!cases.length){ console.error('Usage: node runtime/p0-1/verifier.mjs <evidence.json> [...]'); process.exit(2); }

const required=['schema_version','request','identity','session','context','authorization','audit','evidence'];
const failures=[];
for(const file of cases){
  const x=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const k of required) if(!(k in x)) failures.push(`${file}: missing ${k}`);
  if(x.schema_version!=='p0-1.auth-evidence.v1') failures.push(`${file}: schema_version`);
  if(!x.request?.request_id || !x.request?.resource || !x.request?.action) failures.push(`${file}: request trace incomplete`);
  if(!x.context?.tenant_id || !x.context?.workspace_id) failures.push(`${file}: context incomplete`);
  if(!x.authorization?.decision_id) failures.push(`${file}: decision id missing`);
  if(!x.audit?.event_id || !x.audit?.actor_subject_id) failures.push(`${file}: audit identity incomplete`);
  if(!x.evidence?.evidence_id || !x.evidence?.source || !['VERIFIED','UNVERIFIED'].includes(x.evidence?.integrity)) failures.push(`${file}: evidence incomplete`);
  if(x.authorization?.decision==='ALLOW' && x.session?.status!=='VALID') failures.push(`${file}: ALLOW with non-valid session`);
  if(x.authorization?.decision==='ALLOW' && x.audit?.outcome!=='SUCCESS') failures.push(`${file}: ALLOW without SUCCESS audit`);
  if(x.authorization?.decision==='DENY' && x.audit?.outcome!=='DENIED') failures.push(`${file}: DENY without DENIED audit`);
  if(x.evidence?.integrity==='VERIFIED' && x.evidence?.source!=='afagh-runtime/p0-1') failures.push(`${file}: unexpected verified evidence source`);
}
if(failures.length){ console.error('P0-1 VERIFIER: FAIL'); failures.forEach(x=>console.error(`- ${x}`)); process.exit(1); }
console.log(`P0-1 VERIFIER: PASS (${cases.length} evidence packages)`);
