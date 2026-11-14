/**
 * Shared spring physics engine adapted from DesignBookmark Motion Studies.
 * Upgraded for zero-lag performance: components may declare an active() predicate
 * so hidden views skip physics substeps and DOM mutations completely.
 */
window.Motion = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = (x, k = 400, c = 30) => ({ x, v: 0, t: x, k, c: reduce ? 2 * Math.sqrt(k) : c });
  const tune = (s, k, c) => {
    s.k = k;
    s.c = reduce ? 2 * Math.sqrt(k) : c;
  };
  const step = (s, dt) => {
    if (Math.abs(s.x - s.t) < 1e-4 && Math.abs(s.v) < 1e-3) {
      s.x = s.t;
      s.v = 0;
      return;
    }
    const a = -s.k * (s.x - s.t) - s.c * s.v;
    s.v += a * dt;
    s.x += s.v * dt;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const token = (name, fallback = '') =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const num = (name, fallback) => parseFloat(token(name, String(fallback))) || fallback;
  const spring = (name, fallback) =>
    token(name, fallback)
      .split(/\s+/)
      .map(Number);

  let timeScale = 1;
  const timers = [];
  const after = (sec, fn) => {
    const t = { t: sec, fn };
    timers.push(t);
    return t;
  };
  const cancel = t => {
    const i = timers.indexOf(t);
    if (i > -1) timers.splice(i, 1);
  };

  const comps = [];
  let last = performance.now();
  let rafId = 0;

  function loop(now) {
    rafId = 0;
    if (document.hidden) return;
    const dt = Math.min((now - last) / 1000, 1 / 30) * timeScale;
    last = now;
    for (let i = timers.length - 1; i >= 0; i--) {
      if ((timers[i].t -= dt) <= 0) {
        const cb = timers.splice(i, 1)[0].fn;
        cb();
      }
    }

    const live = [];
    for (let i = 0; i < comps.length; i++) {
      const c = comps[i];
      if (!c.active || c.active()) live.push(c);
    }

    const sub = 4;
    const subDt = dt / sub;
    for (let k = 0; k < sub; k++) {
      for (let i = 0; i < live.length; i++) live[i].frame(subDt);
    }
    for (let i = 0; i < live.length; i++) live[i].render();
    rafId = requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !rafId) {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  });

  rafId = requestAnimationFrame(loop);

  return {
    S,
    tune,
    step,
    clamp,
    token,
    num,
    spring,
    after,
    cancel,
    register: c => comps.push(c),
    get timeScale() {
      return timeScale;
    },
    setSlow(on) {
      timeScale = on ? 0.25 : 1;
    },
    svg: (p, sw = 1.8) =>
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`,
  };
})();
