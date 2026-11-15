/**
 * Unified reactive store for Atelier OS across all 4 spaces (Studio, AI, Portfolio, Vault).
 */
const STORAGE_KEY = 'atelier-os-state-v3';

const DEFAULT_STATE = {
  theme: 'dark',
  activeView: 'studio',
  exposure: 0.35,
  dialMix: 44,
  soundTrack: 0,
  playing: false,
  pomodoro: {
    running: false,
    secondsLeft: 25 * 60,
    duration: 25 * 60,
    completedSessions: 3,
  },
  tasks: [
    { id: 't1', text: 'Motion Studies yay sabitlerini projeye bağla', done: true },
    { id: 't2', text: 'Web Audio yağmur + lo-fi ses motorunu ayarla', done: false },
    { id: 't3', text: 'Portfolyo & GitHub vitrin kartlarını kontrol et', done: false },
    { id: 't4', text: 'Fikir Kasasına yeni referans görseller bırak', done: false },
  ],
  aiRuns: 14,
  aiConfig: {
    provider: 'opencode',
    model: 'mimo-v2.6-flash-free',
    effort: 'high',
    agentMode: 'build',
    autoFallback: true,
    baseUrl: 'https://api.openai.com/v1',
    apiKeys: {
      opencode: '',
      browser: '',
      pollinations: '',
      llm7: '',
      groq: '',
      gemini: '',
      openai: '',
      openrouter: '',
      anthropic: '',
      custom: '',
    },
    autoExecute: true,
    autoSendVoice: true,
    ttsReply: false,
  },
  chatHistory: [],
  github: {
    login: 'existye4t',
    name: 'Exist',
    avatar_url: './assets/github-avatar.jpg',
    html_url: 'https://github.com/existye4t',
    bio: 'Yerel-öncelikli web araçları, Linux donanım/paket yazılımları, piksel oyunlar ve akışkan arayüz sistemleri.',
    public_repos: 10,
    followers: 0,
    following: 2,
    live: false,
    repos: [
      {
        name: 'flow',
        html_url: 'https://github.com/existye4t/flow',
        description: 'Windows için klavye-odaklı hızlı başlatıcı ve dahili ekran görüntüsü aracı.',
        language: 'TypeScript',
        stargazers_count: 0,
      },
      {
        name: 'erenin-yatagi',
        html_url: 'https://github.com/existye4t/erenin-yatagi',
        description: '25 kısım, 70 bölümlük saf Vanilla JS, Canvas & Web Audio retro piksel simülasyon oyunu.',
        language: 'JavaScript',
        stargazers_count: 0,
      },
      {
        name: 'exist-bw',
        html_url: 'https://github.com/existye4t/exist-bw',
        description: 'Tarayıcı içinde tamamen yerel çalışan gizlilik odaklı siyah-beyaz fotoğraf dönüştürücü.',
        language: 'TypeScript',
        stargazers_count: 0,
      },
      {
        name: 'darmoshark-packages',
        html_url: 'https://github.com/existye4t/darmoshark-packages',
        description: 'Darmoshark Linux için imzalı pacman paketleri ve HID donanım araçları.',
        language: 'Python',
        stargazers_count: 0,
      },
      {
        name: 'skin-fixer',
        html_url: 'https://github.com/existye4t/skin-fixer',
        description: 'cslol-go Skin Fixer tarayıcı portu: .fantome dosyalarını yerel olarak düzeltir.',
        language: 'TypeScript',
        stargazers_count: 0,
      },
      {
        name: 'lilium',
        html_url: 'https://github.com/existye4t/lilium',
        description: 'Etkileşimli botanik & ışık simülasyonu.',
        language: 'HTML',
        stargazers_count: 0,
      },
    ],
  },
  followers: 0,
  following: false,
  likedWork: false,
  vaultTags: ['motion', 'photo', 'hardware', 'glass', 'ai-ux'],
  vaultItems: [
    {
      id: 'v0',
      title: 'Prizmatik Işık & Yivli Cam',
      subtitle: 'Fotoğraf Etüdü · 2.45x Mercek İncelemesi',
      tag: 'photo',
      av: 6,
      kind: 'visual',
      badge: 'Fotoğraf',
      imageData: './assets/architectural-light.jpg',
      body: 'Yivli mimari camdan süzülen prizmatik ışık huzmeleri; optik büyüteç altında kromatik ayrışma ve mikro kontrast detaylarını incelemek için idealdir.',
      highlight: 'Saf fotoğraf modunda yazılar gizlenir ve mercek tamamen netleşir.',
      createdAt: 'Bugün',
    },
    {
      id: 'v_hw',
      title: 'CNC Anodize Kadran Makrosu',
      subtitle: 'Donanım Referansı · #hardware',
      tag: 'hardware',
      av: 4,
      kind: 'visual',
      badge: 'Makro',
      imageData: './assets/hardware-macro.jpg',
      body: 'Bazalt taş üzerinde tırtıllı mat siyah CNC alüminyum döner kadran ve zümrüt yeşili LED çentiği. Odak Stüdyosundaki 270° kadran hissiyatının donanım karşılığı.',
      highlight: 'Braun çizgisinde dokunsal metal işçiliği.',
      createdAt: 'Bugün',
    },
    {
      id: 'v1',
      title: 'Sıvı İnteraksiyon Notu',
      subtitle: 'SVG feColorMatrix · #db-goo-menu',
      tag: 'motion',
      av: 2,
      kind: 'note',
      badge: 'Spring 230/15',
      body: 'Yüksek kontrastlı alpha matrisi (22 -10) ile bulanıklaştırılmış daireler birbirine yaklaşınca sıvı gibi birleşir. Hız vektörüne göre ölçek sıkıştırması eklemek canlılık hissini ikiye katlar.',
      highlight: 'Yüksek kontrastlı alpha matrisi ile sıvı birleşme fiziği.',
      createdAt: 'Dün · 00:42',
    },
    {
      id: 'v3',
      title: '2D Afin Sayfa Katlama',
      subtitle: 'Yansıma Matrisi · #page-flip',
      tag: 'glass',
      av: 8,
      kind: 'code',
      badge: 'Matris 2x3',
      body: 'Köşe ile imleç arasındaki dik orta doğruyu bükülme ekseni kabul edip 2D yansıma matrisi uygular; böylece dergi sayfası gerçek zamanlı olarak kıvrılır.',
      highlight: 'Gerçek zamanlı 2D yansıma matrisi ile 3D sayfa kıvrımı.',
      createdAt: 'Dün · 19:08',
    },
  ],
};

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      pomodoro: { ...DEFAULT_STATE.pomodoro, ...(parsed.pomodoro || {}) },
      aiConfig: {
        ...DEFAULT_STATE.aiConfig,
        ...(parsed.aiConfig || {}),
        apiKeys: {
          ...DEFAULT_STATE.aiConfig.apiKeys,
          ...((parsed.aiConfig && parsed.aiConfig.apiKeys) || {}),
        },
      },
      github: { ...DEFAULT_STATE.github, ...(parsed.github || {}) },
      chatHistory: Array.isArray(parsed.chatHistory) ? parsed.chatHistory : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(DEFAULT_STATE.tasks),
      vaultItems: Array.isArray(parsed.vaultItems) ? parsed.vaultItems : structuredClone(DEFAULT_STATE.vaultItems),
      vaultTags: Array.isArray(parsed.vaultTags) ? parsed.vaultTags : structuredClone(DEFAULT_STATE.vaultTags),
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

class Store {
  constructor() {
    this.state = loadInitial();
    this.listeners = new Map();
    document.documentElement.dataset.theme = this.state.theme;
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* ignore quota limits */
    }
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (set) set.forEach(fn => fn(payload, this.state));
    const any = this.listeners.get('*');
    if (any) any.forEach(fn => fn(event, payload, this.state));
  }

  async hydrateGithub() {
    try {
      let data = null;
      const res = await fetch('/api/github').catch(() => null);
      if (res && res.ok) {
        data = await res.json();
      } else {
        // Static hosting (GitHub Pages) direct GitHub API fallback
        const [pRes, rRes] = await Promise.all([
          fetch('https://api.github.com/users/existye4t'),
          fetch('https://api.github.com/users/existye4t/repos?sort=updated&per_page=15'),
        ]);
        if (pRes.ok) {
          const profile = await pRes.json();
          const repos = rRes.ok ? await rRes.json() : DEFAULT_STATE.github.repos;
          data = { profile, repos, live: true };
        }
      }
      if (data?.profile?.login) {
        const prevFollowers = this.state.github.followers || 0;
        this.state.github = {
          login: data.profile.login,
          name: data.profile.name || 'Exist',
          avatar_url: data.profile.avatar_url || './assets/github-avatar.jpg',
          html_url: data.profile.html_url || 'https://github.com/existye4t',
          bio: data.profile.bio || DEFAULT_STATE.github.bio,
          public_repos: data.profile.public_repos ?? 10,
          followers: data.profile.followers ?? 0,
          following: data.profile.following ?? 2,
          live: Boolean(data.live),
          repos: Array.isArray(data.repos) && data.repos.length ? data.repos : DEFAULT_STATE.github.repos,
        };
        if (this.state.followers === prevFollowers) {
          this.state.followers = this.state.github.followers + (this.state.following ? 1 : 0);
        }
        this.persist();
        this.emit('github', this.state.github);
      }
    } catch {
      /* fallback stays active */
    }
  }

  setTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    this.state.theme = next;
    document.documentElement.dataset.theme = next;
    this.persist();
    this.emit('theme', next);
  }

  setView(view) {
    if (!['studio', 'ai', 'portfolio', 'vault'].includes(view)) return;
    if (this.state.activeView === view) return;
    this.state.activeView = view;
    this.persist();
    this.emit('view', view);
  }

  setExposure(val) {
    this.state.exposure = Math.max(0, Math.min(1, Number(val) || 0));
    document.documentElement.style.setProperty('--exposure', String(this.state.exposure));
    this.persist();
    this.emit('exposure', this.state.exposure);
  }

  setDialMix(val) {
    this.state.dialMix = Math.max(0, Math.min(100, Math.round(Number(val) || 0)));
    this.persist();
    this.emit('dialMix', this.state.dialMix);
  }

  addTask(text) {
    const clean = String(text || '').trim();
    if (!clean) return null;
    const task = { id: 't' + Date.now().toString(36), text: clean, done: false };
    this.state.tasks.unshift(task);
    this.persist();
    this.emit('tasks', this.state.tasks);
    return task;
  }

  toggleTask(id) {
    const t = this.state.tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    this.persist();
    this.emit('tasks', this.state.tasks);
  }

  toggleTaskByQuery(query) {
    const q = String(query || '').toLowerCase().trim();
    const target = this.state.tasks.find(t => !q || t.text.toLowerCase().includes(q));
    if (!target) return null;
    target.done = !target.done;
    this.persist();
    this.emit('tasks', this.state.tasks);
    return target;
  }

  removeTaskByQuery(query) {
    const q = String(query || '').toLowerCase().trim();
    const idx = this.state.tasks.findIndex(t => !q || t.text.toLowerCase().includes(q));
    if (idx === -1) return null;
    const [removed] = this.state.tasks.splice(idx, 1);
    this.persist();
    this.emit('tasks', this.state.tasks);
    return { item: removed, index: idx };
  }

  removeTask(id) {
    const idx = this.state.tasks.findIndex(x => x.id === id);
    if (idx === -1) return null;
    const [removed] = this.state.tasks.splice(idx, 1);
    this.persist();
    this.emit('tasks', this.state.tasks);
    return { item: removed, index: idx };
  }

  restoreTask(entry) {
    if (!entry || !entry.item) return;
    this.state.tasks.splice(Math.min(entry.index, this.state.tasks.length), 0, entry.item);
    this.persist();
    this.emit('tasks', this.state.tasks);
  }

  addVaultItem(item) {
    const created = {
      id: 'v' + Date.now().toString(36),
      title: item.title || 'Yeni Fikir Kartı',
      subtitle: item.subtitle || 'Yerel Tasarım Notu',
      tag: item.tag || 'motion',
      av: item.av || ((this.state.vaultItems.length % 12) + 1),
      kind: item.kind || (item.imageData ? 'visual' : 'note'),
      badge: item.badge || (item.tag ? `#${item.tag}` : 'Yeni'),
      body: item.body || '',
      highlight: item.highlight || item.title || '',
      imageData: item.imageData || null,
      createdAt: 'Şimdi',
    };
    if (created.tag && !this.state.vaultTags.includes(created.tag)) {
      this.state.vaultTags.push(created.tag);
    }
    this.state.vaultItems.unshift(created);
    this.persist();
    this.emit('vault', this.state.vaultItems);
    this.emit('toast', { title: 'Kasaya eklendi', detail: created.title, kind: 'save' });
    return created;
  }

  removeVaultItem(id) {
    const idx = this.state.vaultItems.findIndex(x => x.id === id);
    if (idx === -1) return null;
    const [removed] = this.state.vaultItems.splice(idx, 1);
    this.persist();
    this.emit('vault', this.state.vaultItems);
    return { item: removed, index: idx };
  }

  restoreVaultItem(entry) {
    if (!entry || !entry.item) return;
    this.state.vaultItems.splice(Math.min(entry.index, this.state.vaultItems.length), 0, entry.item);
    this.persist();
    this.emit('vault', this.state.vaultItems);
  }

  addTag(tag) {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean || this.state.vaultTags.includes(clean)) return false;
    this.state.vaultTags.push(clean);
    this.persist();
    this.emit('tags', this.state.vaultTags);
    return true;
  }

  incrementAiRuns() {
    this.state.aiRuns += 1;
    this.persist();
    this.emit('aiRuns', this.state.aiRuns);
  }

  getAgentContextSnapshot() {
    return {
      activeView: this.state.activeView,
      theme: this.state.theme,
      exposure: Number(this.state.exposure.toFixed(2)),
      dialMix: this.state.dialMix,
      playing: this.state.playing,
      soundTrack: this.state.soundTrack,
      pomodoro: this.state.pomodoro,
      tasks: this.state.tasks.map(t => ({ text: t.text, done: t.done })),
      vaultCount: this.state.vaultItems.length,
      vaultRecentTitles: this.state.vaultItems.slice(0, 6).map(v => `${v.title} (#${v.tag})`),
      githubUser: this.state.github.login,
      githubRepos: this.state.github.repos.slice(0, 6).map(r => r.name),
    };
  }
}

export const store = new Store();
