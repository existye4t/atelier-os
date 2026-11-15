/**
 * Demand-driven shared spring physics engine for Atelier OS.
 * Runs at display refresh rate while any spring, timer, or active animation is running,
 * and sleeps completely (0 requestAnimationFrame callbacks, ~0% CPU) once settled.
 */
window.Motion = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const activeSprings = new Set();
  const comps = [];
  const timers = [];
  let timeScale = 1;
  let last = performance.now();
  let rafId = 0;
  let inLoop = false;

  function wake() {
    if (rafId || inLoop || document.hidden) return;
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  const S = (x, k = 400, c = 30) => {
    let _x = x;
    let _v = 0;
    let _t = x;
    const damp = reduce ? 2 * Math.sqrt(k) : c;
    const spring = { k, c: damp };

    Object.defineProperties(spring, {
      x: {
        enumerable: true,
        get() { return _x; },
        set(val) {
          _x = val;
          if (Math.abs(_x - _t) > 1e-4 || Math.abs(_v) > 1e-3) {
            activeSprings.add(spring);
            wake();
          }
        },
      },
      v: {
        enumerable: true,
        get() { return _v; },
        set(val) {
          _v = val;
          if (Math.abs(_v) > 1e-3) {
            activeSprings.add(spring);
            wake();
          }
        },
      },
      t: {
        enumerable: true,
        get() { return _t; },
        set(val) {
          if (val === _t) return;
          _t = val;
          if (Math.abs(_x - _t) > 1e-4 || Math.abs(_v) > 1e-3) {
            activeSprings.add(spring);
            wake();
          }
        },
      },
    });
    return spring;
  };

  const tune = (s, k, c) => {
    s.k = k;
    s.c = reduce ? 2 * Math.sqrt(k) : c;
  };

  const step = (s, dt) => {
    if (Math.abs(s.x - s.t) < 1e-4 && Math.abs(s.v) < 1e-3) {
      if (s.x !== s.t) s.x = s.t;
      if (s.v !== 0) s.v = 0;
      activeSprings.delete(s);
      return;
    }
    const a = -s.k * (s.x - s.t) - s.c * s.v;
    s.v = s.v + a * dt;
    s.x = s.x + s.v * dt;
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const token = (name, fallback = '') =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const num = (name, fallback) => parseFloat(token(name, String(fallback))) || fallback;
  const spring = (name, fallback) =>
    token(name, fallback)
      .split(/\s+/)
      .map(Number);

  const after = (sec, fn) => {
    const t = { t: sec, fn };
    timers.push(t);
    wake();
    return t;
  };
  const cancel = t => {
    const i = timers.indexOf(t);
    if (i > -1) timers.splice(i, 1);
  };

  function loop(now) {
    rafId = 0;
    if (document.hidden) return;
    inLoop = true;
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

    const anyRunning = live.some(c => c.running && c.running());
    inLoop = false;
    if (timers.length > 0 || activeSprings.size > 0 || anyRunning) {
      rafId = requestAnimationFrame(loop);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && (timers.length > 0 || activeSprings.size > 0 || comps.some(c => (!c.active || c.active()) && c.running && c.running()))) {
      wake();
    }
  });

  wake();

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
    wake,
    register: c => {
      comps.push(c);
      wake();
    },
    get timeScale() {
      return timeScale;
    },
    setSlow(on) {
      timeScale = on ? 0.25 : 1;
      wake();
    },
    get stats() {
      return { running: Boolean(rafId), springs: activeSprings.size, timers: timers.length };
    },
    svg: (p, sw = 1.8) =>
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`,
  };
})();
