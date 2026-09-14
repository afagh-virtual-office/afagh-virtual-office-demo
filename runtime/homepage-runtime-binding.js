(() => {
  const RUNTIME = 'https://afagh-communication-os-runtime.onrender.com/api/v1/communication/health';
  const apply = (state, detail) => {
    document.querySelectorAll('.runtime').forEach((el) => {
      const label = state === 'CONTROLLED' ? 'Runtime CONTROLLED' : 'Runtime NOT CONNECTED';
      el.innerHTML = `◉ <b>${label}</b>`;
      el.dataset.runtimeState = state;
      el.title = detail || '';
    });
    document.querySelectorAll('.side-status strong').forEach((el) => {
      el.textContent = state === 'CONTROLLED' ? '● Runtime CONTROLLED' : '● Runtime BLOCKED';
    });
  };

  fetch(RUNTIME, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error(`runtime_http_${r.status}`);
      return r.json();
    })
    .then((x) => {
      if (x?.status !== 'CONTROLLED' || x?.production_verified !== false) {
        throw new Error('unexpected_runtime_state');
      }
      apply('CONTROLLED', `Build ${x.build}; persistence ${x.persistence}; authentication ${x.authentication}; production verification pending.`);
    })
    .catch((e) => apply('BLOCKED', e.message));
})();
