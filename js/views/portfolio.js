/**
 * Page 3: Gerçek GitHub Portfolyosu & 3D Dergi (Idea 3 · Upgraded)
 * - Real github.com/existye4t profile (avatar, bio, repos, followers) via /api/github
 * - Fixed digit-drum counter, Word Roll, Weight Wave, Scramble Text
 * - Magnetic Button, Copy GitHub URL, Like Burst, Fan Cards (editorial photography)
 * - Swipe Deck featuring Exist's real projects + 2D Affine Page Flip Magazine
 */
import { store } from '../store.js';
import { sound } from '../audio.js';

const { S, step, clamp, after, register, svg } = window.Motion;

const DECK_WORKS = [
  {
    id: 'w-flow',
    av: 6,
    cover: './assets/hardware-macro.jpg',
    tag: 'TypeScript · Başlatıcı',
    title: 'flow',
    desc: 'Windows için klavye-odaklı minimal başlatıcı ve dahili ekran görüntüsü aracı.',
    url: 'https://github.com/existye4t/flow',
  },
  {
    id: 'w-eren',
    av: 11,
    cover: './assets/studio-cover.jpg',
    tag: 'Vanilla JS · Canvas · Web Audio',
    title: "Eren'in Yatağı",
    desc: '25 kısım, 70 bölümlük saf Canvas & Web Audio retro piksel simülasyon oyunu.',
    url: 'https://github.com/existye4t/erenin-yatagi',
  },
  {
    id: 'w-bw',
    av: 4,
    cover: './assets/architectural-light.jpg',
    tag: 'TypeScript · Gizlilik Odaklı',
    title: 'exist-bw',
    desc: 'Tamamen tarayıcıda çalışan, sunucuya dosya yüklemeyen siyah-beyaz fotoğraf stüdyosu.',
    url: 'https://github.com/existye4t/exist-bw',
  },
  {
    id: 'w-darmo',
    av: 2,
    tag: 'Python · Arch Linux',
    title: 'darmoshark-packages',
    desc: 'Darmoshark Linux donanım kontrolü için imzalı pacman paketleri.',
    url: 'https://github.com/existye4t/darmoshark-packages',
  },
  {
    id: 'w-skin',
    av: 7,
    tag: 'TypeScript · Port',
    title: 'skin-fixer',
    desc: 'cslol-go Skin Fixer tarayıcı portu: .fantome dosyalarını yerel onarır.',
    url: 'https://github.com/existye4t/skin-fixer',
  },
  {
    id: 'w-lilium',
    av: 3,
    tag: 'HTML · Atmosfer',
    title: 'lilium',
    desc: 'Etkileşimli botanik ve atmosferik ışık simülasyonu.',
    url: 'https://github.com/existye4t/lilium',
  },
];

const MAGAZINE_PAGES = [
  {
    left: {
      num: '01',
      eyebrow: 'BÖLÜM I · HAREKET DİLİ',
      title: 'Süre Değil, Yay Fiziği',
      body: 'Sabit 300ms eğrileri yerine kütle-yay-sönümleme denklemleri kullanılır. İmleci bıraktığın andaki hız doğrudan devam eder; arayüz cansız değil dokunsal hissettirir.',
      meta: 'k = 420 · c = 26',
    },
    right: {
      num: '02',
      eyebrow: 'BÖLÜM II · OPTİK DERİNLİK',
      title: 'Gölgesiz Ayrışma',
      body: 'Ağır gölgeler yerine katman kontrastı, ince cam kırılma filtreleri ve saf arka plan bulanıklığıyla doğal bir derinlik kurulur.',
      meta: 'SVG feDisplacementMap',
    },
  },
  {
    left: {
      num: '03',
      eyebrow: 'BÖLÜM III · SIVI GEOMETRİ',
      title: 'Hacim Koruyan Kapsüller',
      body: 'Bir kapsül yatayda gerilirken hacmini korumak için dikeyde hafifçe incelir. Rubber Dock ve Morph Island bu sayede kauçuk gibi esner.',
      meta: 'ih = H · √(W/iw)',
    },
    right: {
      num: '04',
      eyebrow: 'BÖLÜM IV · KİŞİSEL ÜRETİM',
      title: 'Yerel-Öncelikli Araçlar',
      body: 'flow başlatıcısından exist-bw fotoğraf işleyicisine kadar her araç hız, gizlilik ve sıfır gecikmeli klavye ergonomisi üzerine kurulur.',
      meta: 'github.com/existye4t',
    },
  },
  {
    left: {
      num: '05',
      eyebrow: 'BÖLÜM V · ATÖLYE MİMARİSİ',
      title: 'Tek Yerde Dört Dünya',
      body: 'Odak stüdyosu, gerçek çok modelli AI kokpit, GitHub vitrini ve optik mercekli fikir kasası aynı paylaşılan durum deposundan beslenir.',
      meta: 'Atelier OS · Sayı 01',
    },
    right: {
      num: '06',
      eyebrow: 'SON SÖZ',
      title: 'Üretmeye Hazır',
      body: 'Her bileşen klavye kısayolları (Ctrl+K) ve sesli ajan komutlarıyla çalışır. Fikir Kasası sekmesinden görsellerini yükleyip temiz mercekle inceleyebilirsin.',
      meta: 'existye4t · 2026',
    },
  },
];

const LANG_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  HTML: '#e34c26',
  CSS: '#563d7c',
};

export function mountPortfolio(container) {
  const gh = store.state.github;

  container.innerHTML = `
    <div class="view-header">
      <div>
        <span class="eyebrow">03 · KİNETİK VİTRİN &amp; CANLI GITHUB</span>
        <h2>Portfolyo &amp; 3D Dergi</h2>
      </div>
      <div class="header-pills">
        <span class="chip-pill" id="gh-sync-pill">${gh.live ? 'GitHub Canlı Senkron' : 'existye4t · GitHub'}</span>
        <span class="chip-pill">2D Afin Sayfa Katlama</span>
      </div>
    </div>

    <div class="portfolio-hero panel">
      <div class="hero-roll-line">
        <span class="roll-lead">Exist ·</span>
        <span class="roll-slot" id="word-roll-slot" role="button" tabindex="0" title="Kelimeyi değiştir"></span>
      </div>
      <p class="weight-wave" id="weight-wave" aria-label="Yerel çalışan hızlı araçlar, oyunlar ve sade sistemler"></p>
      <p class="scramble-line" id="scramble-line"></p>
    </div>

    <div class="portfolio-grid">
      <!-- Real GitHub Profile Card -->
      <section class="panel profile-panel">
        <div class="profile-top">
          <div class="pro-av" id="pro-av">
            <img id="gh-avatar-img" src="${escapeHtml(gh.avatar_url || './assets/github-avatar.jpg')}" alt="Exist GitHub Avatar" onerror="this.src='./assets/github-avatar.jpg'" />
          </div>
          <div>
            <h3 id="gh-name">${escapeHtml(gh.name || 'Exist')}</h3>
            <p class="pro-handle" id="gh-handle">@${escapeHtml(gh.login || 'existye4t')} · GitHub</p>
          </div>
          <button class="like-burst-btn ${store.state.likedWork ? 'liked' : ''}" id="like-burst-btn" type="button" aria-label="Beğen">
            ${svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>')}
            <span class="burst-ring" id="burst-ring"></span>
          </button>
        </div>

        <p class="pro-bio" id="gh-bio">${escapeHtml(gh.bio)}</p>

        <div class="pro-stats">
          <div><b class="drums" id="follower-drums"></b><span>Takipçi</span></div>
          <div><b id="gh-repo-count">${gh.public_repos ?? 10}</b><span>Açık Repo</span></div>
          <div><b id="gh-following-count">${gh.following ?? 2}</b><span>Takip</span></div>
        </div>

        <div class="pro-acts" id="pro-acts">
          <button class="follow-btn" id="follow-btn" type="button">
            <span class="f-bg" id="f-bg"></span>
            <span class="f-lbl a" id="f-la">Takip Et</span>
            <span class="f-lbl b" id="f-lb">Takip Ediliyor</span>
          </button>
          <button class="msg-btn" id="msg-btn" type="button">AI'a Sor</button>
        </div>

        <div class="pro-utility-row">
          <button class="magnetic-btn" id="magnetic-btn" type="button">
            <span>GitHub'ı Aç</span>
            ${svg('<path d="M7 17L17 7M7 7h10v10"/>')}
          </button>
          <button class="copy-btn" id="copy-email-btn" type="button">
            <span class="copy-lbl" id="copy-lbl">Profil Linki Kopyala</span>
          </button>
        </div>
      </section>

      <!-- Fan Cards with Editorial Photography -->
      <section class="panel fan-panel">
        <div class="panel-head">
          <div>
            <span class="panel-label">TASARIM &amp; DONANIM YELPAZESİ</span>
            <h3 class="sub-h3">Üzerine Gel &amp; Dergiye Geç</h3>
          </div>
          <span class="chip-pill">3 Katman</span>
        </div>
        <div class="fan-stage">
          <div class="fan" id="fan">
            <div class="fan-card" data-i="0" data-page="0">
              <div class="fan-art photo-art" style="background-image:url('./assets/hardware-macro.jpg')"></div>
              <span class="fan-num">01</span>
              <strong>Donanım Hassasiyeti</strong>
              <small>Darmoshark &amp; Kadran Fiziği</small>
            </div>
            <div class="fan-card" data-i="1" data-page="1">
              <div class="fan-art photo-art" style="background-image:url('./assets/studio-cover.jpg')"></div>
              <span class="fan-num">02</span>
              <strong>Kırılma &amp; Derinlik</strong>
              <small>Buzlu Cam &amp; Sıvı Alan</small>
            </div>
            <div class="fan-card" data-i="2" data-page="2">
              <div class="fan-art photo-art" style="background-image:url('./assets/architectural-light.jpg')"></div>
              <span class="fan-num">03</span>
              <strong>Yerel Araçlar</strong>
              <small>flow · exist-bw · lilium</small>
            </div>
          </div>
        </div>
      </section>

      <!-- Swipe Deck featuring Real GitHub Projects -->
      <section class="panel deck-panel">
        <div class="panel-head">
          <div>
            <span class="panel-label">EXISTYE4T PROJELERİ · DESTE</span>
            <h3 class="sub-h3">Sağa Kaydır = Kasaya Kaydet</h3>
          </div>
        </div>
        <div class="deck-stage">
          <div class="deck" id="swipe-deck"></div>
        </div>
      </section>

      <!-- Live GitHub Highlighted Repositories -->
      <section class="panel github-repos-panel">
        <div class="panel-head">
          <div>
            <span class="panel-label">ÖNE ÇIKAN GITHUB REPOLARI · github.com/${escapeHtml(gh.login || 'existye4t')}</span>
            <h3 class="sub-h3">Gerçek Projeler &amp; Kaynak Kodlar</h3>
          </div>
          <a class="btn-ghost" href="${escapeHtml(gh.html_url || 'https://github.com/existye4t')}" target="_blank" rel="noopener">
            Tüm Repolar →
          </a>
        </div>
        <div class="gh-repo-grid" id="gh-repo-grid"></div>
      </section>

      <!-- 3D Page Flip Magazine -->
      <section class="panel magazine-panel">
        <div class="panel-head">
          <div>
            <span class="panel-label">ETKİLEŞİMLİ DERGİ · #page-flip</span>
            <h3 class="sub-h3">Sağ Köşeden Tut ve Sayfayı Çevir</h3>
          </div>
          <div class="mag-controls">
            <button class="btn-ghost" id="mag-prev" type="button">← Önceki</button>
            <span class="chip-pill" id="mag-indicator">Sayfa 1 / 3</span>
            <button class="btn-ghost" id="mag-next" type="button">Sonraki →</button>
          </div>
        </div>

        <div class="book-stage">
          <div class="book" id="flip-book">
            <div class="book-base">
              <div class="book-half left" id="book-left"></div>
              <div class="book-half right" id="book-right"></div>
              <div class="book-spine"></div>
            </div>
            <div class="book-turn-front" id="book-turn-front" hidden></div>
            <div class="book-turn-flap" id="book-turn-flap" hidden></div>
            <div class="book-corner-hint" id="book-corner-hint">Köşeyi çek</div>
          </div>
        </div>
      </section>
    </div>
  `;

  // ---- GitHub Live Data Renderer ----
  const ghSyncPill = container.querySelector('#gh-sync-pill');
  const ghAvatar = container.querySelector('#gh-avatar-img');
  const ghName = container.querySelector('#gh-name');
  const ghHandle = container.querySelector('#gh-handle');
  const ghBio = container.querySelector('#gh-bio');
  const ghRepoCount = container.querySelector('#gh-repo-count');
  const ghFollowingCount = container.querySelector('#gh-following-count');
  const ghRepoGrid = container.querySelector('#gh-repo-grid');

  function renderGithubSection(data) {
    ghSyncPill.textContent = data.live ? 'GitHub Canlı Senkron ✓' : 'existye4t · GitHub';
    ghAvatar.src = data.avatar_url || './assets/github-avatar.jpg';
    ghName.textContent = data.name || 'Exist';
    ghHandle.textContent = `@${data.login || 'existye4t'} · GitHub`;
    if (data.bio) ghBio.textContent = data.bio;
    ghRepoCount.textContent = String(data.public_repos ?? 10);
    ghFollowingCount.textContent = String(data.following ?? 2);

    const priorityOrder = ['flow', 'erenin-yatagi', 'exist-bw', 'darmoshark-packages', 'skin-fixer', 'lilium', 'lol-skin-finder', 'exist-lol-manager'];
    const sorted = [...(data.repos || [])].sort((a, b) => {
      const ia = priorityOrder.indexOf(a.name);
      const ib = priorityOrder.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    ghRepoGrid.innerHTML = sorted
      .slice(0, 6)
      .map(rp => {
        const lang = rp.language || 'Code';
        const dotColor = LANG_COLORS[lang] || '#9a9aa4';
        return `
        <a class="gh-repo-card" href="${escapeHtml(rp.html_url)}" target="_blank" rel="noopener">
          <div class="gh-rc-top">
            <strong>${escapeHtml(rp.name)}</strong>
            <span class="gh-rc-stars">★ ${rp.stargazers_count || 0}</span>
          </div>
          <p>${escapeHtml(rp.description || `${rp.name} · @existye4t açık kaynak deposu`)}</p>
          <div class="gh-rc-foot">
            <span class="gh-lang"><i style="background:${dotColor}"></i>${escapeHtml(lang)}</span>
            <span class="gh-open">Repoyu Aç ↗</span>
          </div>
        </a>
      `;
      })
      .join('');
  }

  renderGithubSection(store.state.github);
  store.on('github', data => {
    renderGithubSection(data);
    animateDrumsTo(store.state.followers);
  });

  // ---- 1. Word Roll ----
  const rollSlot = container.querySelector('#word-roll-slot');
  const ROLL_WORDS = ['Web Araçları', 'Piksel Oyunlar', 'Linux Paketleri', 'Sade Arayüzler'];
  let rollIdx = 0;
  const rollWidth = S(180, 320, 30);
  const liveWords = [];

  function makeRollWord(text, initialOffset) {
    const el = document.createElement('span');
    el.className = 'roll-word';
    const letters = [...text].map(ch => {
      const span = document.createElement('span');
      span.className = 'roll-ch';
      span.textContent = ch;
      el.appendChild(span);
      return { el: span, s: S(initialOffset, 420, 26) };
    });
    rollSlot.appendChild(el);
    return { el, letters };
  }

  function advanceWord(nextIdx) {
    const prev = liveWords[liveWords.length - 1];
    if (prev) {
      prev.letters.forEach((l, k) => after(k * 0.022, () => { l.s.t = -1; }));
      after(0.65, () => {
        prev.el.remove();
        const i = liveWords.indexOf(prev);
        if (i > -1) liveWords.splice(i, 1);
      });
    }
    const nextWord = makeRollWord(ROLL_WORDS[nextIdx], 1);
    liveWords.push(nextWord);
    requestAnimationFrame(() => {
      rollWidth.t = nextWord.el.scrollWidth + 18;
    });
    nextWord.letters.forEach((l, k) => after(0.05 + k * 0.024, () => { l.s.t = 0; }));
  }

  const firstWord = makeRollWord(ROLL_WORDS[0], 0);
  liveWords.push(firstWord);
  requestAnimationFrame(() => {
    rollWidth.x = rollWidth.t = firstWord.el.scrollWidth + 18;
  });

  const cycleRoll = () => {
    rollIdx = (rollIdx + 1) % ROLL_WORDS.length;
    advanceWord(rollIdx);
  };
  rollSlot.addEventListener('click', () => {
    cycleRoll();
    sound.tickSound(0.6);
  });
  let rollTimer = setInterval(() => {
    if (!document.hidden && store.state.activeView === 'portfolio') cycleRoll();
  }, 4200);

  // ---- 2. Weight Wave (Gaussian bell across cursor with preserved whitespace) ----
  const waveEl = container.querySelector('#weight-wave');
  const WAVE_TEXT = 'Yerel çalışan hızlı araçlar, oyunlar ve sade sistemler';
  const LIGHT_W = 300;
  const BOLD_W = 820;
  const SPREAD = 0.14;
  const waveFocus = S(-0.1, 150, 22);
  let waveHover = false;
  let waveClock = 0;

  const waveLetters = [...WAVE_TEXT].map(ch => {
    const s = document.createElement('span');
    s.className = 'wch';
    s.textContent = ch;
    waveEl.appendChild(s);
    return { el: s, w: S(LIGHT_W, 280, 24) };
  });

  waveEl.addEventListener('pointermove', e => {
    waveHover = true;
    const r = waveEl.getBoundingClientRect();
    waveFocus.t = clamp((e.clientX - r.left) / Math.max(1, r.width), -0.05, 1.05);
  });
  waveEl.addEventListener('pointerleave', () => {
    waveHover = false;
    waveFocus.t = 0.25;
  });

  // ---- 3. Scramble Text ----
  const scrambleEl = container.querySelector('#scramble-line');
  const SCRAMBLES = [
    '01 // flow & exist-bw · Hızlı, yerel ve gizlilik odaklı',
    '02 // erenin-yatagi & lilium · Canvas, ses ve piksel dünyalar',
    '03 // darmoshark & skin-fixer · Donanım, Linux ve pratik araçlar',
  ];
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
  let scrIdx = 0;
  let scrCells = [];
  let scrClock = 0;

  function runScramble(target) {
    scrambleEl.innerHTML = '';
    scrCells = [...target].map((ch, i) => {
      const sp = document.createElement('span');
      sp.className = 'sc';
      sp.textContent = ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      scrambleEl.appendChild(sp);
      return {
        el: sp,
        to: ch,
        done: ch === ' ',
        at: 0.22 + i * 0.025 + Math.random() * 0.05,
        tick: 0,
      };
    });
    scrClock = 0;
    window.Motion?.wake?.();
  }
  runScramble(SCRAMBLES[0]);
  scrambleEl.addEventListener('click', () => {
    scrIdx = (scrIdx + 1) % SCRAMBLES.length;
    runScramble(SCRAMBLES[scrIdx]);
  });

  // ---- 4. Profile Card (Fixed Digit Drums + Follow/Msg Morph + Magnetic/Copy/Like) ----
  const followerDrums = container.querySelector('#follower-drums');
  const followBtn = container.querySelector('#follow-btn');
  const fBg = container.querySelector('#f-bg');
  const fLa = container.querySelector('#f-la');
  const fLb = container.querySelector('#f-lb');
  const msgBtn = container.querySelector('#msg-btn');
  const proActs = container.querySelector('#pro-acts');
  const proAv = container.querySelector('#pro-av');

  let cachedActsWidth = proActs.offsetWidth || 260;
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (proActs.offsetWidth > 0) cachedActsWidth = proActs.offsetWidth;
    }).observe(proActs);
  }

  let drums = [];
  function setupDrums(numVal) {
    const cleanNum = Math.max(0, Math.round(Number(numVal) || 0));
    const str = cleanNum.toLocaleString('en-US');
    followerDrums.innerHTML = '';
    drums = [...str].map(ch => {
      if (ch === ',') {
        const sep = document.createElement('span');
        sep.className = 'dg-sep';
        sep.textContent = ',';
        followerDrums.appendChild(sep);
        return null;
      }
      const d = Number(ch);
      const wrap = document.createElement('span');
      wrap.className = 'dg';
      const col = document.createElement('span');
      col.className = 'dg-col';
      for (let n = 0; n <= 10; n++) {
        const i = document.createElement('span');
        i.className = 'dg-digit';
        i.textContent = String(n % 10);
        col.appendChild(i);
      }
      wrap.appendChild(col);
      followerDrums.appendChild(wrap);
      return { col, s: S(d, 260, 22), cur: d };
    });
  }

  function animateDrumsTo(numVal) {
    const cleanNum = Math.max(0, Math.round(Number(numVal) || 0));
    const digits = [...String(cleanNum)].map(Number);
    const activeDrums = drums.filter(Boolean);
    if (digits.length !== activeDrums.length) {
      setupDrums(cleanNum);
      return;
    }
    digits.forEach((d, k) => {
      const drum = activeDrums[k];
      after((digits.length - 1 - k) * 0.055, () => {
        let diff = ((d - drum.cur) % 10 + 10) % 10;
        if (diff > 5) diff -= 10;
        drum.s.t = drum.cur + diff;
        drum.cur = d;
      });
    });
  }

  setupDrums(store.state.followers);
  const followS = S(store.state.following ? 1 : 0, 300, 22);
  const avPop = S(1, 520, 14);

  followBtn.addEventListener('click', () => {
    store.state.following = !store.state.following;
    store.state.followers = Math.max(0, store.state.followers + (store.state.following ? 1 : -1));
    store.persist();
    followS.t = store.state.following ? 1 : 0;
    avPop.v = 2.6;
    animateDrumsTo(store.state.followers);
    sound.chime(store.state.following ? 659 : 440);
  });

  msgBtn.addEventListener('click', () => {
    store.setView('ai');
    store.emit('ai-focus-input');
  });

  const magBtn = container.querySelector('#magnetic-btn');
  const magX = S(0, 360, 22);
  const magY = S(0, 360, 22);
  magBtn.addEventListener('pointermove', e => {
    const r = magBtn.getBoundingClientRect();
    magX.t = clamp((e.clientX - (r.left + r.width / 2)) * 0.35, -14, 14);
    magY.t = clamp((e.clientY - (r.top + r.height / 2)) * 0.35, -10, 10);
  });
  magBtn.addEventListener('pointerleave', () => {
    magX.t = 0;
    magY.t = 0;
  });
  magBtn.addEventListener('click', () => {
    window.open(store.state.github.html_url || 'https://github.com/existye4t', '_blank', 'noopener');
  });

  const copyBtn = container.querySelector('#copy-email-btn');
  const copyLbl = container.querySelector('#copy-lbl');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(store.state.github.html_url || 'https://github.com/existye4t');
    } catch { /* ignore */ }
    copyLbl.textContent = '✓ Kopyalandı';
    copyBtn.classList.add('copied');
    sound.chime(740);
    setTimeout(() => {
      copyLbl.textContent = 'Profil Linki Kopyala';
      copyBtn.classList.remove('copied');
    }, 1800);
  });

  const likeBtn = container.querySelector('#like-burst-btn');
  const burstRing = container.querySelector('#burst-ring');
  const likeS = S(1, 520, 16);
  likeBtn.addEventListener('click', () => {
    store.state.likedWork = !store.state.likedWork;
    store.persist();
    likeBtn.classList.toggle('liked', store.state.likedWork);
    likeS.v = 4.2;
    if (store.state.likedWork) {
      burstRing.classList.remove('pop');
      void burstRing.offsetWidth;
      burstRing.classList.add('pop');
      sound.chime(880);
    }
  });

  // ---- 5. Fan Cards ----
  const fanEl = container.querySelector('#fan');
  const fanCards = [...fanEl.querySelectorAll('.fan-card')].map((el, i) => ({
    el,
    i,
    lift: S(0, 420, 20),
    sc: S(1, 420, 22),
  }));
  const fanSpread = S(0, 220, 18);

  fanEl.addEventListener('pointerenter', () => { fanSpread.t = 1; });
  fanEl.addEventListener('pointerleave', () => {
    fanSpread.t = 0;
    fanCards.forEach(c => { c.lift.t = 0; c.sc.t = 1; });
  });

  fanCards.forEach(c => {
    c.el.addEventListener('pointerenter', () => {
      fanSpread.t = 1;
      c.lift.t = -22;
      c.sc.t = 1.06;
      c.el.style.zIndex = '6';
    });
    c.el.addEventListener('pointerleave', () => {
      c.lift.t = 0;
      c.sc.t = 1;
      c.el.style.zIndex = String(c.i + 1);
    });
    c.el.addEventListener('click', () => {
      c.lift.v = -240;
      const targetPage = Number(c.el.dataset.page);
      setMagPage(targetPage);
      sound.tickSound(0.8);
    });
  });

  // ---- 6. Swipe Deck ----
  const deckEl = container.querySelector('#swipe-deck');
  const DECK_TH = 105;
  const deckCards = DECK_WORKS.map((w, i) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'deck-card';
    const artStyle = w.cover
      ? `style="background-image:url('${w.cover}');background-size:cover;background-position:center;"`
      : `data-av="${w.av}"`;
    cardEl.innerHTML = `
      <div class="deck-art" ${artStyle}>
        <span class="deck-stamp save">KAYDET</span>
        <span class="deck-stamp skip">GEÇ</span>
      </div>
      <div class="deck-body">
        <span class="deck-tag">${w.tag}</span>
        <h4>${w.title}</h4>
        <p>${w.desc}</p>
      </div>
    `;
    deckEl.appendChild(cardEl);
    return {
      work: w,
      el: cardEl,
      save: cardEl.querySelector('.deck-stamp.save'),
      skip: cardEl.querySelector('.deck-stamp.skip'),
      x: S(0, 280, 16),
      y: S(0, 280, 16),
      d: S(i, 260, 22),
      grabSign: 1,
      flying: false,
    };
  });

  const deckOrder = [...deckCards];
  let activeDrag = null;
  let startX = 0;
  let startY = 0;
  let lastDragX = 0;
  let dragVx = 0;

  function bindTopCard() {
    deckCards.forEach(c => { c.el.onpointerdown = null; });
    const top = deckOrder[0];
    if (!top) return;
    top.el.onpointerdown = e => {
      if (top.flying) return;
      activeDrag = top;
      const r = top.el.getBoundingClientRect();
      top.grabSign = e.clientY < r.top + r.height / 2 ? 1 : -1;
      startX = e.clientX;
      startY = e.clientY;
      lastDragX = e.clientX;
      dragVx = 0;
      top.x.k = 900;
      top.x.c = 50;
      top.y.k = 900;
      top.y.c = 50;
      top.el.classList.add('dragging');
      top.el.setPointerCapture(e.pointerId);
    };
  }
  bindTopCard();

  window.addEventListener('pointermove', e => {
    if (!activeDrag) return;
    dragVx = (e.clientX - lastDragX) * 40;
    lastDragX = e.clientX;
    activeDrag.x.t = e.clientX - startX;
    activeDrag.y.t = e.clientY - startY;
  });

  function releaseDeckCard() {
    if (!activeDrag) return;
    const c = activeDrag;
    activeDrag = null;
    c.el.classList.remove('dragging');
    if (Math.abs(c.x.x) > DECK_TH || Math.abs(dragVx) > 420) {
      const sign = Math.sign(c.x.x || dragVx || 1);
      c.flying = true;
      c.x.k = 180;
      c.x.c = 22;
      c.x.t = sign * 520;
      c.y.t = c.y.x + 40;

      if (sign > 0) {
        sound.chime(698.46);
        store.addVaultItem({
          title: c.work.title,
          subtitle: c.work.tag,
          tag: 'github',
          av: c.work.av,
          imageData: c.work.cover || null,
          badge: 'GitHub Kaydı',
          body: `${c.work.desc} (${c.work.url})`,
          highlight: `${c.work.title} · GitHub vitrininden kaydedildi.`,
        });
      } else {
        sound.tickSound(0.6);
      }

      after(0.32, () => {
        c.flying = false;
        c.x.x = c.x.t = 0;
        c.y.x = c.y.t = 0;
        const idx = deckOrder.indexOf(c);
        if (idx > -1) {
          deckOrder.splice(idx, 1);
          deckOrder.push(c);
        }
        deckOrder.forEach((card, pos) => { card.d.t = pos; });
        c.d.x = deckOrder.length - 1;
        bindTopCard();
      });
    } else {
      c.x.k = 280;
      c.x.c = 16;
      c.y.k = 280;
      c.y.c = 16;
      c.x.t = 0;
      c.y.t = 0;
    }
  }
  window.addEventListener('pointerup', releaseDeckCard);
  window.addEventListener('pointercancel', releaseDeckCard);

  // ---- 7. 2D Affine Reflection Matrix Page Flip Magazine ----
  const book = container.querySelector('#flip-book');
  const bookLeft = container.querySelector('#book-left');
  const bookRight = container.querySelector('#book-right');
  const turnFront = container.querySelector('#book-turn-front');
  const turnFlap = container.querySelector('#book-turn-flap');
  const cornerHint = container.querySelector('#book-corner-hint');
  const magIndicator = container.querySelector('#mag-indicator');
  const magPrev = container.querySelector('#mag-prev');
  const magNext = container.querySelector('#mag-next');

  let spreadIdx = 0;
  let turning = null;

  function renderPageMarkup(page, side) {
    return `
      <div class="mag-page ${side}">
        <div class="mag-page-top">
          <span>${page.eyebrow}</span>
          <b>${page.num}</b>
        </div>
        <h4>${page.title}</h4>
        <p>${page.body}</p>
        <div class="mag-page-foot"><code>${page.meta}</code></div>
      </div>
    `;
  }

  function renderSpread() {
    const sp = MAGAZINE_PAGES[spreadIdx];
    bookLeft.innerHTML = renderPageMarkup(sp.left, 'is-left');
    bookRight.innerHTML = renderPageMarkup(sp.right, 'is-right');
    magIndicator.textContent = `Sayfa ${spreadIdx + 1} / ${MAGAZINE_PAGES.length}`;
    magPrev.disabled = spreadIdx === 0;
    magNext.disabled = spreadIdx === MAGAZINE_PAGES.length - 1;
  }

  function setMagPage(idx) {
    const clamped = clamp(idx, 0, MAGAZINE_PAGES.length - 1);
    if (clamped === spreadIdx) return;
    spreadIdx = clamped;
    renderSpread();
  }

  function clipPolygon(poly, m, n, keepPositive) {
    const out = [];
    const signed = p => ((p.x - m.x) * n.x + (p.y - m.y) * n.y) * (keepPositive ? 1 : -1);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = signed(a);
      const db = signed(b);
      if (da <= 0) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const t = da / (da - db);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    return out;
  }

  function updateFlipGeometry(atX, atY) {
    if (!turning) return;
    const W = book.clientWidth;
    const H = book.clientHeight;
    const halfW = W / 2;

    const corner = { x: W, y: H };
    let dx = atX - corner.x;
    let dy = atY - corner.y;
    if (Math.hypot(dx, dy) < 4) return;
    if (atX > W - 2) dx = -2;

    const l = Math.hypot(dx, dy);
    const n = { x: dx / l, y: dy / l };
    const m = { x: corner.x + dx * 0.5, y: corner.y + dy * 0.5 };

    const pageBox = [
      { x: halfW, y: 0 },
      { x: W, y: 0 },
      { x: W, y: H },
      { x: halfW, y: H },
    ];

    const frontPoly = clipPolygon(pageBox, m, n, false);
    const flapPoly = clipPolygon(pageBox, m, n, true);

    const a = 1 - 2 * n.x * n.x;
    const bc = -2 * n.x * n.y;
    const dd = 1 - 2 * n.y * n.y;
    const k = 2 * (m.x * n.x + m.y * n.y);
    const bx = k * n.x;
    const by = k * n.y;
    const x0 = halfW;
    const e = a * x0 + bx - x0;
    const f = bc * x0 + by;

    const toClip = pts =>
      pts.length < 3
        ? 'polygon(0 0, 0 0, 0 0)'
        : `polygon(${pts.map(p => `${((p.x - halfW) / halfW * 100).toFixed(2)}% ${(p.y / H * 100).toFixed(2)}%`).join(',')})`;

    turnFront.style.clipPath = toClip(frontPoly);
    turnFlap.style.clipPath = toClip(flapPoly);
    turnFlap.style.transform = `matrix(${a.toFixed(4)}, ${bc.toFixed(4)}, ${bc.toFixed(4)}, ${dd.toFixed(4)}, ${e.toFixed(2)}, ${f.toFixed(2)})`;
  }

  book.addEventListener('pointerdown', e => {
    if (spreadIdx >= MAGAZINE_PAGES.length - 1) return;
    const r = book.getBoundingClientRect();
    const lx = e.clientX - r.left;
    const ly = e.clientY - r.top;
    if (lx < r.width * 0.55) return;

    const nextSp = MAGAZINE_PAGES[spreadIdx + 1];
    const currSp = MAGAZINE_PAGES[spreadIdx];
    turning = { lx, ly };
    cornerHint.style.opacity = '0';
    bookRight.innerHTML = renderPageMarkup(nextSp.right, 'is-right');
    turnFront.innerHTML = renderPageMarkup(currSp.right, 'is-right');
    turnFlap.innerHTML = renderPageMarkup(nextSp.left, 'is-left');
    turnFront.hidden = false;
    turnFlap.hidden = false;
    book.setPointerCapture(e.pointerId);
    updateFlipGeometry(lx, ly);
  });

  book.addEventListener('pointermove', e => {
    if (!turning) return;
    const r = book.getBoundingClientRect();
    turning.lx = clamp(e.clientX - r.left, 0, r.width);
    turning.ly = clamp(e.clientY - r.top, 0, r.height);
    updateFlipGeometry(turning.lx, turning.ly);
  });

  const finishBookTurn = () => {
    if (!turning) return;
    const W = book.clientWidth;
    const passed = turning.lx < W * 0.52;
    turning = null;
    turnFront.hidden = true;
    turnFlap.hidden = true;
    cornerHint.style.opacity = '1';
    if (passed && spreadIdx < MAGAZINE_PAGES.length - 1) {
      spreadIdx += 1;
      sound.tickSound(0.9);
    }
    renderSpread();
  };
  book.addEventListener('pointerup', finishBookTurn);
  book.addEventListener('pointercancel', finishBookTurn);

  magPrev.addEventListener('click', () => { setMagPage(spreadIdx - 1); sound.tickSound(0.6); });
  magNext.addEventListener('click', () => { setMagPage(spreadIdx + 1); sound.tickSound(0.6); });
  store.on('portfolio-mag-page', idx => setMagPage(Number(idx) || 0));
  renderSpread();

  // ---- Active-only rAF simulation loop (Zero CPU when idle or hidden) ----
  const isSettled = (s, eps = 0.002) => Math.abs(s.x - s.t) < eps && Math.abs(s.v) < eps;
  let lastPortfolioIdle = false;

  register({
    active: () => store.state.activeView === 'portfolio',
    running: () => scrCells.some(c => !c.done),
    frame(dt) {
      scrClock += dt;
      step(rollWidth, dt);
      liveWords.forEach(w => w.letters.forEach(l => step(l.s, dt)));

      step(waveFocus, dt);
      const nWave = Math.max(1, waveLetters.length - 1);
      waveLetters.forEach((l, i) => {
        const c = i / nWave;
        const d = (c - waveFocus.x) / SPREAD;
        const g = Math.exp(-d * d);
        l.w.t = LIGHT_W + (BOLD_W - LIGHT_W) * g;
        step(l.w, dt);
      });

      step(followS, dt);
      step(avPop, dt);
      drums.forEach(d => d && step(d.s, dt));
      step(magX, dt);
      step(magY, dt);
      step(likeS, dt);

      step(fanSpread, dt);
      fanCards.forEach(c => { step(c.lift, dt); step(c.sc, dt); });
      deckCards.forEach(c => { step(c.x, dt); step(c.y, dt); step(c.d, dt); });
    },
    render() {
      const hasScramble = scrCells.some(c => !c.done);
      const settled =
        !hasScramble &&
        isSettled(rollWidth, 0.1) &&
        liveWords.every(w => w.letters.every(l => isSettled(l.s))) &&
        isSettled(waveFocus) &&
        waveLetters.every(l => isSettled(l.w, 1)) &&
        isSettled(followS) &&
        isSettled(avPop) &&
        drums.every(d => !d || isSettled(d.s)) &&
        isSettled(magX, 0.05) &&
        isSettled(magY, 0.05) &&
        isSettled(likeS) &&
        isSettled(fanSpread) &&
        fanCards.every(c => isSettled(c.lift, 0.05) && isSettled(c.sc)) &&
        deckCards.every(c => isSettled(c.x, 0.1) && isSettled(c.y, 0.1) && isSettled(c.d));

      if (settled && lastPortfolioIdle) return;
      lastPortfolioIdle = settled;

      rollSlot.style.width = `${Math.max(80, rollWidth.x).toFixed(1)}px`;
      liveWords.forEach(w => {
        w.letters.forEach(l => {
          l.el.style.transform = `translateY(${(l.s.x * 105).toFixed(1)}%)`;
          l.el.style.opacity = clamp(1 - Math.abs(l.s.x) * 0.9, 0, 1).toFixed(3);
        });
      });

      waveLetters.forEach(l => {
        const wRound = String(Math.round(clamp(l.w.x, 100, 900) / 10) * 10);
        if (l.lastW !== wRound) {
          l.lastW = wRound;
          l.el.style.fontWeight = wRound;
          l.el.style.opacity = (0.48 + 0.52 * clamp((l.w.x - LIGHT_W) / (BOLD_W - LIGHT_W), 0, 1)).toFixed(3);
        }
      });

      scrCells.forEach(c => {
        if (c.done) return;
        if (scrClock >= c.at) {
          c.done = true;
          c.el.textContent = c.to;
          c.el.classList.add('ok');
        } else if (scrClock >= c.tick) {
          c.el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          c.tick = scrClock + 0.055;
        }
      });

      const T = cachedActsWidth || 260;
      const half = (T - 8) / 2;
      const q = clamp(followS.x, 0, 1);
      followBtn.style.width = `${(T + (half - T) * followS.x).toFixed(2)}px`;
      fBg.style.opacity = fLa.style.opacity = (1 - q).toFixed(3);
      fLa.style.transform = `translateY(${(-q * 12).toFixed(2)}px)`;
      fLb.style.opacity = q.toFixed(3);
      fLb.style.transform = `translateY(${((1 - q) * 12).toFixed(2)}px)`;
      msgBtn.style.width = `${half.toFixed(2)}px`;
      msgBtn.style.opacity = q.toFixed(3);
      msgBtn.style.transform = `translateX(${((1 - followS.x) * 20).toFixed(2)}px) scale(${(0.9 + 0.1 * q).toFixed(4)})`;
      msgBtn.style.pointerEvents = q > 0.4 ? 'auto' : 'none';

      proAv.style.transform = `scale(${clamp(avPop.x, 0.85, 1.18).toFixed(4)})`;
      drums.forEach(d => {
        if (!d) return;
        const pos = ((d.s.x % 10) + 10) % 10;
        d.col.style.transform = `translateY(${(-(pos * 100) / 11).toFixed(3)}%)`;
      });

      magBtn.style.transform = `translate(${magX.x.toFixed(2)}px, ${magY.x.toFixed(2)}px)`;
      likeBtn.style.transform = `scale(${clamp(likeS.x, 0.85, 1.35).toFixed(4)})`;

      const spread = 78;
      fanCards.forEach(c => {
        const d = c.i - 1;
        const x = d * (6 + fanSpread.x * (spread - 6));
        const r = d * (3 + fanSpread.x * 9);
        const y = Math.abs(d) * fanSpread.x * 12 + c.lift.x;
        c.el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${c.sc.x.toFixed(4)})`;
      });

      const top = deckOrder[0];
      const p = top && !top.flying ? clamp(Math.abs(top.x.x) / (DECK_TH * 1.6), 0, 1) : 0;
      deckCards.forEach(c => {
        const isTop = c === top;
        const depth = Math.max(0, c.d.x - (isTop || c.flying ? 0 : p));
        const sc = 1 - Math.min(depth, 3) * 0.055;
        const dy = Math.min(depth, 3) * 15;
        c.el.style.transform = `translate(${c.x.x.toFixed(1)}px, ${(c.y.x + dy).toFixed(1)}px) rotate(${(c.x.x * 0.065 * c.grabSign).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        c.el.style.opacity = clamp(3.6 - depth, 0, 1).toFixed(3);
        c.el.style.filter = depth > 0.01 ? `brightness(${(1 - Math.min(depth, 3) * 0.2).toFixed(3)})` : '';
        c.el.style.zIndex = c.flying ? '50' : String(40 - Math.round(c.d.t));
        c.save.style.opacity = isTop || c.flying ? clamp(c.x.x / DECK_TH, 0, 1).toFixed(2) : '0';
        c.skip.style.opacity = isTop || c.flying ? clamp(-c.x.x / DECK_TH, 0, 1).toFixed(2) : '0';
      });
    },
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
