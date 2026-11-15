/**
 * Atelier OS Global Shell:
 * - Verlet Pull Cord (theme light/dark toggle + bulb radial flood)
 * - Volume-preserving Morph Island (Pomodoro, Audio, AI & Toast status)
 * - Dual-edge Rubber Dock with clipPath icon inversion
 * - Springy Command Palette (Cmd/Ctrl+K)
 * - Liquid Goo Menu FAB + Timed Undo Toast
 */
import { store } from './store.js';
import { sound, TRACKS } from './audio.js';

const { S, step, clamp, after, cancel, register, svg } = window.Motion;

const DOCK_TABS = [
  {
    id: 'studio',
    label: 'Odak Stüdyosu',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  },
  {
    id: 'ai',
    label: 'AI Kokpit',
    icon: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/>',
  },
  {
    id: 'portfolio',
    label: 'Portfolyo & Dergi',
    icon: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  },
  {
    id: 'vault',
    label: 'Fikir Kasası',
    icon: '<rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  },
];

function initPullCord() {
  const host = document.getElementById('pull-cord-wrap');
  const flood = document.getElementById('theme-flood');
  if (!host) return;

  host.innerHTML = `
    <svg class="cord-svg" viewBox="0 0 88 150" aria-hidden="true">
      <circle class="cord-cap" cx="44" cy="4" r="4"/>
      <path class="cord-path" d=""/>
      <circle class="cord-knob" cx="44" cy="64" r="9"/>
    </svg>
    <button class="cord-grab" type="button" role="switch" aria-checked="${store.state.theme === 'light'}" title="Tema ipini aşağı çek (Koyu / Aydınlık)">
      <span class="sr-only">Tema Işığını Değiştir</span>
    </button>
  `;

  const path = host.querySelector('.cord-path');
  const knob = host.querySelector('.cord-knob');
  const grab = host.querySelector('.cord-grab');

  const ax = 44;
  const ay = 4;
  const L = 58;
  const MAXS = 54;
  const CLICK = 24;
  const N = 8;

  const pts = Array.from({ length: N }, (_, i) => [ax, ay + (i / (N - 1)) * L, ax, ay + (i / (N - 1)) * L]);
  let dragging = false;
  let armed = false;
  let cordActive = false;
  let targetX = ax;
  let targetY = ay + L;
  let floodTimer = null;

  function triggerThemeFlip() {
    const next = store.state.theme === 'dark' ? 'light' : 'dark';
    sound.tickSound(1.3);
    sound.chime(next === 'light' ? 659.25 : 440);
    if (flood) {
      flood.classList.remove('active');
      flood.dataset.mode = next;
      void flood.offsetWidth;
      flood.classList.add('active');
      clearTimeout(floodTimer);
      floodTimer = setTimeout(() => flood.classList.remove('active'), 650);
    }
    store.setTheme(next);
    grab.setAttribute('aria-checked', String(next === 'light'));
  }

  grab.addEventListener('pointerdown', e => {
    dragging = true;
    armed = true;
    cordActive = true;
    window.Motion?.wake?.();
    grab.setPointerCapture(e.pointerId);
    const rect = host.getBoundingClientRect();
    targetX = clamp(e.clientX - rect.left, 8, 80);
    targetY = clamp(e.clientY - rect.top, 20, 142);
  });

  grab.addEventListener('pointermove', e => {
    if (!dragging) return;
    const rect = host.getBoundingClientRect();
    const px = clamp(e.clientX - rect.left, 8, 80);
    const py = clamp(e.clientY - rect.top, 20, 142);
    const dx = px - ax;
    const dy = py - ay;
    const d = Math.hypot(dx, dy) || 1;
    const over = Math.max(0, d - L);
    const give = MAXS * (1 - Math.exp(-over / 70));
    const r = Math.min(d, L) + give;
    targetX = ax + (dx / d) * r;
    targetY = ay + (dy / d) * r;
    if (armed && give > CLICK) {
      armed = false;
      triggerThemeFlip();
    }
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    armed = false;
  };
  grab.addEventListener('pointerup', release);
  grab.addEventListener('pointercancel', release);

  grab.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pts[N - 1][1] += 28;
      cordActive = true;
      window.Motion?.wake?.();
      triggerThemeFlip();
    }
  });

  let lastCordSig = '';
  register({
    running: () => dragging || cordActive,
    frame(dt) {
      if (!dragging) {
        let energy = 0;
        for (let i = 1; i < N; i++) {
          energy += Math.abs(pts[i][0] - pts[i][2]) + Math.abs(pts[i][1] - pts[i][3]);
        }
        if (energy < 0.015 && Math.abs(pts[N - 1][0] - ax) < 0.25 && Math.abs(pts[N - 1][1] - (ay + L)) < 0.25) {
          for (let i = 0; i < N; i++) {
            const ry = ay + (i / (N - 1)) * L;
            pts[i][0] = ax;
            pts[i][1] = ry;
            pts[i][2] = ax;
            pts[i][3] = ry;
          }
          cordActive = false;
          return;
        }
      }
      const damping = 0.94;
      const g = 1100 * dt * dt;
      for (let i = 1; i < N; i++) {
        const p = pts[i];
        const vx = (p[0] - p[2]) * damping;
        const vy = (p[1] - p[3]) * damping;
        p[2] = p[0];
        p[3] = p[1];
        p[0] += vx;
        p[1] += vy + g;
      }
      const seg = L / (N - 1);
      for (let iter = 0; iter < 6; iter++) {
        pts[0][0] = ax;
        pts[0][1] = ay;
        if (dragging) {
          pts[N - 1][0] = targetX;
          pts[N - 1][1] = targetY;
        }
        for (let i = 0; i < N - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const dist = Math.hypot(dx, dy) || 1;
          const diff = (dist - seg) / dist;
          if (i === 0) {
            b[0] -= dx * diff;
            b[1] -= dy * diff;
          } else if (dragging && i + 1 === N - 1) {
            a[0] += dx * diff;
            a[1] += dy * diff;
          } else {
            a[0] += dx * diff * 0.5;
            a[1] += dy * diff * 0.5;
            b[0] -= dx * diff * 0.5;
            b[1] -= dy * diff * 0.5;
          }
        }
      }
    },
    render() {
      const end = pts[N - 1];
      const sig = `${pts[2][0].toFixed(1)},${end[0].toFixed(1)},${end[1].toFixed(1)}`;
      if (sig === lastCordSig) return;
      lastCordSig = sig;
      let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < N - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
      }
      d += ` L${end[0].toFixed(1)},${end[1].toFixed(1)}`;
      path.setAttribute('d', d);
      knob.setAttribute('cx', end[0].toFixed(1));
      knob.setAttribute('cy', end[1].toFixed(1));
      grab.style.transform = `translate(${(end[0] - 22).toFixed(1)}px, ${(end[1] - 22).toFixed(1)}px)`;
    },
  });
}

function initMorphIsland() {
  const island = document.getElementById('morph-island');
  if (!island) return;

  island.innerHTML = `
    <div class="island-compact" id="island-compact">
      <span class="island-dot" id="island-dot"></span>
      <span class="island-label" id="island-label">Atelier Hazır</span>
      <span class="island-meta" id="island-meta">25:00</span>
    </div>
    <div class="island-expanded" id="island-expanded">
      <div class="island-exp-row">
        <svg class="island-ring" viewBox="0 0 36 36">
          <circle class="ring-bg" cx="18" cy="18" r="14"/>
          <circle class="ring-fg" id="island-ring-fg" cx="18" cy="18" r="14"/>
        </svg>
        <div class="island-exp-info">
          <strong id="island-exp-title">Derin Odak Oturumu</strong>
          <span id="island-exp-sub">Pomodoro · Kalan süre</span>
        </div>
        <button class="island-btn" id="island-pomo-btn" type="button">Başlat</button>
      </div>
    </div>
  `;

  const compactLabel = island.querySelector('#island-label');
  const compactMeta = island.querySelector('#island-meta');
  const dot = island.querySelector('#island-dot');
  const ringFg = island.querySelector('#island-ring-fg');
  const expTitle = island.querySelector('#island-exp-title');
  const expSub = island.querySelector('#island-exp-sub');
  const pomoBtn = island.querySelector('#island-pomo-btn');

  let expanded = false;
  let toastTimeout = null;
  let activeMode = 'idle';

  const W = S(236, 380, 24);
  const H = S(38, 300, 22);
  const press = S(1, 520, 24);

  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function refreshMetrics() {
    const p = store.state.pomodoro;
    const progress = 1 - p.secondsLeft / p.duration;
    ringFg.style.strokeDashoffset = (87.96 * (1 - clamp(progress, 0, 1))).toFixed(2);
    pomoBtn.textContent = p.running ? 'Duraklat' : 'Başlat';

    if (activeMode === 'toast') return;

    if (activeMode === 'ai') {
      dot.dataset.state = 'ai';
      compactLabel.textContent = 'AI Ajan Çalışıyor';
      compactMeta.textContent = 'Akış';
      W.t = expanded ? 336 : 244;
      return;
    }

    if (p.running) {
      dot.dataset.state = 'focus';
      compactLabel.textContent = 'Odak Sayacı';
      compactMeta.textContent = fmt(p.secondsLeft);
      expTitle.textContent = `Odak Oturumu · #${p.completedSessions + 1}`;
      expSub.textContent = `${fmt(p.secondsLeft)} kaldı · Ses ${sound.playing ? 'Açık' : 'Kapalı'}`;
      W.t = expanded ? 344 : 230;
    } else if (sound.playing) {
      const tr = TRACKS[sound.trackIdx];
      dot.dataset.state = 'music';
      compactLabel.textContent = tr.title;
      compactMeta.textContent = tr.bpm;
      expTitle.textContent = tr.title;
      expSub.textContent = `${tr.artist} · Odak ${fmt(p.secondsLeft)}`;
      W.t = expanded ? 344 : 264;
    } else {
      dot.dataset.state = 'idle';
      compactLabel.textContent = 'Atelier OS';
      compactMeta.textContent = fmt(p.secondsLeft);
      expTitle.textContent = 'Derin Odak Sayacı';
      expSub.textContent = `Tamamlanan: ${p.completedSessions} oturum`;
      W.t = expanded ? 336 : 210;
    }
    H.t = expanded ? 78 : 38;
  }

  function showToast(title, detail, kind = 'save') {
    activeMode = 'toast';
    dot.dataset.state = kind;
    compactLabel.textContent = title;
    compactMeta.textContent = detail;
    W.t = Math.min(350, Math.max(230, (title.length + detail.length) * 8 + 70));
    H.t = 40;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      activeMode = 'idle';
      refreshMetrics();
    }, 2600);
  }

  island.addEventListener('click', e => {
    if (e.target === pomoBtn) return;
    expanded = !expanded;
    press.v = -1.8;
    island.classList.toggle('is-expanded', expanded);
    refreshMetrics();
  });

  pomoBtn.addEventListener('click', e => {
    e.stopPropagation();
    store.emit('pomodoro-toggle');
  });

  store.on('pomodoro', refreshMetrics);
  store.on('audio', refreshMetrics);
  store.on('ai-state', payload => {
    activeMode = payload === 'thinking' ? 'ai' : 'idle';
    refreshMetrics();
  });
  store.on('toast', payload => {
    if (payload) showToast(payload.title, payload.detail, payload.kind);
  });

  refreshMetrics();

  let lastIslandSig = '';
  register({
    frame(dt) {
      step(W, dt);
      step(H, dt);
      step(press, dt);
    },
    render() {
      const h = Math.max(H.x, 28);
      const give = clamp(-H.v / 7000, -0.05, 0.05);
      const wVal = (W.x * (1 + give)).toFixed(1);
      const hVal = h.toFixed(1);
      const scVal = clamp(press.x, 0.9, 1.06).toFixed(4);
      const sig = `${wVal}|${hVal}|${scVal}`;
      if (sig === lastIslandSig) return;
      lastIslandSig = sig;
      island.style.width = `${wVal}px`;
      island.style.height = `${hVal}px`;
      island.style.borderRadius = `${Math.min(h / 2, 30).toFixed(1)}px`;
      island.style.transform = `translateX(-50%) scale(${scVal})`;
    },
  });
}

function initRubberDock() {
  const dock = document.getElementById('rubber-dock');
  if (!dock) return;

  const btnsHtml = DOCK_TABS.map(
    (tab, idx) => `
      <button class="dock-btn" data-view="${tab.id}" data-idx="${idx}" type="button" title="${tab.label}">
        ${svg(tab.icon)}
        <span>${tab.label}</span>
      </button>
    `
  ).join('');

  dock.innerHTML = `
    <div class="dock-track" id="dock-track">
      <div class="dock-ind" id="dock-ind"></div>
      <div class="dock-base">${btnsHtml}</div>
      <div class="dock-top" id="dock-top" aria-hidden="true">${btnsHtml}</div>
    </div>
    <button class="dock-cmd-btn" id="dock-cmd-btn" type="button" title="Komut Paleti (Ctrl+K)">
      ${svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')}
      <kbd>⌘K</kbd>
    </button>
  `;

  const track = dock.querySelector('#dock-track');
  const ind = dock.querySelector('#dock-ind');
  const topLayer = dock.querySelector('#dock-top');
  const baseBtns = [...dock.querySelectorAll('.dock-base .dock-btn')];
  const cmdBtn = dock.querySelector('#dock-cmd-btn');

  let activeIdx = Math.max(0, DOCK_TABS.findIndex(t => t.id === store.state.activeView));
  let tabW = 132;
  const tabH = 44;

  const L = S(activeIdx * tabW, 640, 38);
  const R = S((activeIdx + 1) * tabW, 150, 16);

  function measure() {
    if (!baseBtns[0]) return;
    const rect = baseBtns[0].getBoundingClientRect();
    if (rect.width > 20) tabW = rect.width;
  }

  function setTarget(idx, snap = false) {
    measure();
    const prevIdx = activeIdx;
    activeIdx = clamp(idx, 0, DOCK_TABS.length - 1);
    const lTarget = activeIdx * tabW;
    const rTarget = (activeIdx + 1) * tabW;

    if (snap) {
      L.x = L.t = lTarget;
      R.x = R.t = rTarget;
    } else {
      const movingRight = activeIdx >= prevIdx;
      L.k = movingRight ? 150 : 640;
      L.c = movingRight ? 16 : 38;
      R.k = movingRight ? 640 : 150;
      R.c = movingRight ? 38 : 16;
      L.t = lTarget;
      R.t = rTarget;
    }
    baseBtns.forEach((b, i) => b.classList.toggle('active', i === activeIdx));
  }

  baseBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      sound.tickSound(0.75);
      setTarget(idx);
      store.setView(DOCK_TABS[idx].id);
    });
  });

  cmdBtn.addEventListener('click', () => store.emit('cmd-open'));

  store.on('view', viewId => {
    const idx = DOCK_TABS.findIndex(t => t.id === viewId);
    if (idx !== -1) setTarget(idx);
  });

  window.addEventListener('resize', () => setTarget(activeIdx, true));
  requestAnimationFrame(() => setTarget(activeIdx, true));

  let lastDockSig = '';
  register({
    frame(dt) {
      step(L, dt);
      step(R, dt);
    },
    render() {
      const sig = `${L.x.toFixed(2)}|${R.x.toFixed(2)}|${tabW}`;
      if (sig === lastDockSig) return;
      lastDockSig = sig;
      const TW = track.offsetWidth || tabW * DOCK_TABS.length;
      let l = L.x;
      let r = R.x;
      if (r < l) [l, r] = [r, l];
      const iw = Math.max(r - l, 28);
      const ih = tabH * clamp(1 / Math.sqrt(iw / Math.max(tabW, 40)), 0.72, 1.06);
      const top = (tabH - ih) / 2;
      ind.style.width = `${iw.toFixed(2)}px`;
      ind.style.height = `${ih.toFixed(2)}px`;
      ind.style.borderRadius = `${(ih / 2).toFixed(2)}px`;
      ind.style.transform = `translate3d(${l.toFixed(2)}px, ${top.toFixed(2)}px, 0)`;
      topLayer.style.clipPath = `inset(${top.toFixed(1)}px ${Math.max(0, TW - r).toFixed(1)}px ${top.toFixed(1)}px ${Math.max(0, l).toFixed(1)}px round ${(ih / 2).toFixed(1)}px)`;
    },
  });
}

function initCommandPalette() {
  const backdrop = document.getElementById('cmd-backdrop');
  const pal = document.getElementById('cmd-palette');
  if (!backdrop || !pal) return;

  pal.innerHTML = `
    <div class="cmd-q">
      ${svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')}
      <input id="cmd-input" type="text" placeholder="Bir komut, sayfa veya araç ara..." autocomplete="off" spellcheck="false" />
      <kbd>ESC</kbd>
    </div>
    <ul class="cmd-list" id="cmd-list">
      <span class="cmd-hl" id="cmd-hl"></span>
    </ul>
  `;

  const input = pal.querySelector('#cmd-input');
  const list = pal.querySelector('#cmd-list');
  const hl = pal.querySelector('#cmd-hl');

  const commands = [
    { name: 'Odak Stüdyosu sayfasına git', hint: 'Sayfa 1', run: () => store.setView('studio') },
    { name: 'AI Kokpit sayfasına git', hint: 'Sayfa 2', run: () => store.setView('ai') },
    { name: 'Portfolyo & 3D Dergi sayfasına git', hint: 'Sayfa 3', run: () => store.setView('portfolio') },
    { name: 'Fikir Kasası sayfasına git', hint: 'Sayfa 4', run: () => store.setView('vault') },
    { name: 'Ortam Sesini Aç / Kapat', hint: 'Ses Motoru', run: () => store.emit('audio-toggle') },
    { name: 'Pomodoro Sayacını Başlat / Duraklat', hint: '25:00', run: () => store.emit('pomodoro-toggle') },
    { name: 'Tema Işığını Değiştir (Koyu / Aydınlık)', hint: 'Pull Cord', run: () => store.setTheme(store.state.theme === 'dark' ? 'light' : 'dark') },
    { name: 'Hızlı Not: Kasaya Fikir Kartı Ekle', hint: 'Kasa', run: () => { store.setView('vault'); store.emit('vault-quick-add'); } },
    { name: 'AI Ajanına Odak Modu Kurdur', hint: 'AI Akış', run: () => { store.setView('ai'); store.emit('ai-preset', 'focus'); } },
  ];

  const O = S(0, 320, 28);
  const HY = S(0, 420, 30);
  let open = false;
  let selectedIdx = 0;

  const rows = commands.map((cmd, idx) => {
    const li = document.createElement('li');
    li.className = 'cmd-row';
    li.innerHTML = `<span>${cmd.name}</span><small>${cmd.hint}</small>`;
    const row = { cmd, li, y: S(idx * 40, 300, 26), o: S(1, 300, 28), shown: true, idx };
    li.addEventListener('mouseenter', () => {
      if (row.shown) {
        selectedIdx = row.idx;
        HY.t = selectedIdx * 40;
      }
    });
    li.addEventListener('click', () => {
      closePalette();
      cmd.run();
    });
    list.appendChild(li);
    return row;
  });

  function filterRows() {
    const q = input.value.trim().toLowerCase();
    let k = 0;
    rows.forEach(r => {
      r.shown = !q || r.cmd.name.toLowerCase().includes(q) || r.cmd.hint.toLowerCase().includes(q);
      if (r.shown) {
        r.y.t = k * 40;
        r.idx = k++;
      } else {
        r.idx = -1;
      }
      r.o.t = r.shown ? 1 : 0;
      r.li.style.pointerEvents = r.shown ? 'auto' : 'none';
    });
    selectedIdx = k > 0 ? clamp(selectedIdx, 0, k - 1) : -1;
    HY.t = Math.max(0, selectedIdx) * 40;
    list.style.height = `${Math.max(40, Math.min(k, 7) * 40)}px`;
  }

  function openPalette() {
    open = true;
    backdrop.classList.add('open');
    O.t = 1;
    input.value = '';
    selectedIdx = 0;
    filterRows();
    requestAnimationFrame(() => input.focus());
  }

  function closePalette() {
    open = false;
    O.t = 0;
    backdrop.classList.remove('open');
  }

  input.addEventListener('input', filterRows);
  input.addEventListener('keydown', e => {
    const visible = rows.filter(r => r.shown);
    if (e.key === 'Escape') closePalette();
    if (e.key === 'ArrowDown' && visible.length) {
      e.preventDefault();
      selectedIdx = (selectedIdx + 1) % visible.length;
      HY.t = selectedIdx * 40;
    }
    if (e.key === 'ArrowUp' && visible.length) {
      e.preventDefault();
      selectedIdx = (selectedIdx - 1 + visible.length) % visible.length;
      HY.t = selectedIdx * 40;
    }
    if (e.key === 'Enter' && visible[selectedIdx]) {
      e.preventDefault();
      const target = visible[selectedIdx].cmd;
      closePalette();
      target.run();
    }
  });

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closePalette();
  });

  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open ? closePalette() : openPalette();
    } else if (e.key === 'Escape' && open) {
      closePalette();
    }
  });

  store.on('cmd-open', openPalette);
  store.on('open-palette', openPalette);

  register({
    active: () => open || O.x > 0.01,
    frame(dt) {
      step(O, dt);
      step(HY, dt);
      rows.forEach(r => {
        step(r.y, dt);
        step(r.o, dt);
      });
    },
    render() {
      const v = clamp(O.x, 0, 1.08);
      pal.style.opacity = clamp(v, 0, 1).toFixed(3);
      pal.style.transform = `translateY(${((1 - clamp(v, 0, 1)) * -10).toFixed(1)}px) scale(${(0.94 + 0.06 * v).toFixed(4)})`;
      rows.forEach(r => {
        const rv = clamp(r.o.x, 0, 1);
        r.li.style.opacity = rv.toFixed(3);
        r.li.style.transform = `translateY(${(r.y.x + (1 - rv) * 8).toFixed(2)}px) scale(${(0.96 + 0.04 * rv).toFixed(4)})`;
      });
      hl.style.opacity = selectedIdx >= 0 ? '1' : '0';
      hl.style.transform = `translateY(${HY.x.toFixed(2)}px)`;
    },
  });
}

function initGooMenu() {
  const wrap = document.getElementById('goo-menu');
  if (!wrap) return;

  const actions = [
    {
      label: 'Odak Görevi',
      angle: -100,
      icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      run: () => {
        store.setView('studio');
        store.emit('studio-focus-input');
      },
    },
    {
      label: 'Kasaya Not',
      angle: -135,
      icon: '<path d="M12 5v14M5 12h14"/>',
      run: () => {
        store.setView('vault');
        store.emit('vault-quick-add');
      },
    },
    {
      label: 'AI Kokpit',
      angle: -170,
      icon: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
      run: () => {
        store.setView('ai');
        store.emit('ai-focus-input');
      },
    },
  ];

  wrap.innerHTML = `
    <div class="goo-stage" id="goo-stage">
      ${actions
        .map(
          (a, i) =>
            `<div class="goo-blob" data-idx="${i}"></div>`
        )
        .join('')}
      <div class="goo-blob-main" id="goo-blob-main"></div>
    </div>
    <div class="goo-icons" id="goo-icons">
      ${actions
        .map(
          (a, i) =>
            `<button class="goo-act" data-idx="${i}" type="button" title="${a.label}">${svg(a.icon)}</button>`
        )
        .join('')}
      <button class="goo-main" id="goo-main" type="button" aria-label="Hızlı Aksiyonlar" aria-expanded="false">
        ${svg('<path d="M12 5v14M5 12h14"/>')}
      </button>
    </div>
  `;

  const stageEl = wrap.querySelector('#goo-stage');
  const mainBtn = wrap.querySelector('#goo-main');
  const mainBlob = wrap.querySelector('#goo-blob-main');
  const blobs = [...wrap.querySelectorAll('.goo-blob')];
  const actBtns = [...wrap.querySelectorAll('.goo-act')];

  const OX = 148;
  const OY = 148;
  const BS = 44;
  const R = 98;
  let open = false;
  let gooRenderedOnce = false;

  const rot = S(0, 320, 20);
  const bubs = actions.map((a, i) => ({
    a,
    blob: blobs[i],
    btn: actBtns[i],
    x: S(0, 520, 34),
    y: S(0, 520, 34),
    s: S(0.4, 420, 26),
  }));

  function toggleMenu(force) {
    open = force !== undefined ? force : !open;
    mainBtn.setAttribute('aria-expanded', String(open));
    rot.t = open ? 45 : 0;
    sound.tickSound(0.6);

    bubs.forEach((b, i) => {
      const delay = (open ? i : bubs.length - 1 - i) * 0.045;
      after(delay, () => {
        if (open) {
          b.x.k = 230;
          b.x.c = 15;
          b.y.k = 230;
          b.y.c = 15;
          const rad = (b.a.angle * Math.PI) / 180;
          b.x.t = Math.cos(rad) * R;
          b.y.t = Math.sin(rad) * R;
          b.s.t = 1;
        } else {
          b.x.k = 520;
          b.x.c = 34;
          b.y.k = 520;
          b.y.c = 34;
          b.x.t = 0;
          b.y.t = 0;
          b.s.t = 0.4;
        }
      });
    });
  }

  mainBtn.addEventListener('click', () => toggleMenu());
  actBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      toggleMenu(false);
      actions[i].run();
    });
  });

  register({
    frame(dt) {
      step(rot, dt);
      bubs.forEach(b => {
        step(b.x, dt);
        step(b.y, dt);
        step(b.s, dt);
      });
    },
    render() {
      const moving =
        open ||
        Math.abs(rot.x - rot.t) > 0.05 ||
        Math.abs(rot.v) > 0.05 ||
        bubs.some(b => Math.abs(b.x.x) > 0.08 || Math.abs(b.y.x) > 0.08 || Math.abs(b.x.v) > 0.1 || Math.abs(b.y.v) > 0.1);

      if (!moving && gooRenderedOnce) return;
      gooRenderedOnce = true;

      if (stageEl) stageEl.style.filter = moving ? 'url(#goo)' : 'none';
      mainBlob.style.transform = `translate(${OX - 26}px, ${OY - 26}px)`;
      mainBtn.style.transform = `translate(${OX - 26}px, ${OY - 26}px) rotate(${rot.x.toFixed(1)}deg)`;

      bubs.forEach(b => {
        const x = OX + b.x.x - BS / 2;
        const y = OY + b.y.x - BS / 2;
        const sp = Math.hypot(b.x.v, b.y.v);
        const st = 1 + Math.min(sp / 2600, 0.32);
        const a = Math.atan2(b.y.v, b.x.v);
        const sc = clamp(b.s.x, 0.2, 1.2);
        b.blob.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(3)}rad) scale(${(st * sc).toFixed(3)}, ${(sc / st).toFixed(3)}) rotate(${(-a).toFixed(3)}rad)`;
        const dist = Math.hypot(b.x.x, b.y.x);
        const op = clamp((dist - 20) / 38, 0, 1);
        b.btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
        b.btn.style.opacity = op.toFixed(3);
        b.btn.style.pointerEvents = open && op > 0.5 ? 'auto' : 'none';
      });
    },
  });
}

function initUndoToast() {
  const el = document.getElementById('undo-toast');
  if (!el) return;

  el.innerHTML = `
    <span class="undo-msg" id="undo-msg">Öğe kaldırıldı</span>
    <button class="undo-btn" id="undo-action" type="button">Geri Al</button>
    <div class="undo-bar" id="undo-bar"></div>
  `;

  const msgEl = el.querySelector('#undo-msg');
  const actionBtn = el.querySelector('#undo-action');
  const bar = el.querySelector('#undo-bar');
  let activeUndo = null;
  let timer = null;

  store.on('undo-offer', payload => {
    activeUndo = payload;
    msgEl.textContent = payload.label;
    el.classList.add('show');
    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(1)';
    void bar.offsetWidth;
    bar.style.transition = 'transform 4.2s linear';
    bar.style.transform = 'scaleX(0)';
    clearTimeout(timer);
    timer = setTimeout(() => {
      el.classList.remove('show');
      activeUndo = null;
    }, 4200);
  });

  actionBtn.addEventListener('click', () => {
    if (!activeUndo) return;
    activeUndo.restore();
    clearTimeout(timer);
    el.classList.remove('show');
    activeUndo = null;
    sound.chime(660);
  });
}

export function initShell() {
  initPullCord();
  initMorphIsland();
  initRubberDock();
  initCommandPalette();
  initGooMenu();
  initUndoToast();
}
