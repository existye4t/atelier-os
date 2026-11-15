/**
 * Page 2: OpenCode-Inspired Multi-Model Agent Harness ("AI Ajan Kokpiti")
 * - Click-to-select sleek Model Picker Modal with OpenCode Zen (12 Free + Pro),
 *   Pollinations, Gemini, OpenAI, OpenRouter, Claude, Local Ollama & Custom URLs
 * - Selectable Reasoning Effort (Otomatik | Low | Med | High | Max)
 * - OpenCode-style Harness Mode (Build · Otonom | Plan · Onaylı | Chat · Sohbet)
 * - Session transcript with left-gutter prompts, collapsible Düşünce Süreci (Reasoning),
 *   structured inline Tool Cards, token/cost telemetry, and live Workspace Context rail
 * - Real Turkish Voice Dictation (SpeechRecognition + Mic AnalyserNode + MediaRecorder fallback)
 */
import { store } from '../store.js';
import { sound } from '../audio.js';
import {
  runBrowserChat,
  fetchStaticModelCatalog,
  transcribeBrowserGemini,
  BROWSER_LOCAL_MODELS,
  GROQ_MODELS,
  WEB_FREE_MODELS,
} from '../client-ai.js';

const { S, step, clamp, register, svg } = window.Motion;

const TRACK_NAMES = ['Gece Yağmuru', 'Obsidian Lo-Fi', 'Derin Yörünge', 'Atölye Şöminesi'];

const PROVIDER_META = {
  browser: { label: 'Tarayıcı İçi Yerel AI', short: 'Yerel AI', needsKey: false, needsUrl: false, defaultModel: 'onnx-community/Qwen2.5-0.5B-Instruct' },
  opencode: { label: 'OpenCode Zen', short: 'OpenCode', needsKey: false, needsUrl: false, defaultModel: 'mimo-v2.6-flash-free' },
  llm7: { label: 'LLM7 Ücretsiz', short: 'LLM7', needsKey: false, needsUrl: false, defaultModel: 'codestral-latest' },
  pollinations: { label: 'Pollinations', short: 'Pollinations', needsKey: false, needsUrl: false, defaultModel: 'openai-fast' },
  groq: { label: 'Groq Cloud (Ücretsiz)', short: 'Groq', needsKey: true, needsUrl: false, defaultModel: 'llama-3.3-70b-versatile' },
  gemini: { label: 'Google Gemini', short: 'Gemini', needsKey: true, needsUrl: false, defaultModel: 'gemini-2.5-flash' },
  openai: { label: 'OpenAI', short: 'OpenAI', needsKey: true, needsUrl: false, defaultModel: 'gpt-4o-mini' },
  openrouter: { label: 'OpenRouter', short: 'OpenRouter', needsKey: true, needsUrl: false, defaultModel: 'anthropic/claude-sonnet-4' },
  anthropic: { label: 'Anthropic Claude', short: 'Claude', needsKey: true, needsUrl: false, defaultModel: 'claude-sonnet-4-20250514' },
  ollama: { label: 'Yerel Ollama', short: 'Ollama', needsKey: false, needsUrl: false, defaultModel: 'llama3.2' },
  custom: { label: 'Özel URL', short: 'Özel', needsKey: false, needsUrl: true, defaultModel: 'gpt-4o-mini' },
};

const AGENT_MODES = [
  { id: 'build', label: 'Build', hint: 'Otonom uygular', dot: 'var(--green)' },
  { id: 'plan', label: 'Plan', hint: 'Onay ister', dot: 'var(--orange)' },
  { id: 'chat', label: 'Chat', hint: 'Salt sohbet', dot: 'var(--blue)' },
];

const EFFORT_LEVELS = [
  { id: 'auto', label: 'Otomatik', short: 'Oto' },
  { id: 'low', label: 'Low', short: 'Low' },
  { id: 'medium', label: 'Med', short: 'Med' },
  { id: 'high', label: 'High', short: 'High' },
  { id: 'max', label: 'Max', short: 'Max' },
];

const SUGGESTIONS = [
  'Derin odak ortamını kur: gece yağmuru sesini başlat, ışığı %50 pozlamaya çek ve 25 dk Pomodoro aç.',
  'JavaScript event loop ve microtask kuyruğunu sade bir örnekle açıkla.',
  'Fikir Kasasına "Kromatik Cam Reflektörü" adında #shader etiketli yeni bir referans kartı ekle.',
  'Bana bugün için 3 maddelik verimli yazılım geliştirme planı yap ve görev listeme işle.',
];

// Clean fallback catalog until /api/models or client discovery resolves
const INITIAL_SECTIONS = [
  {
    key: 'browser_free',
    label: 'Tarayıcı İçi Yerel AI (%100 Kişiye Özel Limitsiz)',
    models: BROWSER_LOCAL_MODELS,
  },
  {
    key: 'web_free',
    label: 'Ücretsiz Web Havuzu (Pollinations & LLM7)',
    models: WEB_FREE_MODELS,
  },
  {
    key: 'groq',
    label: 'Groq (Ücretsiz Kendi Anahtarın · Kişisel Limit)',
    models: GROQ_MODELS,
  },
  {
    key: 'opencode_free',
    label: 'OpenCode Ücretsiz (Zen)',
    models: [
      { id: 'mimo-v2.6-flash-free', name: 'MiMo-V2.6-Flash Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: true, context: 200000, description: 'Çok modlu hızlı kodlama ve akıl yürütme modeli' },
      { id: 'beam-free', name: 'Beam Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 1048576, description: '1M bağlam penceresine sahip yüksek hızlı ücretsiz model' },
      { id: 'flint-40b-free', name: 'Flint 40B Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 262144, description: '40B dengeli akıl yürütme ve teknik analiz modeli' },
      { id: 'iceman-free', name: 'Iceman Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 200000, description: 'Kodlama ve derin teknik çözümleme odaklı ücretsiz model' },
      { id: 'inkling-2-small-free', name: 'Inkling 2 Small Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 131072, description: 'Düşük gecikmeli hızlı yanıt ve sohbet modeli' },
      { id: 'longcat-2.5-free', name: 'LongCat 2.5 Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 256000, description: 'Geniş bağlamlı ajan ve metin sentez modeli' },
      { id: 'nemotron-3.5-lightning-free', name: 'Nemotron 3.5 Lightning Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 262144, description: 'Hızlı akıl yürütme ve kod tamamlama modeli' },
      { id: 'nemotron-3.5-super-vl-free', name: 'Nemotron 3.5 Super VL Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: true, context: 262144, description: 'Görsel-dil destekli üst seviye akıl yürütme modeli' },
      { id: 'big-pickle', name: 'Big Pickle', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 200000, description: 'OpenCode topluluk gizli ücretsiz kodlama modeli' },
      { id: 'deepseek-v4.1-flash-free', name: 'DeepSeek V4.1 Flash Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 163840, description: 'Yüksek doğruluklu DeepSeek reasoning & ajan modeli' },
      { id: 'glm-5.3-flash-free', name: 'GLM-5.3 Flash Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: true, context: 200000, description: 'Hızlı çok modlu Zhipu GLM flash modeli' },
      { id: 'minimax-m3.1-flash-free', name: 'MiniMax M3.1 Flash Free', provider: 'opencode', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 204800, description: '204K bağlamlı hızlı MiniMax ajan modeli' },
    ],
  },
];

export function mountAI(container) {
  const cfg = store.state.aiConfig;
  if (!cfg.effort) cfg.effort = 'high';
  if (!cfg.agentMode) cfg.agentMode = 'build';
  if (typeof cfg.autoFallback !== 'boolean') cfg.autoFallback = true;

  // Clean up any leftover modal from previous mount
  document.getElementById('ai-model-modal')?.remove();

  container.innerHTML = `
    <div class="view-header">
      <div>
        <span class="eyebrow">02 · OPENCODE ZEN + ÇOK MODELLİ HARNESS</span>
        <h2>AI Ajan Kokpiti</h2>
      </div>
      <div class="header-pills">
        <button class="chip-pill chip-action harness-top-model-pill" id="ai-top-model-btn" type="button" title="Model seçiciyi aç">
          <span class="status-dot-live"></span>
          <span class="mono" id="ai-active-badge">${escapeHtml(cfg.model)}</span>
          <span class="badge-mini badge-free" id="ai-top-free-tag">ÜCRETSİZ</span>
          <span class="badge-mini badge-effort" id="ai-top-effort-tag">${escapeHtml(getEffortLabel(cfg.effort))}</span>
        </button>
        <button class="chip-pill chip-action" id="ai-cfg-toggle" type="button">
          ${svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>')}
          <span>Ayarlar</span>
        </button>
        <span class="chip-pill mono" id="ai-runs-chip">İstek: ${store.state.aiRuns}</span>
      </div>
    </div>

    <div class="ai-grid">
      <!-- Left Rail: Voice Orb + Live Workspace Telemetry + Harness Macros -->
      <section class="panel ai-orb-panel">
        <div class="orb-wrap" id="orb-wrap" title="Sesli dikteyi başlat / durdur">
          <div class="siri-glow" id="siri-glow"></div>
          <div class="siri-orb" id="siri-orb">
            <div class="orb-layer l1"></div>
            <div class="orb-layer l2"></div>
            <div class="orb-layer l3"></div>
            <div class="orb-rim"></div>
          </div>
        </div>

        <div class="voice-row">
          <button class="voice-btn" id="voice-btn" type="button">
            ${svg('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>')}
            <span id="voice-label">Sesli Dikteyi Başlat</span>
          </button>
          <div class="voice-wave" id="voice-wave">
            ${Array.from({ length: 14 }, () => '<i></i>').join('')}
          </div>
        </div>

        <div class="voice-options-row">
          <label class="toggle-chip">
            <input type="checkbox" id="opt-autosend" ${cfg.autoSendVoice ? 'checked' : ''} />
            <span>Dikte bitince gönder</span>
          </label>
          <label class="toggle-chip">
            <input type="checkbox" id="opt-tts" ${cfg.ttsReply ? 'checked' : ''} />
            <span>Yanıtı sesli oku</span>
          </label>
        </div>

        <!-- Live Workspace Telemetry Context -->
        <div class="harness-context">
          <div class="hc-head">
            <span class="panel-label">CANLI ATELİER BAĞLAMI</span>
            <span class="hc-live mono">SYNC</span>
          </div>
          <div class="hc-grid" id="hc-grid"></div>
        </div>

        <!-- Quick Harness Macros -->
        <div class="preset-stack">
          <span class="panel-label">TEK TIKLA HARNESS KOMUTLARI</span>
          <button class="preset-btn" data-prompt="Derin odak ortamını kur: gece yağmuru sesini %60 filtreyle başlat, ışığı 0.45 EV yap ve 25 dakikalık Pomodoro sayacını başlat." type="button">
            <strong>Odak Ortamını Başlat</strong>
            <span>Ses + pozlama + 25d sayacı tek seferde kurar</span>
          </button>
          <button class="preset-btn" data-prompt="Bana yaratıcı arayüzler için 3 taze tasarım fikri üret ve en iyisini Fikir Kasasına kart olarak kaydet." type="button">
            <strong>Fikir Üret &amp; Kasaya Kaydet</strong>
            <span>Akıl yürütmeyle fikir üretip Kasaya işler</span>
          </button>
          <button class="preset-btn" data-prompt="Karanlık ve aydınlık tema arasında geçiş yap ve Portfolyo sayfasındaki 3D dergiyi 2. sayfaya çevir." type="button">
            <strong>Temayı &amp; 3D Dergiyi Yönet</strong>
            <span>Araç çağrısıyla tema &amp; dergiyi kontrol eder</span>
          </button>
        </div>
      </section>

      <!-- Right Main Harness: Toolbar + Session Transcript + Composer -->
      <section class="panel ai-console-panel">
        <!-- Harness Mode Bar -->
        <div class="harness-toolbar">
          <div class="harness-modes" id="agent-mode-group" role="tablist" aria-label="Ajan Modu">
            ${AGENT_MODES.map(m => `
              <button type="button" class="hmode-btn ${cfg.agentMode === m.id ? 'active' : ''}" data-mode="${m.id}" title="${m.hint}">
                <span class="hmode-dot" style="background:${m.dot}"></span>
                <span>${m.label}</span>
                <small>${m.hint}</small>
              </button>
            `).join('')}
          </div>

          <div class="harness-actions">
            <button class="btn-ghost btn-sm" id="ai-refresh-models" type="button" title="Model kataloğunu yenile">
              ${svg('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>')}
              <span>Katalog</span>
            </button>
            <button class="btn-ghost btn-sm" id="ai-clear-chat" type="button" title="Oturumu sıfırla">Temizle</button>
          </div>
        </div>

        <!-- Expandable API Keys & Harness Behavior Drawer -->
        <div class="ai-config-drawer" id="ai-config-drawer" hidden>
          <div class="cfg-drawer-head">
            <span class="mono" id="cfg-drawer-provider">SAĞLAYICI AYARLARI</span>
            <span class="cfg-hint">Her kullanıcının limiti tamamen kendi tarayıcısına/anahtarına özeldir (yerel saklanır).</span>
          </div>
          <div class="cfg-grid">
            <label class="cfg-field" id="cfg-key-wrap">
              <span id="cfg-key-label">API Anahtarı (Tarayıcıda Yerel Saklanır)</span>
              <input id="cfg-api-key" type="password" autocomplete="off" placeholder="sk-... / AIza..." value="${escapeHtml(cfg.apiKeys[cfg.provider] || '')}" />
            </label>
            <label class="cfg-field" id="cfg-url-wrap">
              <span>Özel Base URL (OpenAI Uyumlu)</span>
              <input id="cfg-base-url" type="text" placeholder="https://api.openai.com/v1" value="${escapeHtml(cfg.baseUrl || '')}" />
            </label>
          </div>
          <div class="cfg-foot">
            <div class="cfg-toggles">
              <label class="toggle-chip">
                <input type="checkbox" id="opt-autoexec" ${cfg.autoExecute ? 'checked' : ''} />
                <span>Build modunda araçları otomatik uygula</span>
              </label>
              <label class="toggle-chip">
                <input type="checkbox" id="opt-autofallback" ${cfg.autoFallback ? 'checked' : ''} />
                <span>Ücretsiz limit dolarsa yedek OpenCode modeline geç</span>
              </label>
            </div>
            <button class="btn-primary btn-sm" id="cfg-save-btn" type="button">Kaydet</button>
          </div>
        </div>

        <!-- Session Transcript -->
        <div class="ai-chat-feed" id="ai-chat-feed"></div>

        <!-- Live Thinking & Pending Tool Approval -->
        <div class="goo-think-row" id="goo-think-row">
          <div class="goo-dots-stage" id="goo-dots-stage">
            <span class="gdot"></span><span class="gdot"></span><span class="gdot"></span>
          </div>
          <span class="think-shimmer" id="think-shimmer">Model yanıtlıyor...</span>
        </div>

        <div class="tool-approval" id="tool-approval" hidden>
          <div class="ta-head">
            <span class="ta-badge">HARNESS İZİN KAPISI</span>
            <code id="ta-name"></code>
          </div>
          <p id="ta-summary"></p>
          <div class="ta-actions">
            <button class="btn-approve" id="ta-approve" type="button">Onayla ve Uygula</button>
            <button class="btn-ghost btn-sm" id="ta-reject" type="button">Reddet</button>
          </div>
        </div>

        <!-- OpenCode-Inspired Composer Dock -->
        <div class="prompt-box">
          <div class="ghost-editor" id="ghost-editor">
            <textarea id="ai-input" rows="2" placeholder="Bir soru sor, kod yazdır veya Atölye OS eylemi iste..."></textarea>
            <div class="ghost-overlay" id="ghost-overlay" style="display:none">
              <span class="ghost-prefix" id="ghost-prefix"></span><span id="ghost-letters"></span><span class="tab-badge">Tab</span>
            </div>
          </div>

          <div class="composer-bar">
            <div class="composer-left">
              <!-- Click-to-open Model Picker Trigger -->
              <button type="button" class="model-trigger-btn" id="ai-model-picker-btn" title="Tıklayarak model seç (Ctrl+M)">
                <span class="mtb-dot"></span>
                <span class="mtb-prov" id="mtb-prov">OpenCode</span>
                <span class="mtb-sep">/</span>
                <span class="mtb-model mono" id="mtb-model">${escapeHtml(cfg.model)}</span>
                <span class="badge-mini badge-free" id="mtb-tier">ÜCRETSİZ</span>
                <span class="mtb-ctx mono" id="mtb-ctx">200K</span>
                ${svg('<polyline points="6 9 12 15 18 9"/>')}
              </button>

              <!-- Reasoning Effort Segmented Selector -->
              <div class="effort-bar" id="effort-group" role="group" aria-label="Akıl Yürütme Eforu">
                <span class="effort-label mono">Efor</span>
                ${EFFORT_LEVELS.map(ef => `
                  <button type="button" class="effort-btn ${cfg.effort === ef.id ? 'active' : ''}" data-effort="${ef.id}">
                    ${ef.short}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="pf-actions">
              <span class="prompt-status-dot" id="ai-status-note">Hazır · OpenCode Zen &amp; Harness</span>
              <button class="btn-stop stop-harness-btn" id="ai-stop-btn" type="button" hidden>
                <span>■ Durdur</span>
              </button>
              <button class="btn-primary send-harness-btn" id="ai-send-btn" type="button">
                <span>Gönder</span>
                <kbd>↵</kbd>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  // ---- Mount Sleek Click-to-Select Model Modal in document.body ----
  const modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'ai-model-modal';
  modalBackdrop.className = 'cmd-backdrop ai-modal-backdrop';
  modalBackdrop.innerHTML = `
    <div class="ai-model-modal" role="dialog" aria-modal="true" aria-label="Model Seçici">
      <div class="amm-head">
        <div class="amm-search-wrap">
          ${svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}
          <input id="mm-search" type="text" placeholder="Model ara (ör. mimo, beam, deepseek, gemini, claude, 40b)..." autocomplete="off" />
          <kbd class="amm-esc" id="mm-close-btn">ESC</kbd>
        </div>
        <div class="amm-tabs" id="mm-tabs"></div>
      </div>
      <div class="amm-body" id="mm-list"></div>
      <div class="amm-foot">
        <div class="amm-foot-left">
          <span class="mono" id="mm-count-label">Yükleniyor...</span>
          <span class="amm-sep">·</span>
          <span id="mm-ollama-status">OpenCode Zen Ücretsiz + Tüm Sağlayıcılar</span>
        </div>
        <div class="amm-custom-inline">
          <input id="mm-custom-id" type="text" placeholder="Özel model ID yaz & uygula..." />
          <button type="button" class="btn-ghost btn-sm" id="mm-custom-apply">Kullan</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalBackdrop);

  // ---- Element References ----
  const topModelBtn = container.querySelector('#ai-top-model-btn');
  const activeBadge = container.querySelector('#ai-active-badge');
  const topFreeTag = container.querySelector('#ai-top-free-tag');
  const topEffortTag = container.querySelector('#ai-top-effort-tag');
  const cfgToggleBtn = container.querySelector('#ai-cfg-toggle');
  const cfgDrawer = container.querySelector('#ai-config-drawer');
  const cfgDrawerProvider = container.querySelector('#cfg-drawer-provider');
  const runsChip = container.querySelector('#ai-runs-chip');

  const modeBtns = [...container.querySelectorAll('#agent-mode-group .hmode-btn')];
  const effortBtns = [...container.querySelectorAll('#effort-group .effort-btn')];
  const modelPickerBtn = container.querySelector('#ai-model-picker-btn');
  const mtbProv = container.querySelector('#mtb-prov');
  const mtbModel = container.querySelector('#mtb-model');
  const mtbTier = container.querySelector('#mtb-tier');
  const mtbCtx = container.querySelector('#mtb-ctx');

  const refreshModelsBtn = container.querySelector('#ai-refresh-models');
  const clearChatBtn = container.querySelector('#ai-clear-chat');

  const cfgKeyWrap = container.querySelector('#cfg-key-wrap');
  const cfgKeyLabel = container.querySelector('#cfg-key-label');
  const cfgApiKey = container.querySelector('#cfg-api-key');
  const cfgUrlWrap = container.querySelector('#cfg-url-wrap');
  const cfgBaseUrl = container.querySelector('#cfg-base-url');
  const cfgSaveBtn = container.querySelector('#cfg-save-btn');
  const optAutoExec = container.querySelector('#opt-autoexec');
  const optAutoFallback = container.querySelector('#opt-autofallback');
  const optAutoSend = container.querySelector('#opt-autosend');
  const optTts = container.querySelector('#opt-tts');

  const orbPanel = container.querySelector('.ai-orb-panel');
  const orbWrap = container.querySelector('#orb-wrap');
  const siriOrb = container.querySelector('#siri-orb');
  const siriGlow = container.querySelector('#siri-glow');
  const voiceBtn = container.querySelector('#voice-btn');
  const voiceLabel = container.querySelector('#voice-label');
  const waveBars = [...container.querySelectorAll('#voice-wave i')];
  const hcGrid = container.querySelector('#hc-grid');

  const chatFeed = container.querySelector('#ai-chat-feed');
  const gooThinkRow = container.querySelector('#goo-think-row');
  const thinkShimmer = container.querySelector('#think-shimmer');
  const gDots = [...container.querySelectorAll('#goo-dots-stage .gdot')];
  const toolApproval = container.querySelector('#tool-approval');
  const taName = container.querySelector('#ta-name');
  const taSummary = container.querySelector('#ta-summary');
  const taApprove = container.querySelector('#ta-approve');
  const taReject = container.querySelector('#ta-reject');

  const aiInput = container.querySelector('#ai-input');
  const ghostOverlay = container.querySelector('#ghost-overlay');
  const ghostPrefix = container.querySelector('#ghost-prefix');
  const ghostLetters = container.querySelector('#ghost-letters');
  const statusNote = container.querySelector('#ai-status-note');
  const stopBtn = container.querySelector('#ai-stop-btn');
  const sendBtn = container.querySelector('#ai-send-btn');

  // Modal Elements
  const mmSearch = modalBackdrop.querySelector('#mm-search');
  const mmTabs = modalBackdrop.querySelector('#mm-tabs');
  const mmList = modalBackdrop.querySelector('#mm-list');
  const mmCountLabel = modalBackdrop.querySelector('#mm-count-label');
  const mmOllamaStatus = modalBackdrop.querySelector('#mm-ollama-status');
  const mmCloseBtn = modalBackdrop.querySelector('#mm-close-btn');
  const mmCustomId = modalBackdrop.querySelector('#mm-custom-id');
  const mmCustomApply = modalBackdrop.querySelector('#mm-custom-apply');

  // ---- View State ----
  let pendingToolBatch = null;
  let thinking = false;
  let busySending = false;
  let activeAbortCtrl = null;
  let abortRequested = false;
  let sections = structuredClone(INITIAL_SECTIONS);
  let activeModalTab = 'all';
  let ollamaOnline = false;
  let opencodeAvailable = false;
  let localBridgeOnline = false;
  let userSelectedModel = false;

  // Physics State
  const voiceGainS = S(0, 140, 14);
  const orbPressS = S(1, 520, 16);
  let realMicLevel = 0;
  let voiceListening = false;
  let orbClock = 0;

  // ---- Helper: Model Catalog Lookup & Formatting ----
  function allModelsFlat() {
    const out = [];
    for (const sec of sections) {
      for (const m of sec.models || []) {
        out.push({ ...m, sectionKey: sec.key, sectionLabel: sec.label });
      }
    }
    return out;
  }

  function findActiveModelMeta() {
    const c = store.state.aiConfig;
    return (
      allModelsFlat().find(m => m.id === c.model && m.provider === c.provider) ||
      allModelsFlat().find(m => m.id === c.model) || {
        id: c.model,
        name: c.model,
        provider: c.provider,
        free:
          (c.provider === 'opencode' && (c.model.endsWith('-free') || c.model === 'big-pickle')) ||
          c.provider === 'browser' ||
          c.provider === 'pollinations' ||
          c.provider === 'llm7' ||
          c.provider === 'groq' ||
          c.provider === 'ollama',
        reasoning: false,
        context: 128000,
      }
    );
  }

  function formatContextK(ctx) {
    const n = Number(ctx) || 0;
    if (!n) return '—';
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
    return `${Math.round(n / 1000)}K`;
  }

  function getEffortLabel(eff) {
    return EFFORT_LEVELS.find(e => e.id === eff)?.label || 'High';
  }

  // ---- Workspace Context Rail Sync ----
  function renderWorkspaceContext() {
    const st = store.state;
    const snap = typeof store.getAgentContextSnapshot === 'function' ? store.getAgentContextSnapshot() : {};
    const doneTasks = (st.tasks || []).filter(t => t.done).length;
    const totalTasks = (st.tasks || []).length;
    const trackName = TRACK_NAMES[st.soundTrack || 0] || 'Gece Yağmuru';
    const sec = st.pomodoro?.secondsLeft ?? 1500;
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');

    hcGrid.innerHTML = `
      <div class="hc-item">
        <span class="hc-k">Ortam Sesi</span>
        <span class="hc-v">${st.playing ? `▶ ${escapeHtml(trackName)}` : '⏸ Duraklatıldı'} · %${st.dialMix ?? 44}</span>
      </div>
      <div class="hc-item">
        <span class="hc-k">Işık &amp; Tema</span>
        <span class="hc-v">${st.theme === 'light' ? 'Aydınlık' : 'Karanlık'} · +${Number(st.exposure || 0).toFixed(2)} EV</span>
      </div>
      <div class="hc-item">
        <span class="hc-k">Odak &amp; Görev</span>
        <span class="hc-v mono">${mm}:${ss} · ${doneTasks}/${totalTasks} görev</span>
      </div>
      <div class="hc-item">
        <span class="hc-k">Kasa &amp; GitHub</span>
        <span class="hc-v">${(st.vaultItems || []).length} kart · @${escapeHtml(snap.githubLogin || st.github?.login || 'existye4t')}</span>
      </div>
    `;
  }

  // ---- Sync All Harness UI Badges ----
  function syncHarnessUI() {
    const c = store.state.aiConfig;
    const pmeta = PROVIDER_META[c.provider] || PROVIDER_META.opencode;
    const mmeta = findActiveModelMeta();
    const effLabel = getEffortLabel(c.effort);

    activeBadge.textContent = c.model;
    topFreeTag.textContent = mmeta.free ? 'ÜCRETSİZ' : c.provider === 'ollama' ? 'YEREL' : 'API KEY';
    topFreeTag.className = `badge-mini ${mmeta.free || c.provider === 'ollama' ? 'badge-free' : 'badge-paid'}`;
    topEffortTag.textContent = `Efor: ${effLabel}`;

    mtbProv.textContent = pmeta.short;
    mtbModel.textContent = c.model;
    mtbTier.textContent = mmeta.free ? 'ÜCRETSİZ' : c.provider === 'ollama' ? 'YEREL' : 'PRO/KEY';
    mtbTier.className = `badge-mini ${mmeta.free || c.provider === 'ollama' ? 'badge-free' : 'badge-paid'}`;
    mtbCtx.textContent = formatContextK(mmeta.context || 128000);

    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === c.agentMode));
    effortBtns.forEach(b => b.classList.toggle('active', b.dataset.effort === c.effort));

    cfgDrawerProvider.textContent = `${pmeta.label.toUpperCase()} AYARLARI`;
    const isOptionalPersonalKey = c.provider === 'pollinations' || c.provider === 'llm7';
    cfgKeyLabel.textContent = isOptionalPersonalKey
      ? `${pmeta.label} İsteğe Bağlı Kişisel Token (Kendi Limitin İçin)`
      : `${pmeta.label} API Anahtarı (Tarayıcıda Yerel Saklanır)`;
    cfgApiKey.value = c.apiKeys[c.provider] || '';
    const hideKey = c.provider === 'browser' || c.provider === 'opencode' || c.provider === 'ollama';
    cfgKeyWrap.style.display = hideKey ? 'none' : 'flex';
    cfgUrlWrap.style.display = pmeta.needsUrl || c.provider === 'openai' ? 'flex' : 'none';
  }

  // ---- Live Model Catalog Loading (Local Bridge OR Browser-Direct GitHub Pages) ----
  async function loadModels() {
    const c = store.state.aiConfig;
    let loadedLocal = false;
    try {
      const qs = new URLSearchParams({ provider: c.provider, apiKey: c.apiKeys[c.provider] || '' });
      const res = await fetch(`/api/models?${qs.toString()}`);
      const ctype = res.headers.get('content-type') || '';
      if (res.ok && ctype.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.sections) && data.sections.length) {
          sections = data.sections;
        }
        localBridgeOnline = true;
        ollamaOnline = Boolean(data.ollamaOnline);
        opencodeAvailable = Boolean(data.opencodeAvailable);
        mmOllamaStatus.textContent = `Yerel Bridge ✓ · OpenCode: ${opencodeAvailable ? 'Hazır ✓' : 'Offline'} · Ollama: ${ollamaOnline ? 'Açık ✓' : 'Kapalı'}`;
        loadedLocal = true;
      }
    } catch {
      /* static hosting mode */
    }

    if (!loadedLocal) {
      localBridgeOnline = false;
      opencodeAvailable = false;
      try {
        const staticData = await fetchStaticModelCatalog({
          baseSections: INITIAL_SECTIONS,
          apiKey: c.apiKeys[c.provider] || '',
          provider: c.provider,
        });
        if (Array.isArray(staticData.sections) && staticData.sections.length) {
          sections = staticData.sections;
        }
        ollamaOnline = Boolean(staticData.ollamaOnline);
      } catch {
        /* retain INITIAL_SECTIONS */
      }

      if (!userSelectedModel && c.provider === 'opencode') {
        c.provider = 'pollinations';
        c.model = 'openai-fast';
        store.persist();
      }
      mmOllamaStatus.textContent = `GitHub Pages · Tarayıcı Direkt Modu ✓ · Ollama: ${ollamaOnline ? 'Açık ✓' : 'Kapalı'}`;
      statusNote.textContent = 'Tarayıcı Direkt Modu · Ücretsiz Web Modelleri Hazır';
    }

    syncHarnessUI();
    if (modalBackdrop.classList.contains('open')) {
      renderModalTabs();
      renderModalModels();
    }
  }

  // ---- Sleek Model Picker Modal Logic ----
  function renderModalTabs() {
    const totalCount = allModelsFlat().length;
    const tabs = [
      { key: 'all', label: 'Tümü', count: totalCount },
      ...sections.map(sec => ({
        key: sec.key,
        label:
          sec.key === 'browser_free'
            ? 'Tarayıcı İçi AI (Limitsiz)'
            : sec.key === 'web_free'
              ? 'Ücretsiz Web'
              : sec.key === 'groq'
                ? 'Groq (Kişisel)'
                : sec.key === 'opencode_free'
                  ? 'OpenCode Ücretsiz'
                  : sec.key === 'opencode_pro'
                    ? 'OpenCode Pro'
                    : sec.label,
        count: (sec.models || []).length,
      })),
    ];

    mmTabs.innerHTML = tabs
      .map(
        t => `
        <button type="button" class="amm-tab ${activeModalTab === t.key ? 'active' : ''}" data-tab="${escapeHtml(t.key)}">
          <span>${escapeHtml(t.label)}</span>
          <span class="amm-tab-cnt mono">${t.count}</span>
        </button>`
      )
      .join('');

    mmTabs.querySelectorAll('.amm-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeModalTab = btn.dataset.tab;
        renderModalTabs();
        renderModalModels();
        sound.tickSound(0.45);
      });
    });
  }

  function renderModalModels() {
    const q = mmSearch.value.trim().toLowerCase();
    const curProv = store.state.aiConfig.provider;
    const curModel = store.state.aiConfig.model;
    const visibleSections = activeModalTab === 'all' ? sections : sections.filter(s => s.key === activeModalTab);

    let matchCount = 0;
    const blocks = [];

    for (const sec of visibleSections) {
      const filtered = (sec.models || []).filter(m => {
        if (!q) return true;
        return (
          (m.id || '').toLowerCase().includes(q) ||
          (m.name || '').toLowerCase().includes(q) ||
          (m.provider || '').toLowerCase().includes(q) ||
          (m.description || '').toLowerCase().includes(q)
        );
      });
      if (!filtered.length) continue;
      matchCount += filtered.length;

      blocks.push(`
        <div class="amm-section">
          <div class="amm-sec-title">
            <span>${escapeHtml(sec.label)}</span>
            <span class="mono">${filtered.length} model</span>
          </div>
          <div class="amm-grid">
            ${filtered
              .map(m => {
                const isSelected = m.id === curModel && m.provider === curProv;
                const ctxTxt = formatContextK(m.context);
                return `
                  <button type="button" class="amm-card ${isSelected ? 'selected' : ''}" data-provider="${escapeHtml(m.provider)}" data-model="${escapeHtml(m.id)}">
                    <div class="amm-card-top">
                      <span class="amm-name">${escapeHtml(m.name || m.id)}</span>
                      ${m.free ? '<span class="badge-mini badge-free">ÜCRETSİZ</span>' : m.provider === 'ollama' ? '<span class="badge-mini badge-local">YEREL</span>' : '<span class="badge-mini badge-paid">API KEY</span>'}
                    </div>
                    <div class="amm-id-row">
                      <code class="amm-id">${escapeHtml(m.provider)}/${escapeHtml(m.id)}</code>
                    </div>
                    ${m.description ? `<p class="amm-desc">${escapeHtml(m.description)}</p>` : ''}
                    <div class="amm-badges">
                      ${m.reasoning ? '<span class="cap-pill cap-reason">Reasoning</span>' : ''}
                      ${m.supportsVariant ? '<span class="cap-pill cap-var">Native Efor</span>' : ''}
                      ${m.multimodal ? '<span class="cap-pill cap-vis">Multimodal</span>' : ''}
                      ${ctxTxt !== '—' ? `<span class="cap-pill mono">${ctxTxt}</span>` : ''}
                    </div>
                  </button>`;
              })
              .join('')}
          </div>
        </div>
      `);
    }

    mmCountLabel.textContent = `${matchCount} model listelendi`;
    mmList.innerHTML = blocks.length
      ? blocks.join('')
      : `<div class="amm-empty">Aramanla eşleşen model bulunamadı. Aşağıdaki özel model ID kutusundan doğrudan yazıp kullanabilirsin.</div>`;

    mmList.querySelectorAll('.amm-card').forEach(card => {
      card.addEventListener('click', () => {
        selectModel(card.dataset.provider, card.dataset.model);
      });
    });
  }

  function selectModel(provider, modelId) {
    const c = store.state.aiConfig;
    userSelectedModel = true;
    c.provider = provider;
    c.model = modelId;
    store.persist();
    syncHarnessUI();
    closeModelModal();
    sound.chime(640);

    const pmeta = PROVIDER_META[provider];
    if (pmeta?.needsKey && !c.apiKeys[provider]) {
      cfgDrawer.hidden = false;
      cfgApiKey.focus();
      statusNote.textContent = `${pmeta.label} seçildi — API anahtarını girip Kaydet'e bas`;
    } else {
      statusNote.textContent = `Aktif model: ${pmeta?.short || provider}/${modelId}`;
    }
  }

  function openModelModal() {
    mmSearch.value = '';
    activeModalTab = 'all';
    renderModalTabs();
    renderModalModels();
    modalBackdrop.classList.add('open');
    setTimeout(() => mmSearch.focus(), 40);
    sound.tickSound(0.5);
  }

  function closeModelModal() {
    modalBackdrop.classList.remove('open');
  }

  modelPickerBtn.addEventListener('click', openModelModal);
  topModelBtn.addEventListener('click', openModelModal);
  mmCloseBtn.addEventListener('click', closeModelModal);
  modalBackdrop.addEventListener('click', e => {
    if (e.target === modalBackdrop) closeModelModal();
  });
  mmSearch.addEventListener('input', renderModalModels);

  mmCustomApply.addEventListener('click', () => {
    const custom = mmCustomId.value.trim();
    if (!custom) return;
    let targetProv = store.state.aiConfig.provider;
    let targetModel = custom;
    if (custom.includes('/')) {
      const [prefix, ...rest] = custom.split('/');
      if (PROVIDER_META[prefix]) {
        targetProv = prefix;
        targetModel = rest.join('/');
      }
    }
    mmCustomId.value = '';
    selectModel(targetProv, targetModel);
  });
  mmCustomId.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      mmCustomApply.click();
    }
  });

  const onWindowKey = e => {
    if (store.state.activeView !== 'ai') return;
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      e.preventDefault();
      closeModelModal();
    } else if (e.key === 'Escape' && busySending) {
      e.preventDefault();
      stopActiveRequest();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      if (modalBackdrop.classList.contains('open')) closeModelModal();
      else openModelModal();
    }
  };
  window.addEventListener('keydown', onWindowKey);

  // ---- Mode & Effort & Config Bindings ----
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      store.state.aiConfig.agentMode = btn.dataset.mode;
      store.persist();
      syncHarnessUI();
      sound.tickSound(0.55);
      const labels = {
        build: 'Build modu · Araçlar otomatik uygulanır',
        plan: 'Plan modu · Araçlar önce senin onayına sunulur',
        chat: 'Chat modu · Saf sohbet ve kod yardımı aktif',
      };
      statusNote.textContent = labels[btn.dataset.mode] || '';
    });
  });

  effortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      store.state.aiConfig.effort = btn.dataset.effort;
      store.persist();
      syncHarnessUI();
      sound.tickSound(0.5);
      statusNote.textContent = `Akıl yürütme eforu: ${getEffortLabel(btn.dataset.effort)}`;
    });
  });

  cfgToggleBtn.addEventListener('click', () => {
    cfgDrawer.hidden = !cfgDrawer.hidden;
    sound.tickSound(0.5);
  });

  cfgSaveBtn.addEventListener('click', () => {
    const c = store.state.aiConfig;
    c.apiKeys[c.provider] = cfgApiKey.value.trim();
    c.baseUrl = cfgBaseUrl.value.trim() || 'https://api.openai.com/v1';
    c.autoExecute = optAutoExec.checked;
    c.autoFallback = optAutoFallback.checked;
    store.persist();
    syncHarnessUI();
    cfgDrawer.hidden = true;
    statusNote.textContent = 'Harness ayarları kaydedildi ✓';
    sound.chime(660);
    loadModels();
  });

  optAutoExec.addEventListener('change', () => {
    store.state.aiConfig.autoExecute = optAutoExec.checked;
    store.persist();
  });
  optAutoFallback.addEventListener('change', () => {
    store.state.aiConfig.autoFallback = optAutoFallback.checked;
    store.persist();
  });
  optAutoSend.addEventListener('change', () => {
    store.state.aiConfig.autoSendVoice = optAutoSend.checked;
    store.persist();
  });
  optTts.addEventListener('change', () => {
    store.state.aiConfig.ttsReply = optTts.checked;
    if (!optTts.checked && window.speechSynthesis) window.speechSynthesis.cancel();
    store.persist();
  });

  refreshModelsBtn.addEventListener('click', () => {
    loadModels();
    sound.tickSound(0.5);
    statusNote.textContent = 'Model kataloğu yenileniyor...';
  });

  clearChatBtn.addEventListener('click', () => {
    store.state.chatHistory = [];
    store.persist();
    renderChatFeed();
    sound.tickSound(0.5);
    statusNote.textContent = 'Oturum temizlendi';
  });

  // ---- Transcript Rendering (OpenCode Left-Gutter Harness Style) ----
  function formatMessageHtml(text) {
    let safe = escapeHtml(text || '');
    safe = safe.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const tag = lang ? `<div class="code-lang mono">${lang}</div>` : '';
      return `<div class="chat-code-wrap">${tag}<pre class="chat-code"><code>${code.trim()}</code></pre></div>`;
    });
    safe = safe.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  function renderLiveDictationHtml() {
    if (!liveDictationState.active) return '';
    const refining = liveDictationState.phase === 'refining';
    const badge = refining ? '· Metin netleştiriliyor...' : '· Dinleniyor (saydam canlı taslak)';
    const text = liveDictationState.text
      ? formatMessageHtml(liveDictationState.text)
      : 'Mikrofon dinliyor... konuşmaya başlayabilirsin.';
    return `
      <div class="harness-turn turn-user is-dictating ${refining ? 'is-refining' : ''}" id="live-dictation-turn">
        <div class="turn-gutter"></div>
        <div class="turn-content">
          <div class="turn-meta mono">
            <span class="dict-pulse"></span>
            <span class="tm-actor">CANLI DİKTE</span>
            <span>${badge}</span>
          </div>
          <div class="turn-text ${liveDictationState.text ? '' : 'dict-draft'}">${text}</div>
        </div>
      </div>
    `;
  }

  function renderChatFeed() {
    const hist = store.state.chatHistory;
    if (!hist.length && !liveDictationState.active) {
      const c = store.state.aiConfig;
      chatFeed.innerHTML = `
        <div class="harness-empty">
          <div class="he-top">
            <span class="he-badge mono">OPENCODE HARNESS · ${escapeHtml(c.provider)}/${escapeHtml(c.model)}</span>
            <span class="he-effort mono">Efor: ${escapeHtml(getEffortLabel(c.effort))} · Mod: ${escapeHtml(c.agentMode.toUpperCase())}</span>
          </div>
          <h4>Oturum Hazır</h4>
          <p>Ücretsiz 12+ OpenCode Zen reasoning modeli veya kendi API anahtarlarınla kod yazdırabilir, teknik sorular sorabilir ve Stüdyo, Görevler, Portfolyo ile Fikir Kasasını tek komutta yönetebilirsin.</p>
          <div class="he-starters">
            <button type="button" class="he-starter" data-prompt="Kısaca kendini tanıt ve ses stüdyosunda Gece Yağmuru sesini başlat.">Gece Yağmuru sesini başlat &amp; tanış</button>
            <button type="button" class="he-starter" data-prompt="React ve Vanilla JS state yönetimi arasındaki temel mimari farkları kısa örneklerle anlat.">Mimari &amp; Kod Analizi</button>
            <button type="button" class="he-starter" data-prompt="Fikir Kasasına &quot;Rayleigh Atmosfer Shader&quot; adında #motion etiketli yeni bir referans ekle.">Fikir Kasasına kart ekle</button>
          </div>
        </div>
      `;
      chatFeed.querySelectorAll('.he-starter').forEach(btn => {
        btn.addEventListener('click', () => {
          aiInput.value = btn.dataset.prompt;
          updateGhost();
          sendMessage(btn.dataset.prompt);
        });
      });
      return;
    }

    chatFeed.innerHTML = hist
      .map(msg => {
        const isUser = msg.role === 'user';
        if (isUser) {
          return `
            <div class="harness-turn turn-user">
              <div class="turn-gutter"></div>
              <div class="turn-content">
                <div class="turn-meta mono">
                  <span class="tm-actor">SEN</span>
                  ${msg.time ? `<span>· ${escapeHtml(msg.time)}</span>` : ''}
                </div>
                <div class="turn-text">${formatMessageHtml(msg.content)}</div>
              </div>
            </div>
          `;
        }

        const reasoningHtml = msg.reasoning
          ? `
            <details class="turn-reasoning">
              <summary class="tr-sum mono">
                <span>Düşünce Süreci</span>
                <span class="tr-len">${msg.reasoning.length} krk · Göster</span>
              </summary>
              <div class="tr-body">${formatMessageHtml(msg.reasoning)}</div>
            </details>
          `
          : '';

        const toolsHtml =
          Array.isArray(msg.actions) && msg.actions.length
            ? `<div class="turn-tools">${msg.actions
                .map(
                  a => `
                  <div class="ttool-row ${a.applied ? 'applied' : a.rejected ? 'denied' : 'pending'}">
                    <span class="ttool-state mono">${a.applied ? 'APPLIED' : a.rejected ? 'DENIED' : 'PENDING'}</span>
                    <code class="ttool-name">${escapeHtml(a.tool || 'action')}</code>
                    <span class="ttool-desc">${escapeHtml(a.label)}</span>
                  </div>`
                )
                .join('')}</div>`
            : '';

        const tok = msg.tokens;
        const tokText = tok
          ? `↑${tok.input || 0} ↓${tok.output || 0}${tok.reasoning ? ` ~${tok.reasoning}` : ''}`
          : '';
        const costText = typeof msg.cost === 'number' ? `$${msg.cost.toFixed(4)}` : '$0.00';

        return `
          <div class="harness-turn turn-assistant">
            <div class="turn-gutter"></div>
            <div class="turn-content">
              <div class="turn-meta mono">
                <span class="tm-orb"></span>
                <span class="tm-model">${escapeHtml(msg.provider || 'opencode')}/${escapeHtml(msg.model || 'AI')}</span>
                ${msg.effort ? `<span class="tm-pill">efor:${escapeHtml(msg.effort)}</span>` : ''}
                ${msg.fallbackFrom ? `<span class="tm-pill warn">yedek:${escapeHtml(msg.fallbackFrom)}</span>` : ''}
              </div>
              ${reasoningHtml}
              <div class="turn-body">${formatMessageHtml(msg.content)}</div>
              ${toolsHtml}
              <div class="turn-telemetry mono">
                ${tokText ? `<span>${tokText}</span><span>·</span>` : ''}
                <span>${costText}</span>
                ${msg.time ? `<span>·</span><span>${escapeHtml(msg.time)}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      })
      .join('') + renderLiveDictationHtml();
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  // ---- Cross-App Real Tool Executor ----
  function describeToolCall(tc) {
    const args = tc.args || {};
    if (tc.name === 'control_studio') {
      const parts = [];
      if (typeof args.playing === 'boolean') parts.push(args.playing ? 'Sesi başlat' : 'Sesi duraklat');
      if (typeof args.trackIdx === 'number') parts.push(TRACK_NAMES[args.trackIdx] || `Parça #${args.trackIdx + 1}`);
      if (typeof args.dialMix === 'number') parts.push(`Filtre %${args.dialMix}`);
      if (typeof args.exposure === 'number') parts.push(`Işık +${Number(args.exposure).toFixed(2)} EV`);
      if (args.pomodoroAction) parts.push(`Pomodoro: ${args.pomodoroAction}`);
      return parts.join(', ') || 'Stüdyoyu güncelle';
    }
    if (tc.name === 'manage_tasks') {
      return `${args.action}: ${args.text || ''}`;
    }
    if (tc.name === 'manage_vault') {
      return `${args.action}: ${args.title || args.tag || 'kart'}`;
    }
    if (tc.name === 'manage_shell') {
      return `${args.view || args.theme || (args.openPalette ? 'Palet' : 'Sayfa')}`;
    }
    return tc.name;
  }

  function applySingleTool(tc) {
    const args = tc.args || {};
    if (tc.name === 'control_studio') {
      store.emit('studio-control', args);
      return true;
    }
    if (tc.name === 'manage_tasks') {
      if (args.action === 'add' && args.text) store.addTask(args.text);
      else if (args.action === 'toggle') store.toggleTaskByQuery(args.text);
      else if (args.action === 'delete') store.removeTaskByQuery(args.text);
      return true;
    }
    if (tc.name === 'manage_vault') {
      if (args.action === 'add') {
        store.addVaultItem({
          title: args.title || 'AI Referans Notu',
          subtitle: args.subtitle || 'AI Ajan Kokpiti · Otonom Kayıt',
          tag: args.tag || 'ai-ux',
          body: args.body || args.title || 'AI tarafından eklendi.',
          highlight: args.highlight || args.title || '',
        });
      } else if (args.action === 'filter' && args.tag) {
        store.emit('vault-filter', args.tag);
      }
      return true;
    }
    if (tc.name === 'manage_shell') {
      if (args.theme) store.setTheme(args.theme);
      if (args.view) store.setView(args.view);
      if (typeof args.magazinePage === 'number') {
        store.setView('portfolio');
        store.emit('portfolio-mag-page', args.magazinePage);
      }
      if (args.openPalette) store.emit('open-palette');
      return true;
    }
    return false;
  }

  // ---- Zero-Overlap Ghost Completion ----
  function getMatchingSuggestion(val) {
    const clean = val.trimStart();
    if (!clean) return '';
    return SUGGESTIONS.find(s => s.toLowerCase().startsWith(clean.toLowerCase())) || '';
  }

  function updateGhost() {
    const val = aiInput.value;
    // Never overlap placeholder when input is empty
    if (!val.trim()) {
      ghostOverlay.style.display = 'none';
      return;
    }
    const match = getMatchingSuggestion(val);
    if (!match || val.length >= match.length) {
      ghostOverlay.style.display = 'none';
      return;
    }
    const rest = match.slice(val.length);
    ghostOverlay.style.display = 'block';
    ghostPrefix.textContent = val;
    ghostLetters.innerHTML = [...rest]
      .slice(0, 44)
      .map((ch, i) => `<span class="gch ok" style="transition-delay:${i * 10}ms">${escapeHtml(ch)}</span>`)
      .join('');
  }

  aiInput.addEventListener('input', updateGhost);
  aiInput.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const match = getMatchingSuggestion(aiInput.value) || (!aiInput.value.trim() ? SUGGESTIONS[0] : '');
      if (match) {
        e.preventDefault();
        aiInput.value = match;
        updateGhost();
        sound.tickSound(0.5);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(aiInput.value);
    }
  });

  function nowTimeStr() {
    return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  function stopActiveRequest() {
    if (!busySending) return;
    abortRequested = true;
    statusNote.textContent = 'İstek durduruluyor...';
    activeAbortCtrl?.abort(new Error('İstek kullanıcı tarafından durduruldu.'));
  }

  stopBtn.addEventListener('click', stopActiveRequest);

  // ---- Main Harness Chat Execution ----
  async function sendMessage(rawPrompt) {
    const text = (rawPrompt || aiInput.value).trim();
    if (!text || busySending) return;

    busySending = true;
    abortRequested = false;
    activeAbortCtrl = new AbortController();
    aiInput.value = '';
    updateGhost();
    toolApproval.hidden = true;
    pendingToolBatch = null;

    store.state.chatHistory.push({ role: 'user', content: text, time: nowTimeStr() });
    if (store.state.chatHistory.length > 40) store.state.chatHistory.shift();
    store.persist();
    renderChatFeed();

    const c = store.state.aiConfig;
    thinking = true;
    syncOrbLiveClass();
    window.Motion?.wake?.();
    gooThinkRow.classList.add('active');
    thinkShimmer.textContent = `${c.model} · Efor: ${getEffortLabel(c.effort)} · Yürütülüyor...`;
    statusNote.textContent = 'Model çalıştırılıyor... (Durdurmak için Esc veya Durdur)';
    store.emit('ai-state', 'thinking');
    store.incrementAiRuns();
    runsChip.textContent = `İstek: ${store.state.aiRuns}`;
    sendBtn.disabled = true;
    sendBtn.hidden = true;
    stopBtn.hidden = false;

    try {
      const payload = {
        provider: c.provider,
        model: c.model,
        effort: c.effort,
        agentMode: c.agentMode,
        autoFallback: c.autoFallback,
        apiKey: c.apiKeys[c.provider] || '',
        baseUrl: c.baseUrl,
        messages: store.state.chatHistory.slice(-14),
        appState: store.getAgentContextSnapshot(),
      };

      let resOk = false;
      let data = null;

      // 1. Use local Python bridge if available (except 100% client-side 'browser' WebGPU/WASM engine)
      if (localBridgeOnline && c.provider !== 'browser') {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: activeAbortCtrl.signal,
          });
          const ctype = res.headers.get('content-type') || '';
          if (ctype.includes('application/json')) {
            data = await res.json();
            resOk = res.ok;
          } else if (res.status === 404 || res.status === 405 || res.status === 502) {
            localBridgeOnline = false;
          }
        } catch (bridgeErr) {
          if (abortRequested || bridgeErr?.name === 'AbortError' || activeAbortCtrl.signal.aborted) {
            throw bridgeErr;
          }
          localBridgeOnline = false;
        }
      }

      // 2. Browser-Direct execution for GitHub Pages / static hosts & client-side WebGPU/WASM
      if (!data) {
        data = await runBrowserChat({
          ...payload,
          signal: activeAbortCtrl.signal,
          onProgress: note => {
            if (!abortRequested && busySending) {
              statusNote.textContent = note;
              thinkShimmer.textContent = note;
            }
          },
        });
        resOk = Boolean(data?.ok);
      }

      thinking = false;
      syncOrbLiveClass();
      gooThinkRow.classList.remove('active');
      store.emit('ai-state', 'idle');

      if (!resOk || !data?.ok) {
        const errMsg = data?.error || 'Modelden yanıt alınamadı.';
        store.state.chatHistory.push({
          role: 'assistant',
          provider: c.provider,
          model: c.model,
          effort: c.effort,
          content: `**Bağlantı Notu:** ${errMsg}`,
          time: nowTimeStr(),
        });
        store.persist();
        renderChatFeed();
        statusNote.textContent = 'Model hatası · Farklı ücretsiz model seçebilirsin';
        return;
      }

      const tcs = Array.isArray(data.toolCalls) ? data.toolCalls : [];
      const shouldAutoExec = c.agentMode === 'build' && c.autoExecute;
      const actionsMeta = tcs.map(tc => ({
        tool: tc.name,
        label: describeToolCall(tc),
        applied: Boolean(shouldAutoExec),
      }));

      if (tcs.length && shouldAutoExec) {
        tcs.forEach(tc => applySingleTool(tc));
        sound.chime(660);
        statusNote.textContent = `${data.model || c.model} · ${tcs.length} araç uygulandı ✓`;
      } else if (tcs.length && !shouldAutoExec) {
        pendingToolBatch = { tcs, msgIndex: store.state.chatHistory.length };
        taName.textContent = tcs.map(t => t.name).join(' + ');
        taSummary.textContent = actionsMeta.map(a => `${a.tool}: ${a.label}`).join(' · ');
        toolApproval.hidden = false;
        statusNote.textContent = 'Araç çalıştırmak için onayın bekleniyor';
      } else {
        sound.chime(560);
        statusNote.textContent = `${data.model || c.model} yanıt verdi`;
      }

      const replyText = data.reply || 'Tamamlandı.';
      store.state.chatHistory.push({
        role: 'assistant',
        provider: data.provider || c.provider,
        model: data.model || c.model,
        effort: c.effort,
        fallbackFrom: data.fallbackFrom || '',
        reasoning: data.reasoning || '',
        tokens: data.tokens || null,
        cost: data.cost ?? 0,
        content: replyText,
        actions: actionsMeta,
        time: nowTimeStr(),
      });
      store.persist();
      renderChatFeed();
      renderWorkspaceContext();

      if (c.ttsReply && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(replyText.replace(/```[\s\S]*?```/g, ' kod bloğu '));
        utt.lang = 'tr-TR';
        window.speechSynthesis.speak(utt);
      }
    } catch (err) {
      thinking = false;
      syncOrbLiveClass();
      gooThinkRow.classList.remove('active');
      store.emit('ai-state', 'idle');

      if (abortRequested || err?.name === 'AbortError' || activeAbortCtrl?.signal?.aborted) {
        store.state.chatHistory.push({
          role: 'assistant',
          provider: 'atelier',
          model: 'harness',
          content: 'İstek kullanıcı tarafından durduruldu.',
          time: nowTimeStr(),
        });
        store.persist();
        renderChatFeed();
        statusNote.textContent = 'İstek durduruldu';
        return;
      }

      const detail = err?.message ? ` (${err.message})` : '';
      store.state.chatHistory.push({
        role: 'assistant',
        provider: 'atelier',
        model: 'harness',
        content: `**Bağlantı Notu:** Model isteği tamamlanamadı${detail}. Üstten başka bir ücretsiz model seçip tekrar deneyebilirsin.`,
        time: nowTimeStr(),
      });
      store.persist();
      renderChatFeed();
      statusNote.textContent = 'Model isteği başarısız · Başka model dene';
    } finally {
      thinking = false;
      syncOrbLiveClass();
      gooThinkRow.classList.remove('active');
      store.emit('ai-state', 'idle');
      busySending = false;
      activeAbortCtrl = null;
      abortRequested = false;
      sendBtn.disabled = false;
      sendBtn.hidden = false;
      stopBtn.hidden = true;
    }
  }

  taApprove.addEventListener('click', () => {
    if (!pendingToolBatch) return;
    pendingToolBatch.tcs.forEach(tc => applySingleTool(tc));
    const entry = store.state.chatHistory[pendingToolBatch.msgIndex];
    if (entry && Array.isArray(entry.actions)) {
      entry.actions.forEach(a => { a.applied = true; });
      store.persist();
      renderChatFeed();
    }
    toolApproval.hidden = true;
    pendingToolBatch = null;
    renderWorkspaceContext();
    sound.chime(698);
    statusNote.textContent = 'Eylemler onaylanıp uygulandı ✓';
  });

  taReject.addEventListener('click', () => {
    if (pendingToolBatch) {
      const entry = store.state.chatHistory[pendingToolBatch.msgIndex];
      if (entry && Array.isArray(entry.actions)) {
        entry.actions.forEach(a => { a.rejected = true; });
        store.persist();
        renderChatFeed();
      }
    }
    toolApproval.hidden = true;
    pendingToolBatch = null;
    statusNote.textContent = 'Araç isteği reddedildi';
    sound.tickSound(0.4);
  });

  sendBtn.addEventListener('click', () => sendMessage(aiInput.value));

  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      aiInput.value = btn.dataset.prompt;
      updateGhost();
      sendMessage(btn.dataset.prompt);
    });
  });

  // ---- Free Offline Local Whisper + Claude-Style Translucent Streaming Dictation ----
  let micStream = null;
  let micCtx = null;
  let micAnalyser = null;
  let micData = null;
  let recognition = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let capturedTranscript = '';
  let speechAssistText = '';
  let chunkInFlight = false;
  let peakMicSinceChunk = 0;
  let lastAiRenderSig = '';
  const liveDictationState = { active: false, phase: 'listening', text: '' };

  function syncOrbLiveClass() {
    orbPanel?.classList.toggle('is-live', Boolean(voiceListening || thinking));
  }

  function updateLiveDictationUI(text, phase = 'listening') {
    liveDictationState.active = true;
    liveDictationState.phase = phase;
    liveDictationState.text = text;
    if (text) {
      aiInput.value = text;
      updateGhost();
    }
    renderChatFeed();
  }

  function clearLiveDictationUI() {
    liveDictationState.active = false;
    liveDictationState.phase = 'listening';
    liveDictationState.text = '';
    renderChatFeed();
  }

  async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function requestWhisperTranscribe(blob, partial) {
    const b64 = await blobToBase64(blob);
    if (!b64) return { ok: false, text: '' };
    const c = store.state.aiConfig;

    if (!localBridgeOnline) {
      if (!partial && c.apiKeys.gemini) {
        return await transcribeBrowserGemini({
          apiKey: c.apiKeys.gemini,
          base64Audio: b64,
          mimeType: blob.type || 'audio/webm',
        });
      }
      return { ok: false, text: '' };
    }

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'whisper',
        apiKey: c.apiKeys.gemini || '',
        audio: b64,
        mimeType: blob.type || 'audio/webm',
        partial,
      }),
    });
    if (!res.ok) return { ok: false, status: res.status, text: '' };
    return await res.json();
  }

  async function startMicMeter() {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        micCtx = new AC();
        const src = micCtx.createMediaStreamSource(micStream);
        micAnalyser = micCtx.createAnalyser();
        micAnalyser.fftSize = 64;
        micData = new Uint8Array(micAnalyser.frequencyBinCount);
        src.connect(micAnalyser);
      }
      return true;
    } catch {
      return false;
    }
  }

  function stopMicMeter() {
    micStream?.getTracks().forEach(t => t.stop());
    micStream = null;
    micCtx?.close().catch(() => {});
    micCtx = null;
    micAnalyser = null;
    micData = null;
    realMicLevel = 0;
  }

  function pickSupportedAudioMime() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
    for (const m of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(m)) return m;
    }
    return '';
  }

  function startRecorderStream() {
    if (!micStream || typeof MediaRecorder === 'undefined') return false;
    audioChunks = [];
    chunkInFlight = false;
    peakMicSinceChunk = 0;

    const mime = pickSupportedAudioMime();
    try {
      mediaRecorder = mime ? new MediaRecorder(micStream, { mimeType: mime }) : new MediaRecorder(micStream);
    } catch {
      mediaRecorder = new MediaRecorder(micStream);
    }

    mediaRecorder.ondataavailable = async e => {
      if (!e.data || e.data.size === 0) return;
      audioChunks.push(e.data);

      // Stream live translucent Whisper partial chunks while speaking (Zen + Chromium)
      if (!voiceListening || chunkInFlight || peakMicSinceChunk < 0.03) return;
      peakMicSinceChunk = 0;
      chunkInFlight = true;
      try {
        const snapshot = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        const out = await requestWhisperTranscribe(snapshot, true);
        if (voiceListening && out?.ok && out.text) {
          capturedTranscript = out.text;
          updateLiveDictationUI(out.text, 'listening');
          statusNote.textContent = 'Canlı dikte akıyor... (bitirmek için tekrar tıkla)';
        }
      } catch {
        /* ignore transient partial error */
      } finally {
        chunkInFlight = false;
      }
    };

    mediaRecorder.onstop = async () => {
      const fullBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      stopMicMeter();

      let finalText = (capturedTranscript || speechAssistText || '').trim();
      updateLiveDictationUI(finalText || 'Ses çözümleniyor...', 'refining');
      statusNote.textContent = 'Ses netleştiriliyor (Whisper)...';

      try {
        const out = await requestWhisperTranscribe(fullBlob, false);
        if (out?.ok && out.text && out.text.trim()) {
          finalText = out.text.trim();
        }
      } catch {
        /* keep best partial or browser assist text */
      }

      clearLiveDictationUI();
      capturedTranscript = '';
      speechAssistText = '';

      if (!finalText) {
        statusNote.textContent = 'Konuşma algılanamadı — tekrar deneyebilirsin';
        return;
      }

      if (store.state.aiConfig.autoSendVoice) {
        await sendMessage(finalText);
      } else {
        aiInput.value = finalText;
        updateGhost();
        aiInput.focus();
        statusNote.textContent = 'Dikte tamamlandı ✓ (düzenleyip gönderebilirsin)';
      }
    };

    try {
      mediaRecorder.start(1800);
      return true;
    } catch {
      return false;
    }
  }

  function stopVoiceSession() {
    voiceListening = false;
    syncOrbLiveClass();
    voiceBtn.classList.remove('active');
    voiceLabel.textContent = 'Sesli Dikteyi Başlat';
    voiceGainS.t = 0;

    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    } else {
      stopMicMeter();
      clearLiveDictationUI();
    }
  }

  async function toggleVoice() {
    if (voiceListening) {
      stopVoiceSession();
      return;
    }

    const hasMic = await startMicMeter();
    if (!hasMic) {
      statusNote.textContent = 'Mikrofon izni verilmedi veya cihaz bulunamadı.';
      return;
    }

    voiceListening = true;
    capturedTranscript = '';
    speechAssistText = '';
    syncOrbLiveClass();
    window.Motion?.wake?.();
    voiceBtn.classList.add('active');
    voiceLabel.textContent = 'Dinleniyor... (Bitir)';
    voiceGainS.t = 1;
    updateLiveDictationUI('', 'listening');
    statusNote.textContent = 'Mikrofon açık — konuşabilirsin...';
    sound.tickSound(0.8);

    const recorderStarted = startRecorderStream();

    // Optional instant Web Speech assist (fails silently in Zen/offline while Whisper handles everything)
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        recognition = new SpeechRec();
        recognition.lang = 'tr-TR';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = event => {
          if (!voiceListening) return;
          let txt = '';
          for (let i = 0; i < event.results.length; i++) {
            txt += event.results[i][0].transcript + ' ';
          }
          const clean = txt.trim();
          if (clean) {
            speechAssistText = clean;
            if (!capturedTranscript || clean.length >= capturedTranscript.length) {
              updateLiveDictationUI(clean, 'listening');
            }
          }
        };
        recognition.onerror = () => {
          try { recognition?.stop(); } catch {}
          recognition = null;
        };
        recognition.start();
      } catch {
        recognition = null;
      }
    } else if (!recorderStarted) {
      stopVoiceSession();
      statusNote.textContent = 'Tarayıcı ses kaydını başlatamadı.';
    }
  }

  voiceBtn.addEventListener('click', toggleVoice);
  orbWrap.addEventListener('pointerdown', () => { orbPressS.v = -2.2; });
  orbWrap.addEventListener('click', toggleVoice);

  store.on('ai-focus-input', () => aiInput.focus());
  ['tasks', 'vault', 'theme', 'exposure', 'dialMix', 'studio-control', 'github'].forEach(ev => {
    store.on(ev, renderWorkspaceContext);
  });

  syncHarnessUI();
  renderWorkspaceContext();
  renderChatFeed();
  updateGhost();
  loadModels();

  // ---- Active-only rAF loop (zero DOM updates when idle) ----
  register({
    active: () => store.state.activeView === 'ai',
    running: () => voiceListening || thinking,
    frame(dt) {
      if (voiceListening || thinking) orbClock += dt;
      if (voiceListening && micAnalyser && micData) {
        micAnalyser.getByteTimeDomainData(micData);
        let sum = 0;
        for (let i = 0; i < micData.length; i++) {
          const d = (micData[i] - 128) / 128;
          sum += d * d;
        }
        const rms = Math.sqrt(sum / micData.length);
        if (rms > peakMicSinceChunk) peakMicSinceChunk = rms;
        realMicLevel = clamp(rms * 3.8, 0.08, 1);
        voiceGainS.t = realMicLevel;
      }
      step(voiceGainS, dt);
      step(orbPressS, dt);
    },
    render() {
      const g = clamp(voiceGainS.x, 0, 1);
      const moving =
        voiceListening ||
        thinking ||
        g > 0.01 ||
        Math.abs(orbPressS.x - 1) > 0.002 ||
        Math.abs(orbPressS.v) > 0.01;
      const sig = moving
        ? `${voiceListening}|${thinking}|${g.toFixed(3)}|${orbPressS.x.toFixed(3)}|${orbClock.toFixed(2)}`
        : 'idle';
      if (sig === lastAiRenderSig) return;
      lastAiRenderSig = sig;

      const thinkBoost = thinking ? 0.07 * Math.sin(orbClock * 5) : 0;
      const orbScale = clamp(orbPressS.x + g * 0.14 + thinkBoost, 0.86, 1.24);
      siriOrb.style.transform = `scale(${orbScale.toFixed(4)})`;
      siriGlow.style.opacity = (0.35 + g * 0.48 + (thinking ? 0.25 : 0)).toFixed(3);
      siriGlow.style.transform = `scale(${(1 + g * 0.24).toFixed(3)})`;

      if (voiceListening) {
        waveBars.forEach((b, i) => {
          const v = 0.2 + g * (0.45 + 0.55 * Math.abs(Math.sin(orbClock * 7 + i * 0.7)));
          b.style.transform = `scaleY(${clamp(v, 0.16, 1).toFixed(3)})`;
        });
      } else {
        waveBars.forEach(b => { b.style.transform = 'scaleY(0.18)'; });
      }

      if (thinking) {
        const phases = [0, 2.094, 4.188];
        gDots.forEach((dot, i) => {
          const t = orbClock * 3.4 + phases[i];
          const dx = Math.sin(t) * 18;
          const sc = 0.85 + Math.cos(t * 1.4) * 0.22;
          dot.style.transform = `translateX(${dx.toFixed(2)}px) scale(${sc.toFixed(3)})`;
        });
      }
    },
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
