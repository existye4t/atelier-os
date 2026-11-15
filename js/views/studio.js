/**
 * Page 1: Odak & Taktil Ses Stüdyosu (Idea 1)
 * Components: Liquid Glass Player, Music Toggle, Detent Dial, Exposure Slider,
 * Pomodoro Focus Controller, Animated SVG Checkbox List.
 */
import { store } from '../store.js';
import { sound, TRACKS } from '../audio.js';

const { S, step, clamp, register, svg } = window.Motion;

export function mountStudio(container) {
  container.innerHTML = `
    <div class="view-header">
      <div>
        <span class="eyebrow">01 · TAKTİL ÇALIŞMA İSTASYONU</span>
        <h2>Odak &amp; Ses Stüdyosu</h2>
      </div>
      <div class="header-pills">
        <span class="chip-pill">Web Audio Sentezleyici</span>
        <span class="chip-pill">270° Manyetik Kadran</span>
      </div>
    </div>

    <div class="studio-grid">
      <!-- Liquid Glass Audio Card -->
      <section class="panel glass-panel" id="studio-glass-card">
        <div class="glass-bg-orb" id="glass-orb"></div>
        <div class="glass-inner">
          <div class="card-top-row">
            <div class="track-art" id="track-art" data-av="6"></div>
            <div class="track-meta">
              <span class="badge-inline">Buzlu Cam Çalar · #liquid-glass-card</span>
              <h3 id="track-title">Gece Yağmuru &amp; Cam</h3>
              <p id="track-artist">Atelier Ambient · 432 Hz</p>
            </div>
            <button class="music-toggle" id="music-toggle" type="button" aria-label="Sesi Aç veya Duraklat">
              <span class="eq-bars" id="eq-bars">
                <i></i><i></i><i></i><i></i>
              </span>
            </button>
          </div>

          <div class="spectrum-wrap" id="spectrum-wrap"></div>

          <div class="track-switcher" id="track-switcher">
            ${TRACKS.map(
              (t, i) => `
              <button class="track-chip ${i === 0 ? 'active' : ''}" data-idx="${i}" type="button">
                <span class="tc-dot" data-av="${t.av}"></span>
                <span>${t.title.split(' ')[0]}</span>
              </button>`
            ).join('')}
          </div>
        </div>
      </section>

      <!-- Detent Dial + Exposure Slider -->
      <section class="panel tactile-panel">
        <div class="tactile-split">
          <div class="dial-block">
            <div class="panel-head">
              <span class="panel-label">MİKS &amp; FİLTRE</span>
              <strong class="panel-val" id="dial-val-txt">44%</strong>
            </div>
            <div class="dial-stage" id="dial-stage" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="44" aria-label="Ortam Filtre Kadranı">
              <svg class="dial-svg" viewBox="0 0 200 200" id="dial-svg">
                <g id="dial-ticks"></g>
              </svg>
              <div class="dial-knob" id="dial-knob">
                <div class="dial-cap">
                  <span class="dial-indicator" id="dial-indicator"></span>
                </div>
              </div>
            </div>
            <p class="dial-sub" id="dial-mood">Yağmur yoğunluğu · Tıkırtılı tutuş</p>
          </div>

          <div class="exposure-block">
            <div class="panel-head">
              <span class="panel-label">ATÖLYE IŞIĞI</span>
              <strong class="panel-val" id="exp-val-txt">+0.35 EV</strong>
            </div>
            <div class="exp-slider" id="exp-slider" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="35" aria-label="Ortam Pozlama Işığı">
              <div class="exp-track"></div>
              <div class="exp-ticks">
                ${Array.from({ length: 19 }, (_, i) => `<i class="${i % 6 === 0 ? 'major' : ''}"></i>`).join('')}
              </div>
              <div class="exp-needle" id="exp-needle"></div>
            </div>
            <p class="dial-sub">Arka plan lamba sıcaklığını ve parlaklığı ayarlar</p>

            <!-- Pomodoro Mini Deck -->
            <div class="pomo-box">
              <div class="pomo-top">
                <div>
                  <span class="panel-label">DERİN ODAK</span>
                  <strong class="pomo-clock" id="pomo-clock">25:00</strong>
                </div>
                <div class="pomo-presets" id="pomo-presets">
                  <button type="button" data-min="25" class="active">25d</button>
                  <button type="button" data-min="15">15d</button>
                  <button type="button" data-min="5">5d</button>
                </div>
              </div>
              <div class="pomo-actions">
                <button class="btn-primary" id="pomo-start-btn" type="button">Oturumu Başlat</button>
                <button class="btn-ghost" id="pomo-reset-btn" type="button">Sıfırla</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Animated SVG Checkbox Task List -->
      <section class="panel tasks-panel">
        <div class="panel-head">
          <div>
            <span class="panel-label">GÜNLÜK ODAK LİSTESİ · #db-checkbox-list</span>
            <h3 class="sub-h3">Tamamlanacak Adımlar</h3>
          </div>
          <span class="chip-pill" id="task-counter">0 / 0</span>
        </div>

        <form class="task-form" id="task-form">
          <input id="task-input" type="text" placeholder="Yeni bir odak görevi ekle..." autocomplete="off" />
          <button class="btn-primary" type="submit">Ekle</button>
        </form>

        <ul class="task-list" id="task-list"></ul>
      </section>
    </div>
  `;

  // ---- 1. Glass Player & Web Audio ----
  const trackArt = container.querySelector('#track-art');
  const trackTitle = container.querySelector('#track-title');
  const trackArtist = container.querySelector('#track-artist');
  const musicToggle = container.querySelector('#music-toggle');
  const eqBars = [...container.querySelectorAll('#eq-bars i')];
  const spectrumWrap = container.querySelector('#spectrum-wrap');
  const trackChips = [...container.querySelectorAll('.track-chip')];
  const dialMood = container.querySelector('#dial-mood');

  const SPEC_BARS = 24;
  spectrumWrap.innerHTML = Array.from({ length: SPEC_BARS }, () => '<span class="spec-bar"></span>').join('');
  const specBars = [...spectrumWrap.querySelectorAll('.spec-bar')];

  function renderAudioUI() {
    const t = TRACKS[sound.trackIdx];
    trackArt.dataset.av = String(t.av);
    if (sound.trackIdx === 0) {
      trackArt.style.backgroundImage = `url('./assets/studio-cover.jpg')`;
      trackArt.style.backgroundSize = 'cover';
      trackArt.style.backgroundPosition = 'center';
    } else if (sound.trackIdx === 1) {
      trackArt.style.backgroundImage = `url('./assets/hardware-macro.jpg')`;
      trackArt.style.backgroundSize = 'cover';
      trackArt.style.backgroundPosition = 'center';
    } else if (sound.trackIdx === 2) {
      trackArt.style.backgroundImage = `url('./assets/architectural-light.jpg')`;
      trackArt.style.backgroundSize = 'cover';
      trackArt.style.backgroundPosition = 'center';
    } else {
      trackArt.style.backgroundImage = '';
    }
    trackTitle.textContent = t.title;
    trackArtist.textContent = `${t.artist} · ${t.bpm}`;
    dialMood.textContent = `${t.mood} · Tıkırtılı tutuş`;
    musicToggle.classList.toggle('playing', sound.playing);
    trackChips.forEach((c, i) => c.classList.toggle('active', i === sound.trackIdx));
    store.state.soundTrack = sound.trackIdx;
    store.state.playing = sound.playing;
    if (sound.playing) window.Motion?.wake?.();
    store.emit('audio');
  }

  musicToggle.addEventListener('click', () => {
    sound.toggle();
    renderAudioUI();
  });

  trackChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const idx = Number(chip.dataset.idx);
      sound.play(idx);
      renderAudioUI();
    });
  });

  store.on('audio-toggle', () => {
    sound.toggle();
    renderAudioUI();
  });

  store.on('studio-control', cmd => {
    if (!cmd) return;
    if (typeof cmd.trackIdx === 'number') {
      const idx = clamp(cmd.trackIdx, 0, TRACKS.length - 1);
      if (cmd.playing === false) {
        sound.trackIdx = idx;
      } else {
        sound.play(idx);
      }
      renderAudioUI();
    } else if (typeof cmd.playing === 'boolean') {
      if (cmd.playing && !sound.playing) sound.play(sound.trackIdx);
      else if (!cmd.playing && sound.playing) sound.stop();
      renderAudioUI();
    }
    if (typeof cmd.dialMix === 'number') {
      updateDialValue(clamp(cmd.dialMix, 0, 100));
    }
    if (typeof cmd.exposure === 'number') {
      const v = clamp(cmd.exposure, 0, 1);
      expS.t = v;
      store.setExposure(v);
      expValTxt.textContent = `+${v.toFixed(2)} EV`;
    }
    if (typeof cmd.pomodoroMinutes === 'number' && [5, 15, 25, 45].includes(cmd.pomodoroMinutes)) {
      const p = store.state.pomodoro;
      p.duration = cmd.pomodoroMinutes * 60;
      p.secondsLeft = cmd.pomodoroMinutes * 60;
      p.running = cmd.pomodoroAction === 'start';
      if (!p.running) clearInterval(pomoInterval);
      store.persist();
      renderPomo();
    }
    if (cmd.pomodoroAction === 'start') togglePomo(true);
    else if (cmd.pomodoroAction === 'pause') togglePomo(false);
    else if (cmd.pomodoroAction === 'reset') pomoResetBtn.click();
  });

  store.on('exposure', v => {
    if (!expDragging) {
      expS.t = v;
      expValTxt.textContent = `+${v.toFixed(2)} EV`;
    }
  });

  // ---- 2. Detent Dial (exact Kokonut/Motion math) ----
  const dialStage = container.querySelector('#dial-stage');
  const dialTicksG = container.querySelector('#dial-ticks');
  const dialKnob = container.querySelector('#dial-knob');
  const dialValTxt = container.querySelector('#dial-val-txt');

  const SWEEP = 270;
  const START_ANGLE = -135;
  const MAX_TICKS = 45;
  const WAVE_HEIGHT = 9;
  const WAVE_WIDTH = 14;
  const DEAD_ZONE = 14;
  const DETENT_STEP = 5;

  const tickEls = [];
  for (let i = 0; i < MAX_TICKS; i++) {
    const ratio = i / (MAX_TICKS - 1);
    const angle = START_ANGLE + ratio * SWEEP;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', i % 5 === 0 ? 'dial-tick major' : 'dial-tick');
    dialTicksG.appendChild(line);
    tickEls.push({ line, angle, ratio });
  }

  const dialS = S(store.state.dialMix, 280, 22);
  let dialDragging = false;
  let lastAngle = 0;
  let lastDetent = Math.round(store.state.dialMix / DETENT_STEP) * DETENT_STEP;
  let dialVel = 0;
  let lastMoveTime = 0;

  function polar(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
  }

  function damp(distance, max) {
    return max * (1 - Math.exp(-Math.abs(distance) / max)) * Math.sign(distance);
  }

  function updateDialValue(rawVal) {
    let val = rawVal;
    if (val < 0) val = damp(val, 16);
    else if (val > 100) val = 100 + damp(val - 100, 16);
    dialS.t = val;
    const clamped = clamp(Math.round(val), 0, 100);
    const nearest = Math.round(clamped / DETENT_STEP) * DETENT_STEP;
    if (nearest !== lastDetent) {
      lastDetent = nearest;
      sound.tickSound(0.65);
    }
    dialValTxt.textContent = `${clamped}%`;
    dialStage.setAttribute('aria-valuenow', String(clamped));
    sound.setMix(clamped / 100);
    store.setDialMix(clamped);
  }

  function pointerAngle(e) {
    const r = dialStage.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    if (Math.hypot(dx, dy) < DEAD_ZONE) return null;
    return (Math.atan2(dx, -dy) * 180) / Math.PI;
  }

  dialStage.addEventListener('pointerdown', e => {
    const a = pointerAngle(e);
    if (a === null) return;
    dialDragging = true;
    dialStage.setPointerCapture(e.pointerId);
    lastAngle = a;
    lastMoveTime = performance.now();
    dialS.k = 900;
    dialS.c = 50;
  });

  dialStage.addEventListener('pointermove', e => {
    if (!dialDragging) return;
    const a = pointerAngle(e);
    if (a === null) return;
    let delta = a - lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngle = a;
    const now = performance.now();
    const dtMs = Math.max(8, now - lastMoveTime);
    lastMoveTime = now;
    const dv = (delta / SWEEP) * 100;
    dialVel = (dv / dtMs) * 16;
    updateDialValue(dialS.t + dv);
  });

  const endDial = () => {
    if (!dialDragging) return;
    dialDragging = false;
    dialS.k = 280;
    dialS.c = 22;
    const coasted = clamp(dialS.t + dialVel * 0.3, 0, 100);
    const snapped = Math.round(coasted / DETENT_STEP) * DETENT_STEP;
    updateDialValue(snapped);
  };
  dialStage.addEventListener('pointerup', endDial);
  dialStage.addEventListener('pointercancel', endDial);

  dialStage.addEventListener('wheel', e => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 5 : -5;
    updateDialValue(clamp(Math.round(dialS.t) + dir, 0, 100));
  }, { passive: false });

  dialStage.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      updateDialValue(clamp(Math.round(dialS.t) + 5, 0, 100));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      updateDialValue(clamp(Math.round(dialS.t) - 5, 0, 100));
    }
  });

  store.on('dialMix', val => {
    if (!dialDragging) {
      dialS.t = val;
      dialValTxt.textContent = `${Math.round(val)}%`;
      sound.setMix(val / 100);
    }
  });

  // ---- 3. Exposure Slider ----
  const expSlider = container.querySelector('#exp-slider');
  const expNeedle = container.querySelector('#exp-needle');
  const expValTxt = container.querySelector('#exp-val-txt');
  const expS = S(store.state.exposure, 420, 28);
  let expDragging = false;

  function setExpFromPointer(clientX) {
    const r = expSlider.getBoundingClientRect();
    const v = clamp((clientX - r.left) / r.width, 0, 1);
    expS.t = v;
    store.setExposure(v);
    expValTxt.textContent = `+${v.toFixed(2)} EV`;
    expSlider.setAttribute('aria-valuenow', String(Math.round(v * 100)));
  }

  expSlider.addEventListener('pointerdown', e => {
    expDragging = true;
    expSlider.setPointerCapture(e.pointerId);
    setExpFromPointer(e.clientX);
  });
  expSlider.addEventListener('pointermove', e => {
    if (expDragging) setExpFromPointer(e.clientX);
  });
  expSlider.addEventListener('pointerup', () => { expDragging = false; });
  expSlider.addEventListener('pointercancel', () => { expDragging = false; });
  expValTxt.textContent = `+${store.state.exposure.toFixed(2)} EV`;
  store.setExposure(store.state.exposure);

  // ---- 4. Pomodoro Timer ----
  const pomoClock = container.querySelector('#pomo-clock');
  const pomoStartBtn = container.querySelector('#pomo-start-btn');
  const pomoResetBtn = container.querySelector('#pomo-reset-btn');
  const presetBtns = [...container.querySelectorAll('#pomo-presets button')];
  let pomoInterval = null;

  function fmtSec(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderPomo() {
    const p = store.state.pomodoro;
    pomoClock.textContent = fmtSec(p.secondsLeft);
    pomoStartBtn.textContent = p.running ? 'Duraklat' : 'Oturumu Başlat';
    store.emit('pomodoro');
  }

  function togglePomo(forceStart) {
    const p = store.state.pomodoro;
    const next = forceStart !== undefined ? forceStart : !p.running;
    p.running = next;
    clearInterval(pomoInterval);
    if (p.running) {
      pomoInterval = setInterval(() => {
        if (p.secondsLeft > 0) {
          p.secondsLeft -= 1;
        } else {
          p.running = false;
          p.completedSessions += 1;
          p.secondsLeft = p.duration;
          clearInterval(pomoInterval);
          sound.chime(784);
          store.emit('toast', { title: 'Odak Tamamlandı', detail: '+1 Oturum', kind: 'save' });
        }
        store.persist();
        renderPomo();
      }, 1000);
    }
    store.persist();
    renderPomo();
  }

  pomoStartBtn.addEventListener('click', () => {
    sound.tickSound(0.9);
    togglePomo();
  });

  pomoResetBtn.addEventListener('click', () => {
    const p = store.state.pomodoro;
    p.running = false;
    p.secondsLeft = p.duration;
    clearInterval(pomoInterval);
    store.persist();
    renderPomo();
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const min = Number(btn.dataset.min);
      const p = store.state.pomodoro;
      p.running = false;
      clearInterval(pomoInterval);
      p.duration = min * 60;
      p.secondsLeft = min * 60;
      store.persist();
      renderPomo();
    });
  });

  store.on('pomodoro-toggle', () => togglePomo());
  store.on('pomodoro-start', () => togglePomo(true));
  renderPomo();

  // ---- 5. Animated SVG Checkbox List ----
  const taskForm = container.querySelector('#task-form');
  const taskInput = container.querySelector('#task-input');
  const taskList = container.querySelector('#task-list');
  const taskCounter = container.querySelector('#task-counter');

  function renderTasks() {
    const tasks = store.state.tasks;
    const doneCount = tasks.filter(t => t.done).length;
    taskCounter.textContent = `${doneCount} / ${tasks.length}`;
    taskList.innerHTML = tasks
      .map(
        t => `
      <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <button class="task-check" type="button" aria-label="Görevi tamamla">
          <svg viewBox="0 0 24 24"><path class="check-path" d="M5 13l4 4L19 7"/></svg>
        </button>
        <span class="task-text">${escapeHtml(t.text)}</span>
        <button class="task-del" type="button" aria-label="Görevi sil">${svg('<path d="M18 6L6 18M6 6l12 12"/>')}</button>
      </li>
    `
      )
      .join('');

    taskList.querySelectorAll('.task-item').forEach(li => {
      const id = li.dataset.id;
      li.querySelector('.task-check').addEventListener('click', () => {
        sound.tickSound(0.8);
        store.toggleTask(id);
      });
      li.querySelector('.task-del').addEventListener('click', () => {
        const removed = store.removeTask(id);
        if (removed) {
          store.emit('undo-offer', {
            label: `"${removed.item.text.slice(0, 22)}..." silindi`,
            restore: () => store.restoreTask(removed),
          });
        }
      });
    });
  }

  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    if (store.addTask(taskInput.value)) {
      sound.chime(523.25);
      taskInput.value = '';
    }
  });

  store.on('tasks', renderTasks);
  store.on('studio-focus-input', () => taskInput.focus());
  renderTasks();
  renderAudioUI();

  // ---- Shared rAF physics for Dial, Exposure & Spectrum (pauses when view is hidden) ----
  let lastDialAngle = null;
  let lastExp = null;
  let wasPlaying = null;

  register({
    active: () => store.state.activeView === 'studio',
    running: () => sound.playing,
    frame(dt) {
      step(dialS, dt);
      step(expS, dt);
    },
    render() {
      const currentAngle = START_ANGLE + (dialS.x / 100) * SWEEP;
      if (lastDialAngle === null || Math.abs(currentAngle - lastDialAngle) > 0.04) {
        lastDialAngle = currentAngle;
        dialKnob.style.transform = `rotate(${currentAngle.toFixed(2)}deg)`;

        tickEls.forEach(t => {
          const diff = Math.abs(t.angle - currentAngle);
          const swell = diff < WAVE_WIDTH * 2 ? Math.exp(-(diff * diff) / (2 * WAVE_WIDTH * WAVE_WIDTH)) : 0;
          const innerR = 72;
          const outerR = (t.angle % 30 === 0 ? 84 : 80) + swell * WAVE_HEIGHT;
          const [x1, y1] = polar(100, 100, innerR, t.angle);
          const [x2, y2] = polar(100, 100, outerR, t.angle);
          t.line.setAttribute('x1', x1.toFixed(2));
          t.line.setAttribute('y1', y1.toFixed(2));
          t.line.setAttribute('x2', x2.toFixed(2));
          t.line.setAttribute('y2', y2.toFixed(2));
          t.line.style.opacity = (t.angle <= currentAngle ? 0.92 : 0.25 + swell * 0.45).toFixed(2);
        });
      }

      if (lastExp === null || Math.abs(expS.x - lastExp) > 0.0005) {
        lastExp = expS.x;
        const pct = clamp(expS.x, 0, 1) * 100;
        expNeedle.style.left = `${pct.toFixed(2)}%`;
      }

      if (sound.playing || wasPlaying !== sound.playing) {
        wasPlaying = sound.playing;
        const levels = sound.getLevels(SPEC_BARS);
        specBars.forEach((b, i) => {
          const h = sound.playing ? levels[i] : 0.12 + 0.08 * Math.sin(i * 0.6);
          b.style.transform = `scaleY(${clamp(h, 0.1, 1).toFixed(3)})`;
        });
        eqBars.forEach((b, i) => {
          const h = sound.playing ? levels[i * 4] : 0.25;
          b.style.transform = `scaleY(${clamp(h, 0.22, 1).toFixed(3)})`;
        });
      }
    },
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
