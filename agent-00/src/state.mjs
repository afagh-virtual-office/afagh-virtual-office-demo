import crypto from "node:crypto";

export function createState({project, teams, gates, tasks, decisions, audit}) {
  return {
    project: structuredClone(project),
    teams: structuredClone(teams),
    gates: structuredClone(gates),
    tasks: structuredClone(tasks),
    decisions: structuredClone(decisions),
    audit: structuredClone(audit),
    deliberations: [],
    evidence: [],
    events: [],
    version: 1
  };
}

export function appendEvent(state, type, actor, payload) {
  const event = {
    id: crypto.randomUUID(),
    seq: state.events.length + 1,
    type, actor,
    payload,
    at: new Date().toISOString()
  };
  state.events.push(event);
  state.version += 1;
  return event;
}

export async function loadState(pool, fallback) {
  if (!pool) return fallback;
  await pool.query(`create table if not exists agent00_state (key text primary key,value jsonb not null,updated_at timestamptz not null default now())`);
  const r = await pool.query("select value from agent00_state where key='orchestrator_state' limit 1");
  if (!r.rowCount) {
    await saveState(pool, fallback);
    return fallback;
  }
  return r.rows[0].value;
}

export async function saveState(pool, state) {
  if (!pool) return;
  await pool.query(
    `insert into agent00_state(key,value,updated_at) values('orchestrator_state',$1,now()) on conflict(key) do update set value=excluded.value,updated_at=now()`,
    [JSON.stringify(state)]
  );
}
