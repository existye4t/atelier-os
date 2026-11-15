/**
 * Page 4: Görsel Fikir & İlham Kasası (Idea 5)
 * Components: File Drop (real drag/drop + image preview), Tag Input,
 * Expand Card, Glass Lens (3-layer chromatic aberration), Marker Text,
 * Stat Card (Catmull-Rom cubic Bezier SVG spline + Week/Month/Year spring pill).
 */
import { store } from '../store.js';
import { sound } from '../audio.js';

const { S, step, clamp, after, register, svg } = window.Motion;

export function mountVault(container) {
  container.innerHTML = `
    <div class="view-header">
      <div>
        <span class="eyebrow">04 · İLHAM &amp; NOT KOLEKSİYONU</span>
        <h2>Fikir Kasası</h2>
      </div>
      <div class="header-pills">
        <span class="chip-pill" id="vault-count-pill">${store.state.vaultItems.length} Kart</span>
        <span class="chip-pill">Mercek Büyütme · Sürükle-Bırak</span>
      </div>
    </div>

    <div class="vault-top-grid">
      <!-- File Drop + Quick Note + Tag Input -->
      <section class="panel drop-panel">
        <div class="file-drop" id="file-drop" tabindex="0">
          <input id="file-input" type="file" accept="image/*,.txt,.md,.json,.js,.css,.html" hidden />
          <div class="drop-icon">${svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>')}</div>
          <strong>Görsel veya Kod Dosyası Sürükle-Bırak</strong>
          <p>PNG/JPG görseller anında mercek incelemesine eklenir · Tıkla veya sürükle</p>
        </div>

        <form class="quick-note-form" id="quick-note-form">
          <input id="qn-title" type="text" placeholder="Hızlı fikir başlığı..." autocomplete="off" />
          <input id="qn-tag" type="text" placeholder="etiket (ör. motion)" autocomplete="off" />
          <button class="btn-primary" type="submit">Kasaya Ekle</button>
        </form>

        <div class="tag-filter-row" id="tag-filter-row"></div>
      </section>

      <!-- Live Stat Card (Catmull-Rom Cubic Bezier Spline) -->
      <section class="panel stat-panel">
        <div class="stat-top">
          <div>
            <span class="panel-label">ATÖLYE ÜRETİM NABZI · #db-stat-card</span>
            <p class="stat-big" id="stat-big">0 Öğe</p>
          </div>
          <span class="stat-delta" id="stat-delta">+18.4%</span>
        </div>

        <div class="chart-wrap">
          <svg class="stat-chart" id="stat-chart">
            <defs>
              <linearGradient id="vaultArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34d17a" stop-opacity="0.34"/>
                <stop offset="100%" stop-color="#34d17a" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path id="stat-fill" fill="url(#vaultArea)"/>
            <path id="stat-line" fill="none" stroke="#34d17a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="stat-dot" id="stat-dot"></span>
        </div>

        <div class="stat-seg" id="stat-seg">
          <span class="stat-pill" id="stat-pill"></span>
          <button type="button" data-r="0" class="active">Hafta</button>
          <button type="button" data-r="1">Ay</button>
          <button type="button" data-r="2">Yıl</button>
        </div>
      </section>
    </div>

    <div class="vault-bottom-grid">
      <!-- Expandable Cards List -->
      <section class="panel vault-list-panel">
        <div class="panel-head">
          <div>
            <span class="panel-label">GENİŞLEYEN KARTLAR · #db-expand-card</span>
            <h3 class="sub-h3">Kayıtlı Fikirler &amp; Vurgulu Notlar</h3>
          </div>
          <span class="chip-pill" id="filter-status">Tümü</span>
        </div>
        <div class="vault-cards" id="vault-cards"></div>
      </section>

      <!-- Optical Chromatic Glass Lens Plate -->
      <section class="panel lens-panel">
        <div class="panel-head">
          <div>
            <span class="panel-label">OPTİK BÜYÜTEÇ · #db-glass-lens</span>
            <h3 class="sub-h3" id="lens-title">Görsel Detay İnceleyici</h3>
          </div>
          <div class="lens-head-tools">
            <button class="chip-pill chip-action" id="lens-fit-btn" type="button" title="Sığdır veya Doldur">Sığdır</button>
            <button class="chip-pill chip-action" id="lens-hud-btn" type="button" title="Yazı katmanını aç/gizle">Yazı: Gizli</button>
            <span class="chip-pill">Basılı tut: 2.45x</span>
          </div>
        </div>

        <div class="lens-stage" id="lens-stage">
          <div class="lens-poster clean-photo" id="lens-poster" data-av="2">
            <div class="poster-art" id="poster-art">
              <div class="poster-grid-lines"></div>
              <div class="poster-badge">ATELIER · OPTİK PLAKA</div>
              <h4 id="poster-heading">Kromatik Cam Kırılması</h4>
              <p id="poster-sub">İmleci gezdir veya basılı tutarak ince detayları 2.45x yakınlaştır.</p>
              <div class="poster-specs">
                <span>BEND 1.00 / 1.05 / 1.12</span>
                <span>SPRING 180 / 17</span>
              </div>
            </div>
          </div>
          <div class="glass-lens" id="glass-lens" aria-hidden="true">
            <div class="lens-view" id="lens-view"></div>
            <div class="lens-rim"></div>
          </div>
        </div>
      </section>
    </div>
  `;

  // ---- 1. File Drop + Quick Note + Tags ----
  const fileDrop = container.querySelector('#file-drop');
  const fileInput = container.querySelector('#file-input');
  const quickForm = container.querySelector('#quick-note-form');
  const qnTitle = container.querySelector('#qn-title');
  const qnTag = container.querySelector('#qn-tag');
  const tagRow = container.querySelector('#tag-filter-row');
  const vaultCardsEl = container.querySelector('#vault-cards');
  const vaultCountPill = container.querySelector('#vault-count-pill');
  const filterStatus = container.querySelector('#filter-status');

  let activeTag = 'all';
  let expandedId = null;

  function handleFiles(fileList) {
    [...fileList].forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const item = store.addVaultItem({
            title: file.name,
            subtitle: `Görsel · ${(file.size / 1024).toFixed(1)} KB`,
            tag: 'görsel',
            kind: 'visual',
            badge: 'Görsel',
            imageData: String(reader.result),
            body: 'Sürükle-bırak ile Kasaya eklendi. Mercek alanına gönderip 2.45x büyüteçle inceleyebilirsin.',
            highlight: file.name,
          });
          setLensSubject(item);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const text = String(reader.result || '').slice(0, 420);
          store.addVaultItem({
            title: file.name,
            subtitle: `Dosya · ${(file.size / 1024).toFixed(1)} KB`,
            tag: 'kod',
            kind: 'code',
            badge: file.name.split('.').pop()?.toUpperCase() || 'TXT',
            body: text || '(Boş dosya)',
            highlight: file.name,
          });
        };
        reader.readAsText(file);
      }
    });
  }

  fileDrop.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) handleFiles(fileInput.files);
    fileInput.value = '';
  });
  fileDrop.addEventListener('dragover', e => {
    e.preventDefault();
    fileDrop.classList.add('dragover');
  });
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));
  fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    fileDrop.classList.remove('dragover');
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  });

  quickForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = qnTitle.value.trim();
    if (!title) return;
    const tag = qnTag.value.trim().toLowerCase() || 'motion';
    store.addTag(tag);
    store.addVaultItem({
      title,
      subtitle: 'Hızlı Atölye Notu',
      tag,
      badge: `#${tag}`,
      body: `"${title}" fikri hızlı ekleme formundan kaydedildi. Vurgulamak için altındaki metne tıkla.`,
      highlight: title,
    });
    qnTitle.value = '';
    qnTag.value = '';
    sound.chime(620);
  });

  function renderTags() {
    const allTags = ['all', ...store.state.vaultTags];
    tagRow.innerHTML = allTags
      .map(
        t => `
      <button type="button" class="vtag-chip ${activeTag === t ? 'active' : ''}" data-tag="${t}">
        ${t === 'all' ? 'Tümü' : '#' + t}
      </button>`
      )
      .join('');
    tagRow.querySelectorAll('.vtag-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTag = btn.dataset.tag;
        filterStatus.textContent = activeTag === 'all' ? 'Tümü' : `#${activeTag}`;
        renderTags();
        renderVaultCards();
      });
    });
  }

  function renderVaultCards() {
    const items = store.state.vaultItems.filter(i => activeTag === 'all' || i.tag === activeTag);
    vaultCountPill.textContent = `${store.state.vaultItems.length} Kart`;
    vaultCardsEl.innerHTML = items
      .map(item => {
        const isOpen = expandedId === item.id;
        return `
        <article class="vcard ${isOpen ? 'expanded' : ''}" data-id="${item.id}">
          <div class="vcard-head">
            <div class="vcard-thumb" ${item.imageData ? `style="background-image:url('${item.imageData}');background-size:cover;background-position:center;"` : `data-av="${item.av}"`}></div>
            <div class="vcard-meta">
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.subtitle)}</p>
            </div>
            <span class="vcard-badge">${escapeHtml(item.badge || '#' + item.tag)}</span>
          </div>
          <div class="vcard-more">
            <p class="vcard-body">${escapeHtml(item.body)}</p>
            <p class="marker-note" title="Vurgulamak için tıkla">
              <span class="marker-hl">${escapeHtml(item.highlight || item.title)}</span>
            </p>
            <div class="vcard-actions">
              <button class="btn-ghost v-inspect" type="button">Mercekte İncele</button>
              <button class="btn-ghost v-del" type="button">Sil</button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    vaultCardsEl.querySelectorAll('.vcard').forEach(card => {
      const id = card.dataset.id;
      const item = store.state.vaultItems.find(x => x.id === id);
      card.querySelector('.vcard-head').addEventListener('click', () => {
        expandedId = expandedId === id ? null : id;
        sound.tickSound(0.6);
        renderVaultCards();
      });
      card.querySelector('.marker-note')?.addEventListener('click', e => {
        e.stopPropagation();
        e.currentTarget.classList.toggle('marked');
        sound.tickSound(0.5);
      });
      card.querySelector('.v-inspect')?.addEventListener('click', e => {
        e.stopPropagation();
        if (item) setLensSubject(item);
      });
      card.querySelector('.v-del')?.addEventListener('click', e => {
        e.stopPropagation();
        const removed = store.removeVaultItem(id);
        if (removed) {
          if (expandedId === id) expandedId = null;
          store.emit('undo-offer', {
            label: `"${removed.item.title.slice(0, 20)}" kaldırıldı`,
            restore: () => store.restoreVaultItem(removed),
          });
        }
      });
    });
  }

  store.on('vault', () => {
    renderTags();
    renderVaultCards();
    updateStatRange(currentRange);
  });
  store.on('tags', renderTags);
  store.on('vault-quick-add', () => qnTitle.focus());
  store.on('vault-filter', tag => {
    activeTag = store.state.vaultTags.includes(tag) ? tag : 'all';
    filterStatus.textContent = activeTag === 'all' ? 'Tümü' : `#${activeTag}`;
    renderTags();
    renderVaultCards();
  });

  // ---- 2. Stat Card (Catmull-Rom Cubic Bezier Spline) ----
  const statBig = container.querySelector('#stat-big');
  const statDelta = container.querySelector('#stat-delta');
  const statChart = container.querySelector('#stat-chart');
  const statLine = container.querySelector('#stat-line');
  const statFill = container.querySelector('#stat-fill');
  const statDot = container.querySelector('#stat-dot');
  const statSeg = container.querySelector('#stat-seg');
  const statPill = container.querySelector('#stat-pill');
  const segBtns = [...statSeg.querySelectorAll('button')];

  const ptSprings = Array.from({ length: 12 }, () => S(0.3, 200, 17));
  const pillX = S(0, 380, 30);
  const pillW = S(64, 380, 30);
  let currentRange = 0;

  function buildRangeData(rangeIdx) {
    const items = store.state.vaultItems.length;
    const doneTasks = store.state.tasks.filter(t => t.done).length;
    const ai = store.state.aiRuns;
    const totalScore = items * 4 + doneTasks * 3 + ai;

    if (rangeIdx === 0) {
      return {
        label: `${items} Kart · ${doneTasks} Görev`,
        delta: `+${Math.min(48, 10 + items * 2)}%`,
        pts: [0.22, 0.34, 0.28, 0.45, 0.42, 0.58, 0.52, 0.68, 0.64, 0.78, 0.74, clamp(0.5 + totalScore / 90, 0.55, 0.96)],
      };
    }
    if (rangeIdx === 1) {
      return {
        label: `${totalScore} Üretim Puanı`,
        delta: `+${Math.min(72, 18 + ai)}%`,
        pts: [0.18, 0.24, 0.38, 0.32, 0.49, 0.54, 0.62, 0.58, 0.72, 0.81, 0.85, clamp(0.6 + totalScore / 100, 0.65, 0.98)],
      };
    }
    return {
      label: `${ai} AI · ${store.state.pomodoro.completedSessions} Odak`,
      delta: '+94.2%',
      pts: [0.12, 0.19, 0.25, 0.36, 0.41, 0.48, 0.61, 0.69, 0.76, 0.84, 0.91, 0.95],
    };
  }

  function updateStatRange(rangeIdx) {
    currentRange = rangeIdx;
    const data = buildRangeData(rangeIdx);
    statBig.textContent = data.label;
    statDelta.textContent = data.delta;
    data.pts.forEach((val, k) => {
      after(k * 0.028, () => {
        ptSprings[k].t = val;
      });
    });

    const activeBtn = segBtns[rangeIdx];
    segBtns.forEach((b, i) => b.classList.toggle('active', i === rangeIdx));
    if (activeBtn && activeBtn.offsetWidth > 0) {
      pillX.t = activeBtn.offsetLeft;
      pillW.t = activeBtn.offsetWidth;
    }
  }

  segBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.tickSound(0.65);
      updateStatRange(Number(btn.dataset.r));
    });
  });

  function syncStatPill(snap = false) {
    const activeBtn = segBtns[currentRange];
    if (!activeBtn || activeBtn.offsetWidth === 0) return;
    const xTarget = activeBtn.offsetLeft;
    const wTarget = activeBtn.offsetWidth;
    if (snap) {
      pillX.x = pillX.t = xTarget;
      pillW.x = pillW.t = wTarget;
    } else {
      pillX.t = xTarget;
      pillW.t = wTarget;
    }
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => syncStatPill(true)).observe(statSeg);
  }
  store.on('view', v => {
    if (v === 'vault') requestAnimationFrame(() => syncStatPill(true));
  });

  requestAnimationFrame(() => {
    syncStatPill(true);
    updateStatRange(0);
  });

  // ---- 3. Glass Lens (3-layer chromatic bend refraction, zero-text clean photo mode) ----
  const lensStage = container.querySelector('#lens-stage');
  const lensPoster = container.querySelector('#lens-poster');
  const lensEl = container.querySelector('#glass-lens');
  const lensView = container.querySelector('#lens-view');
  const lensTitle = container.querySelector('#lens-title');
  const lensFitBtn = container.querySelector('#lens-fit-btn');
  const lensHudBtn = container.querySelector('#lens-hud-btn');
  const posterHeading = container.querySelector('#poster-heading');
  const posterSub = container.querySelector('#poster-sub');

  const BEND = [1, 1.045, 1.095];
  const lensX = S(160, 180, 17);
  const lensY = S(115, 180, 17);
  const lensZ = S(1.75, 260, 26);
  let lensHover = false;
  let lensClock = 0;
  let lensCopies = [];
  let hasActivePhoto = false;
  let forceShowHud = false;
  let fitContain = true;

  let cachedChartW = statChart.clientWidth || 320;
  let cachedPosterW = lensPoster.clientWidth || 380;
  let cachedPosterH = lensPoster.clientHeight || 280;

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (statChart.clientWidth > 0) cachedChartW = statChart.clientWidth;
    }).observe(statChart);
    new ResizeObserver(() => {
      if (lensPoster.clientWidth > 0) cachedPosterW = lensPoster.clientWidth;
      if (lensPoster.clientHeight > 0) cachedPosterH = lensPoster.clientHeight;
    }).observe(lensPoster);
  }

  function applyPosterStyle() {
    const cleanMode = hasActivePhoto && !forceShowHud;
    lensPoster.classList.toggle('clean-photo', cleanMode);
    lensHudBtn.textContent = cleanMode ? 'Yazı: Gizli' : 'Yazı: Açık';
    if (hasActivePhoto) {
      lensPoster.style.backgroundSize = fitContain ? 'contain' : 'cover';
      lensPoster.style.backgroundRepeat = 'no-repeat';
      lensPoster.style.backgroundColor = '#0b0c10';
    }
    lensFitBtn.textContent = fitContain ? 'Sığdır' : 'Doldur';
    lensFitBtn.style.display = hasActivePhoto ? 'inline-flex' : 'none';
  }

  function rebuildLensCopies() {
    lensView.innerHTML = '';
    lensCopies = BEND.map((b, idx) => {
      const clone = lensPoster.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('lens-clone');
      clone.style.opacity = idx === 0 ? '1' : '0.32';
      lensView.appendChild(clone);
      return { c: clone, b };
    });
  }

  function setLensSubject(item) {
    lensTitle.textContent = item.title;
    posterHeading.textContent = item.title;
    posterSub.textContent = item.body;
    hasActivePhoto = Boolean(item.imageData);
    forceShowHud = !hasActivePhoto;
    if (item.imageData) {
      lensPoster.removeAttribute('data-av');
      lensPoster.style.backgroundImage = `url('${item.imageData}')`;
      lensPoster.style.backgroundPosition = 'center';
    } else {
      lensPoster.style.backgroundImage = '';
      lensPoster.style.backgroundColor = '';
      lensPoster.dataset.av = String(item.av || 2);
    }
    applyPosterStyle();
    rebuildLensCopies();
  }

  lensFitBtn.addEventListener('click', () => {
    fitContain = !fitContain;
    applyPosterStyle();
    rebuildLensCopies();
    sound.tickSound(0.5);
  });

  lensHudBtn.addEventListener('click', () => {
    forceShowHud = !forceShowHud;
    applyPosterStyle();
    rebuildLensCopies();
    sound.tickSound(0.5);
  });

  const initialVisual = store.state.vaultItems.find(x => x.imageData);
  if (initialVisual) {
    setLensSubject(initialVisual);
  } else {
    applyPosterStyle();
    rebuildLensCopies();
  }

  lensStage.addEventListener('pointerenter', () => { lensHover = true; });
  lensStage.addEventListener('pointerleave', () => {
    lensHover = false;
    lensZ.t = 1.75;
  });
  lensStage.addEventListener('pointermove', e => {
    const r = lensStage.getBoundingClientRect();
    lensX.t = clamp(e.clientX - r.left, 20, r.width - 20);
    lensY.t = clamp(e.clientY - r.top, 20, r.height - 20);
  });
  lensStage.addEventListener('pointerdown', () => { lensZ.t = 2.45; });
  lensStage.addEventListener('pointerup', () => { lensZ.t = 1.75; });

  renderTags();
  renderVaultCards();

  // ---- Active-only rAF physics for Stat Card & Glass Lens (sleeps cleanly when settled) ----
  const isSettled = (s, eps = 0.002) => Math.abs(s.x - s.t) < eps && Math.abs(s.v) < eps;
  let lastStatSig = '';
  let lastLensSig = '';

  register({
    active: () => store.state.activeView === 'vault',
    frame(dt) {
      ptSprings.forEach(p => step(p, dt));
      step(pillX, dt);
      step(pillW, dt);

      if (!lensHover) {
        const W = cachedPosterW || 320;
        const H = cachedPosterH || 240;
        if (Math.abs(lensX.t - W * 0.5) > 0.05) lensX.t = W * 0.5;
        if (Math.abs(lensY.t - H * 0.48) > 0.05) lensY.t = H * 0.48;
      }
      step(lensX, dt);
      step(lensY, dt);
      step(lensZ, dt);
    },
    render() {
      const statSettled = ptSprings.every(p => isSettled(p)) && isSettled(pillX, 0.05) && isSettled(pillW, 0.05);
      const statSig = `${cachedChartW}|${pillX.x.toFixed(1)}|${pillW.x.toFixed(1)}|${ptSprings.map(p => p.x.toFixed(3)).join(',')}`;
      if (!statSettled || statSig !== lastStatSig) {
        lastStatSig = statSig;
        const W = cachedChartW || 280;
        const H = 96;
        const n = ptSprings.length;
        statChart.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const xy = ptSprings.map((p, i) => [
          4 + (i / (n - 1)) * (W - 8),
          10 + (1 - clamp(p.x, -0.05, 1.05)) * (H - 20),
        ]);
        let d = `M${xy[0][0].toFixed(2)} ${xy[0][1].toFixed(2)}`;
        for (let i = 0; i < n - 1; i++) {
          const p0 = xy[i - 1] || xy[i];
          const p1 = xy[i];
          const p2 = xy[i + 1];
          const p3 = xy[i + 2] || p2;
          const c1x = p1[0] + (p2[0] - p0[0]) / 6;
          const c1y = p1[1] + (p2[1] - p0[1]) / 6;
          const c2x = p2[0] - (p3[0] - p1[0]) / 6;
          const c2y = p2[1] - (p3[1] - p1[1]) / 6;
          d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
        }
        statLine.setAttribute('d', d);
        statFill.setAttribute('d', `${d} L${xy[n - 1][0].toFixed(2)} ${H} L${xy[0][0].toFixed(2)} ${H} Z`);
        statDot.style.transform = `translate(${(xy[n - 1][0] - 4.5).toFixed(2)}px, ${(xy[n - 1][1] - 4.5).toFixed(2)}px)`;

        statPill.style.transform = `translateX(${pillX.x.toFixed(2)}px)`;
        statPill.style.width = `${Math.max(40, pillW.x).toFixed(2)}px`;
      }

      const lensSig = `${cachedPosterW}|${cachedPosterH}|${lensX.x.toFixed(1)}|${lensY.x.toFixed(1)}|${lensZ.x.toFixed(3)}|${lensX.v.toFixed(1)}`;
      if (lensSig !== lastLensSig) {
        lastLensSig = lensSig;
        const L = 164;
        const x = lensX.x;
        const y = lensY.x;
        const tilt = clamp(lensX.v / 220, -6, 6);
        lensEl.style.transform = `translate(${(x - L / 2).toFixed(2)}px, ${(y - L / 2).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg)`;
        lensView.style.transform = `rotate(${(-tilt).toFixed(2)}deg)`;

        const pw = cachedPosterW || 320;
        const ph = cachedPosterH || 240;
        const ox = -(x - L / 2);
        const oy = -(y - L / 2);
        const origin = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
        lensCopies.forEach(({ c, b }) => {
          c.style.width = `${pw}px`;
          c.style.height = `${ph}px`;
          c.style.transformOrigin = origin;
          c.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${(lensZ.x * b).toFixed(4)})`;
        });
      }
    },
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
