const DEFAULT_INTERVAL_MS = Number(process.env.AFAGH_AGENT00_LOOP_INTERVAL_MS || 60000);

export function startAutonomousWorkLoop(runCycle, {
  intervalMs = DEFAULT_INTERVAL_MS,
  logger = console,
  runImmediately = true,
} = {}) {
  let running = false;
  let timer = null;
  const status = {
    enabled: true,
    running: false,
    intervalMs,
    cyclesStarted: 0,
    cyclesCompleted: 0,
    cyclesFailed: 0,
    lastStartedAt: null,
    lastCompletedAt: null,
    lastFailedAt: null,
    lastError: null,
    mode: "AUTONOMOUS_CONTROLLED_LOOP",
    safety: "GATE_BOUND_NO_BYPASS",
  };

  const tick = async (source = "autonomous-loop") => {
    if (running) {
      logger.warn?.("autonomous_loop_skip_overlap");
      return { skipped: true, reason: "cycle_already_running" };
    }

    running = true;
    status.running = true;
    status.cyclesStarted += 1;
    status.lastStartedAt = new Date().toISOString();
    status.lastError = null;

    try {
      const result = await runCycle(source);
      status.cyclesCompleted += 1;
      status.lastCompletedAt = new Date().toISOString();
      return result;
    } catch (error) {
      status.cyclesFailed += 1;
      status.lastFailedAt = new Date().toISOString();
      status.lastError = error?.message || String(error);
      logger.error?.("autonomous_loop_cycle_failed", status.lastError);
      return { failed: true, error: status.lastError };
    } finally {
      running = false;
      status.running = false;
    }
  };

  const start = () => {
    if (timer) return status;
    timer = setInterval(() => {
      void tick();
    }, Math.max(5000, intervalMs));
    timer.unref?.();
    if (runImmediately) void tick("autonomous-loop-start");
    logger.log?.(`AFAGH Autonomous Work Loop active every ${Math.max(5000, intervalMs)}ms`);
    return status;
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    status.enabled = false;
    return status;
  };

  return { start, stop, tick, status };
}
