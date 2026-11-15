/**
 * Browser-Direct AI & Model Catalog Engine for Atelier OS.
 * Enables full AI chat, reasoning traces, tool calling, and model discovery
 * directly on static hosts (GitHub Pages) without requiring server.py.
 */

const ATELIER_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'control_studio',
      description: 'Odak & Ses Stüdyosunu kontrol eder (ses oynatma, parça değiştirme, filtre, pozlama, pomodoro).',
      parameters: {
        type: 'object',
        properties: {
          playing: { type: 'boolean', description: 'Ortam sesini başlat (true) veya duraklat (false)' },
          trackIdx: { type: 'integer', description: '0: Gece Yağmuru, 1: Obsidian Lo-Fi, 2: Derin Yörünge, 3: Atölye Şöminesi' },
          dialMix: { type: 'integer', description: 'Lowpass kadran yüzdesi (0-100)' },
          exposure: { type: 'number', description: 'Işık / pozlama değeri (0.0 - 1.0)' },
          pomodoroAction: { type: 'string', enum: ['start', 'pause', 'reset'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'manage_tasks',
      description: 'Odak Stüdyosundaki görev listesine görev ekler, tamamlar veya siler.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'toggle', 'delete'] },
          text: { type: 'string', description: 'Görev metni veya arama ifadesi' },
        },
        required: ['action', 'text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'manage_vault',
      description: 'Fikir Kasasına yeni tasarım/proje fikri ekler veya etiket filtreler.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'filter'] },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          tag: { type: 'string' },
          body: { type: 'string' },
          highlight: { type: 'string' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'manage_shell',
      description: 'Aktif sayfayı değiştirir, temayı karanlık/aydınlık yapar, 3D dergi sayfasını çevirir veya komut paletini açar.',
      parameters: {
        type: 'object',
        properties: {
          view: { type: 'string', enum: ['studio', 'ai', 'portfolio', 'vault'] },
          theme: { type: 'string', enum: ['dark', 'light'] },
          magazinePage: { type: 'integer', description: 'Dergi yayılım sayfası (0, 1, 2)' },
          openPalette: { type: 'boolean' },
        },
      },
    },
  },
];

export const BROWSER_LOCAL_MODELS = [
  { id: 'onnx-community/Qwen2.5-0.5B-Instruct', name: 'Qwen 2.5 0.5B (Tarayıcı İçi Yerel AI)', provider: 'browser', free: true, reasoning: false, tools: false, supportsVariant: false, multimodal: false, context: 32768, description: '%100 tarayıcında çalışır · Ortak limit YOK (~467 MB WebGPU / ~756 MB WASM)' },
  { id: 'HuggingFaceTB/SmolLM2-360M-Instruct', name: 'SmolLM2 360M (Hafif Tarayıcı İçi AI)', provider: 'browser', free: true, reasoning: false, tools: false, supportsVariant: false, multimodal: false, context: 8192, description: 'Ultra hafif · Başkasıyla limit paylaşmaz (~262 MB WebGPU / ~372 MB WASM)' },
];

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Groq · Llama 3.3 70B Versatile', provider: 'groq', free: true, reasoning: false, tools: true, supportsVariant: false, multimodal: false, context: 128000, description: 'Ücretsiz kendi Groq anahtarınla günde 14.400 istek · Kişiye özel izole limit' },
  { id: 'llama-3.1-8b-instant', name: 'Groq · Llama 3.1 8B Instant', provider: 'groq', free: true, reasoning: false, tools: true, supportsVariant: false, multimodal: false, context: 128000, description: 'Ultra hızlı ücretsiz kendi Groq API anahtarınla anında yanıt' },
  { id: 'qwen/qwen3-32b', name: 'Groq · Qwen3 32B Reasoning', provider: 'groq', free: true, reasoning: true, tools: true, supportsVariant: true, multimodal: false, context: 131072, description: 'Ücretsiz kendi Groq anahtarınla derin akıl yürütme' },
];

export const WEB_FREE_MODELS = [
  { id: 'openai-fast', name: 'GPT-OSS 20B Reasoning (Pollinations)', provider: 'pollinations', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 128000, description: 'Ziyaretçi IP\'sine özel ücretsiz (45sn limit veya kendi Pollen key\'inle limitsiz)' },
  { id: 'openai', name: 'Pollinations · OpenAI Router', provider: 'pollinations', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 128000, description: 'Ziyaretçi IP\'sine özel Pollinations genel model yönlendiricisi' },
  { id: 'mistral', name: 'Pollinations · Mistral Small', provider: 'pollinations', free: true, reasoning: false, tools: true, supportsVariant: false, multimodal: false, context: 128000, description: 'Akıcı metin ve kod yanıtları (IP başına özel limit)' },
  { id: 'codestral-latest', name: 'Codestral Latest (LLM7)', provider: 'llm7', free: true, reasoning: false, tools: true, supportsVariant: false, multimodal: false, context: 256000, description: 'Hızlı kod & sohbet (Paylaşımlı ücretsiz havuz veya kendi ücretsiz LLM7 token\'ın)' },
  { id: 'gpt-oss:20b', name: 'GPT-OSS 20B (LLM7)', provider: 'llm7', free: true, reasoning: false, tools: true, supportsVariant: false, multimodal: false, context: 128000, description: 'Açık ağırlıklı 20B genel amaçlı model (kendi LLM7 token\'ınla kişisel limit)' },
  { id: 'mistral-Nemo-Instruct-2407', name: 'Mistral Nemo (LLM7)', provider: 'llm7', free: true, reasoning: false, tools: false, supportsVariant: false, multimodal: false, context: 128000, description: 'Hızlı ve hafif Mistral sohbet modeli' },
  { id: 'glm-5.3-flash', name: 'GLM 5.3 Flash (LLM7)', provider: 'llm7', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 200000, description: 'Ücretsiz Zhipu GLM flash reasoning modeli' },
];

const LLM7_REASONING_MODELS = new Set(['glm-5.3-flash']);

const BROWSER_FAILOVER_POOL = [
  ['pollinations', 'openai-fast'],
  ['pollinations', 'openai'],
  ['llm7', 'codestral-latest'],
  ['llm7', 'gpt-oss:20b'],
];

function effortDirective(effort) {
  const map = {
    low: 'EFOR SEVİYESİ: LOW — Kısa, doğrudan ve hızlı yanıt ver; gereksiz uzatma.',
    medium: 'EFOR SEVİYESİ: MEDIUM — Dengeli analiz ve net adımlarla yanıt ver.',
    high: 'EFOR SEVİYESİ: HIGH — Cevaplamadan önce problemi derinlemesine irdele, kenar durumları doğrula ve kapsamlı ama özlü sun.',
    max: 'EFOR SEVİYESİ: MAX — Azami derinlikte teknik analiz, akıl yürütme ve doğrulama yap.',
  };
  return map[effort] || '';
}

function buildSystemPrompt(appState, effort = 'auto', agentMode = 'build') {
  const stateJson = JSON.stringify(appState || {});
  const effortLine = effortDirective(effort);
  const modeNote =
    agentMode === 'chat'
      ? 'AJAN MODU: CHAT (Salt Sohbet) — Bu modda site aracı ÇAĞIRMA, yalnızca kullanıcıyla sohbet et.'
      : 'AJAN MODU: Site kontrolü istendiğinde ilgili araçları kullan; aksi halde doğal sohbet et.';
  return (
    "Sen Atelier OS'in içinde çalışan üst düzey, OpenCode harness mimarisinden ilham alan bir yapay zeka ajanısın.\n" +
    'Kullanıcıyla her konuda (kodlama, mimari, tasarım, günlük sohbet, araştırma) tam kapsamlı gerçek konuşabilirsin.\n' +
    `${effortLine}\n${modeNote}\n` +
    `Sitenin canlı durumu:\n${stateJson}\n\n` +
    'Site üzerinde gerçek değişiklik yapmak gerektiğinde tanımlı araçları kullan (control_studio, manage_tasks, manage_vault, manage_shell). ' +
    'Araç şeması desteklenmiyorsa veya metin içi eylem gerekirse yanıtın son satırlarına ' +
    '`<atelier_action>{"name": "control_studio", "args": {"playing": true}}</atelier_action>` şeklinde JSON etiketi yazabilirsin.\n' +
    'Kullanıcı sadece soru soruyorsa veya sohbet ediyorsa araç etiketi EKLEME. Yanıtlarını Türkçe (veya kullanıcının dilinde) ver.'
  );
}

function extractInlineActions(text) {
  const actions = [];
  const re = /<atelier_action>\s*(\{[\s\S]*?\})\s*<\/atelier_action>/g;
  const cleaned = String(text || '').replace(re, (_, raw) => {
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object' && obj.name) {
        actions.push({ id: `inline_${actions.length}`, name: obj.name, args: obj.args || {} });
      }
    } catch {
      /* ignore malformed inline tag */
    }
    return '';
  }).trim();
  return { cleaned, actions };
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 20000, externalSignal = null) {
  if (externalSignal?.aborted) {
    const abortErr = new Error('İstek kullanıcı tarafından durduruldu.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  const ctrl = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => ctrl.abort(externalSignal.reason || new Error('İstek kullanıcı tarafından durduruldu.'));
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort(new Error('Zaman aşımı'));
  }, timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON body */ }
    if (!res.ok) {
      const detail = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : '') || text.slice(0, 260);
      const err = new Error(`Sağlayıcı hatası (${res.status}): ${detail || res.statusText}`);
      err.status = res.status;
      throw err;
    }
    if (!json) throw new Error('Sunucudan geçersiz JSON yanıtı döndü.');
    return json;
  } catch (err) {
    if (externalSignal?.aborted) {
      const abortErr = new Error('İstek kullanıcı tarafından durduruldu.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    if (timedOut || err?.name === 'AbortError') {
      const timeoutErr = new Error(`İstek ${Math.round(timeoutMs / 1000)}sn içinde yanıt vermedi (zaman aşımı).`);
      timeoutErr.status = 408;
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

async function callOpenAiLikeDirect({
  endpoint,
  apiKey,
  model,
  messages,
  appState,
  effort,
  agentMode,
  extraHeaders = {},
  sendTools = true,
  sendEffort = true,
  timeoutMs = 20000,
  signal = null,
  noReferrer = false,
}) {
  const sysMsg = { role: 'system', content: buildSystemPrompt(appState, effort, agentMode) };
  const cleanMsgs = [sysMsg, ...(messages || []).slice(-18).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: String(m.content || '') }))];

  const payload = { model, messages: cleanMsgs, temperature: 0.7 };
  if (sendEffort) {
    if (effort === 'low' || effort === 'medium' || effort === 'high') payload.reasoning_effort = effort;
    else if (effort === 'max') payload.reasoning_effort = 'high';
  }
  if (sendTools && agentMode !== 'chat') {
    payload.tools = ATELIER_TOOLS;
    payload.tool_choice = 'auto';
  }

  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const fetchOpts = { method: 'POST', headers, body: JSON.stringify(payload) };
  if (noReferrer) fetchOpts.referrerPolicy = 'no-referrer';

  const data = await fetchJsonWithTimeout(endpoint, fetchOpts, timeoutMs, signal);
  const msg = data?.choices?.[0]?.message || {};
  const toolCalls = [];

  if (agentMode !== 'chat' && Array.isArray(msg.tool_calls)) {
    for (const tc of msg.tool_calls) {
      const fn = tc.function || {};
      let args = {};
      try { args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments || '{}') : (fn.arguments || {}); } catch {}
      if (fn.name) toolCalls.push({ id: tc.id || `tc_${toolCalls.length}`, name: fn.name, args });
    }
  }

  const { cleaned, actions } = extractInlineActions(msg.content || '');
  if (agentMode !== 'chat') toolCalls.push(...actions);
  const usage = data?.usage;
  return {
    ok: true,
    reply: cleaned || (toolCalls.length ? 'İstediğin eylemler hazırlandı.' : 'Tamamlandı.'),
    reasoning: msg.reasoning_content || msg.reasoning || '',
    toolCalls,
    tokens: usage ? { input: usage.prompt_tokens || 0, output: usage.completion_tokens || 0 } : null,
    cost: 0,
    model,
  };
}

async function callWithOptionalTools(opts) {
  const initialTools = opts.allowTools ?? true;
  const initialEffort = opts.allowEffort ?? true;
  try {
    return await callOpenAiLikeDirect({ ...opts, sendTools: initialTools, sendEffort: initialEffort });
  } catch (err) {
    if (err?.name === 'AbortError' || opts.signal?.aborted) throw err;
    if (err?.status === 400 && (initialTools || initialEffort)) {
      return await callOpenAiLikeDirect({ ...opts, sendTools: false, sendEffort: false });
    }
    throw err;
  }
}

async function callGeminiDirect({ apiKey, model, messages, appState, effort, agentMode, signal = null }) {
  const cleanModel = (model || 'gemini-2.5-flash').replace(/^models\//, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const contents = (messages || []).slice(-18).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }],
  }));
  const payload = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(appState, effort, agentMode) }] },
    contents,
    generationConfig: { temperature: 0.7 },
  };
  if (cleanModel.includes('2.5')) {
    const budgets = { low: 1024, medium: 4096, high: 8192, max: 16384 };
    if (budgets[effort]) payload.generationConfig.thinkingConfig = { thinkingBudget: budgets[effort], includeThoughts: true };
  }
  if (agentMode !== 'chat') {
    payload.tools = [{ functionDeclarations: ATELIER_TOOLS.map(t => t.function) }];
  }

  const data = await fetchJsonWithTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 30000, signal);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const textParts = [];
  const reasonParts = [];
  const toolCalls = [];

  for (const p of parts) {
    if (p.thought && p.text) reasonParts.push(p.text);
    else if (p.text) textParts.push(p.text);
    if (agentMode !== 'chat' && p.functionCall?.name) {
      toolCalls.push({ id: `gem_${toolCalls.length}`, name: p.functionCall.name, args: p.functionCall.args || {} });
    }
  }
  const { cleaned, actions } = extractInlineActions(textParts.join(''));
  if (agentMode !== 'chat') toolCalls.push(...actions);
  const usage = data?.usageMetadata;
  return {
    ok: true,
    reply: cleaned || (toolCalls.length ? 'İstediğin eylemler hazırlandı.' : 'Tamamlandı.'),
    reasoning: reasonParts.join('\n').trim(),
    toolCalls,
    tokens: usage ? { input: usage.promptTokenCount || 0, output: usage.candidatesTokenCount || 0 } : null,
    cost: 0,
    model: cleanModel,
  };
}

async function callAnthropicDirect({ apiKey, model, messages, appState, effort, agentMode, signal = null }) {
  const cleanMsgs = (messages || []).slice(-18).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: String(m.content || '') }));
  const payload = {
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: buildSystemPrompt(appState, effort, agentMode),
    messages: cleanMsgs,
  };
  if (effort === 'high' || effort === 'max') {
    payload.thinking = { type: 'enabled', budget_tokens: effort === 'max' ? 4096 : 2048 };
  }
  if (agentMode !== 'chat') {
    payload.tools = ATELIER_TOOLS.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
  }

  const data = await fetchJsonWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(payload),
  }, 30000, signal);

  const textParts = [];
  const reasonParts = [];
  const toolCalls = [];
  for (const blk of data?.content || []) {
    if (blk.type === 'thinking' && blk.thinking) reasonParts.push(blk.thinking);
    else if (blk.type === 'text' && blk.text) textParts.push(blk.text);
    else if (agentMode !== 'chat' && blk.type === 'tool_use' && blk.name) {
      toolCalls.push({ id: blk.id || `ant_${toolCalls.length}`, name: blk.name, args: blk.input || {} });
    }
  }
  const { cleaned, actions } = extractInlineActions(textParts.join('\n'));
  if (agentMode !== 'chat') toolCalls.push(...actions);
  const usage = data?.usage;
  return {
    ok: true,
    reply: cleaned || (toolCalls.length ? 'İstediğin eylemler hazırlandı.' : 'Tamamlandı.'),
    reasoning: reasonParts.join('\n').trim(),
    toolCalls,
    tokens: usage ? { input: usage.input_tokens || 0, output: usage.output_tokens || 0 } : null,
    cost: 0,
    model: payload.model,
  };
}

const localBrowserPipelines = new Map();
let transformersModPromise = null;

async function callBrowserLocalModel({ model, messages, appState, effort, agentMode, signal = null, onProgress = null }) {
  if (signal?.aborted) {
    const abortErr = new Error('İstek kullanıcı tarafından durduruldu.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  const modelId = model || 'onnx-community/Qwen2.5-0.5B-Instruct';
  onProgress?.('Tarayıcı İçi Yerel AI motoru yükleniyor...');

  if (!transformersModPromise) {
    transformersModPromise = import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3');
  }
  const tf = await transformersModPromise;
  if (signal?.aborted) {
    const abortErr = new Error('İstek kullanıcı tarafından durduruldu.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  let pipe = localBrowserPipelines.get(modelId);
  if (!pipe) {
    const loadPipeline = async deviceOpts =>
      tf.pipeline('text-generation', modelId, {
        ...deviceOpts,
        progress_callback: info => {
          if (signal?.aborted) return;
          if (info?.status === 'progress' && typeof info.progress === 'number') {
            onProgress?.(`Model önbelleğe indiriliyor (%${Math.round(info.progress)}) — sonraki açılışta anında hazır`);
          } else if (info?.status === 'initiate' && info.file) {
            onProgress?.(`Yerel model dosyası hazırlanıyor: ${info.file.split('/').pop()}`);
          } else if (info?.status === 'ready') {
            onProgress?.('Yerel tarayıcı modeli hazırlandı, yanıt üretiliyor...');
          }
        },
      });

    try {
      const hasWebGpu = typeof navigator !== 'undefined' && Boolean(navigator.gpu);
      pipe = await loadPipeline(hasWebGpu ? { device: 'webgpu', dtype: 'q4f16' } : { device: 'wasm', dtype: 'q4' });
    } catch {
      pipe = await loadPipeline({ device: 'wasm', dtype: 'q4' });
    }
    localBrowserPipelines.set(modelId, pipe);
  }

  if (signal?.aborted) {
    const abortErr = new Error('İstek kullanıcı tarafından durduruldu.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  onProgress?.(`${modelId.split('/').pop()} tarayıcında yanıt üretiyor...`);

  const chatMsgs = [
    { role: 'system', content: buildSystemPrompt(appState, effort, agentMode) },
    ...(messages || [])
      .slice(-8)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content || '') })),
  ];

  const genOpts = {
    max_new_tokens: effort === 'low' ? 160 : effort === 'max' ? 512 : 320,
    do_sample: true,
    temperature: 0.65,
    top_p: 0.9,
  };

  let onAbortStop = null;
  if (signal && tf.InterruptableStoppingCriteria) {
    const stopper = new tf.InterruptableStoppingCriteria();
    onAbortStop = () => stopper.interrupt();
    signal.addEventListener('abort', onAbortStop, { once: true });
    genOpts.stopping_criteria = tf.StoppingCriteriaList ? new tf.StoppingCriteriaList([stopper]) : [stopper];
  }

  let output;
  try {
    output = await pipe(chatMsgs, genOpts);
  } finally {
    if (onAbortStop) signal?.removeEventListener('abort', onAbortStop);
  }

  if (signal?.aborted) {
    const abortErr = new Error('İstek kullanıcı tarafından durduruldu.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  const generated = output?.[0]?.generated_text;
  const lastContent = Array.isArray(generated)
    ? String(generated[generated.length - 1]?.content || '')
    : String(generated || '');
  const { cleaned, actions } = extractInlineActions(lastContent.trim());

  return {
    ok: true,
    reply: cleaned || (actions.length ? 'İstediğin eylemler hazırlandı.' : 'Tamamlandı.'),
    reasoning: '',
    toolCalls: agentMode === 'chat' ? [] : actions,
    tokens: null,
    cost: 0,
    model: modelId,
    provider: 'browser',
  };
}

function formatFriendlyRateError(provider, err) {
  const msg = String(err?.message || '');
  if (provider === 'pollinations' && (err?.status === 402 || msg.includes('FREE_LIMIT'))) {
    const waitMatch = msg.match(/Retry after\s+(\d+s)/i);
    const waitTxt = waitMatch ? `${waitMatch[1]} bekle veya ` : '';
    return new Error(`Pollinations IP bekleme süresi (${waitTxt}Ayarlar'a kendi ücretsiz Pollen key'ini ekle ya da "Tarayıcı İçi Yerel AI" kullan).`);
  }
  if (provider === 'llm7' && (err?.status === 429 || msg.toLowerCase().includes('quota'))) {
    return new Error('LLM7 paylaşımlı ücretsiz havuzu şu an küresel olarak dolu (429). Kişiye özel tam izole limit için Ayarlar\'a kendi LLM7/Groq/Gemini anahtarını gir veya "Tarayıcı İçi Yerel AI" seç.');
  }
  return err;
}

async function runSingleBrowserProvider(req) {
  const { provider, model, effort, agentMode, apiKey, baseUrl, messages, appState, signal = null, onProgress = null } = req;

  if (provider === 'browser') {
    return await callBrowserLocalModel({ model, messages, appState, effort, agentMode, signal, onProgress });
  }

  if (provider === 'llm7') {
    const chosenModel = model || 'codestral-latest';
    const allowEffort = LLM7_REASONING_MODELS.has(chosenModel);
    try {
      const out = await callWithOptionalTools({
        endpoint: 'https://api.llm7.io/v1/chat/completions',
        apiKey: apiKey || '',
        model: chosenModel,
        messages,
        appState,
        effort,
        agentMode,
        allowEffort,
        timeoutMs: 9000,
        signal,
        noReferrer: !apiKey,
      });
      return { ...out, provider: 'llm7' };
    } catch (err) {
      throw formatFriendlyRateError('llm7', err);
    }
  }

  if (provider === 'pollinations') {
    try {
      const out = await callWithOptionalTools({
        endpoint: 'https://text.pollinations.ai/openai',
        apiKey: apiKey || '',
        model: model || 'openai-fast',
        messages,
        appState,
        effort,
        agentMode,
        timeoutMs: 14000,
        signal,
        noReferrer: !apiKey,
      });
      return { ...out, provider: 'pollinations' };
    } catch (err) {
      throw formatFriendlyRateError('pollinations', err);
    }
  }

  if (provider === 'groq') {
    if (!apiKey) throw new Error('Groq için ücretsiz kişisel API anahtarı gerekiyor (console.groq.com).');
    const chosenModel = model || 'llama-3.3-70b-versatile';
    const out = await callWithOptionalTools({
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey,
      model: chosenModel,
      messages,
      appState,
      effort,
      agentMode,
      allowEffort: chosenModel.includes('qwen'),
      timeoutMs: 20000,
      signal,
    });
    return { ...out, provider: 'groq' };
  }

  if (provider === 'gemini') {
    if (!apiKey) throw new Error('Gemini için API anahtarı gerekiyor.');
    const out = await callGeminiDirect({ apiKey, model, messages, appState, effort, agentMode, signal });
    return { ...out, provider: 'gemini' };
  }

  if (provider === 'anthropic') {
    if (!apiKey) throw new Error('Claude (Anthropic) için API anahtarı gerekiyor.');
    const out = await callAnthropicDirect({ apiKey, model, messages, appState, effort, agentMode, signal });
    return { ...out, provider: 'anthropic' };
  }

  if (provider === 'openrouter') {
    if (!apiKey) throw new Error('OpenRouter için API anahtarı gerekiyor.');
    const out = await callWithOptionalTools({
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey,
      model,
      messages,
      appState,
      effort,
      agentMode,
      extraHeaders: { 'HTTP-Referer': location.origin, 'X-Title': 'Atelier OS' },
      signal,
    });
    return { ...out, provider: 'openrouter' };
  }

  if (provider === 'openai' || provider === 'custom') {
    if (provider === 'openai' && !apiKey) throw new Error('OpenAI için API anahtarı gerekiyor.');
    let ep = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    if (!ep.endsWith('/chat/completions')) ep = `${ep}/chat/completions`;
    const out = await callWithOptionalTools({ endpoint: ep, apiKey, model, messages, appState, effort, agentMode, signal });
    return { ...out, provider };
  }

  if (provider === 'ollama') {
    const cleanMsgs = [
      { role: 'system', content: buildSystemPrompt(appState, effort, agentMode) },
      ...(messages || []).slice(-18).map(m => ({ role: m.role, content: String(m.content || '') })),
    ];
    const data = await fetchJsonWithTimeout('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: cleanMsgs, stream: false }),
    }, 60000, signal);
    const { cleaned, actions } = extractInlineActions(data?.message?.content || '');
    return { ok: true, reply: cleaned, reasoning: '', toolCalls: agentMode === 'chat' ? [] : actions, tokens: null, cost: 0, model, provider: 'ollama' };
  }

  throw new Error(`Statik web ortamında '${provider}' doğrudan tarayıcıdan desteklenmiyor.`);
}

/**
 * Runs chat directly in browser when local server.py bridge is absent (GitHub Pages).
 * Respects AbortSignal immediately and isolates visitor limits per user/IP/local engine.
 */
export async function runBrowserChat(req) {
  const { provider, model, autoFallback = true, signal = null, onProgress = null } = req;

  if (provider !== 'opencode') {
    try {
      return await runSingleBrowserProvider(req);
    } catch (primaryErr) {
      if (primaryErr?.name === 'AbortError' || signal?.aborted) throw primaryErr;
      const canFailover = autoFallback && !req.apiKey && (provider === 'llm7' || provider === 'pollinations');
      if (!canFailover) throw primaryErr;
      for (const [altProv, altModel] of BROWSER_FAILOVER_POOL) {
        if (signal?.aborted) throw primaryErr;
        if (altProv === provider && altModel === model) continue;
        try {
          onProgress?.(`${altModel} yedek rotası deneniyor...`);
          const res = await runSingleBrowserProvider({ ...req, provider: altProv, model: altModel, apiKey: '' });
          return { ...res, fallbackFrom: `${provider}/${model}` };
        } catch (altErr) {
          if (altErr?.name === 'AbortError' || signal?.aborted) throw altErr;
          /* try remaining pool */
        }
      }
      throw primaryErr;
    }
  }

  // OpenCode Zen CLI models require local server.py; on static GitHub Pages route cleanly via per-visitor CORS pool
  if (!autoFallback) {
    throw new Error('OpenCode Zen modelleri yerel bridge (server.py) gerektirir. GitHub Pages üzerinden kendi özel limitinle devam etmek için Tarayıcı İçi Yerel AI, Pollinations veya Groq seç.');
  }

  let lastErr = null;
  for (const [altProv, altModel] of BROWSER_FAILOVER_POOL) {
    if (signal?.aborted) {
      const abortErr = new Error('İstek kullanıcı tarafından durduruldu.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    try {
      onProgress?.(`GitHub Pages tarayıcı rotası: ${altModel}...`);
      const res = await runSingleBrowserProvider({ ...req, provider: altProv, model: altModel, apiKey: '' });
      return { ...res, fallbackFrom: `opencode/${model}` };
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) throw err;
      lastErr = err;
    }
  }
  throw lastErr || new Error('Ücretsiz web havuzunda şu an kota/bekleme süresi dolu. Kesintisiz limitsiz deneyim için "Tarayıcı İçi Yerel AI" modelini veya kendi ücretsiz Groq/Gemini anahtarını seçebilirsin.');
}

export async function fetchStaticModelCatalog({ baseSections = [], apiKey = '', provider = 'opencode' } = {}) {
  const webModels = [...WEB_FREE_MODELS];
  const seen = new Set(webModels.map(m => `${m.provider}:${m.id}`));

  // Live discover free non-usage-locked models from CORS-enabled LLM7
  try {
    const res = await fetch('https://api.llm7.io/v1/models', {
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout?.(3500),
    });
    if (res.ok) {
      const data = await res.json();
      const skipStalled = new Set(['minimax-m2.7', 'DeepSeek-V4-Flash-0731']);
      for (const m of data?.data || []) {
        if (m.usage_based_only || skipStalled.has(m.id)) continue;
        const key = `llm7:${m.id}`;
        if (!m.id || seen.has(key)) continue;
        seen.add(key);
        const supportsReason = Boolean(m.capabilities?.reasoning);
        if (supportsReason) LLM7_REASONING_MODELS.add(m.id);
        webModels.push({
          id: m.id,
          name: `${m.id} (LLM7)`,
          provider: 'llm7',
          free: true,
          reasoning: supportsReason,
          tools: Boolean(m.capabilities?.tools ?? m.tools_calling),
          supportsVariant: false,
          multimodal: Boolean(m.capabilities?.vision),
          context: m.context_window?.tokens || 128000,
          description: 'Canlı LLM7 ücretsiz tarayıcı modeli (kendi token\'ınla kişisel limit)',
        });
      }
    }
  } catch { /* ignore */ }

  // Live discover OpenCode catalog metadata (display only; runs locally via server.py)
  let opencodeFree = baseSections.find(s => s.key === 'opencode_free')?.models || [];
  let opencodePro = [];
  try {
    const res = await fetch('https://opencode.ai/zen/v1/models', { signal: AbortSignal.timeout?.(3500) });
    if (res.ok) {
      const data = await res.json();
      const parsed = (data?.data || []).filter(m => m.id).map(m => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'opencode',
        free: ((m.cost?.text?.input?.price ?? 1) === 0) || m.id.endsWith('-free') || m.id === 'big-pickle',
        reasoning: Boolean(m.capabilities?.reasoning?.supported),
        tools: Boolean(m.capabilities?.tools?.supported ?? true),
        supportsVariant: Boolean(m.capabilities?.effort_updates),
        multimodal: (m.modalities?.input || []).some(x => x.startsWith('image/')),
        context: m.limit?.context || 128000,
        description: `${(m.description || '').trim()} (GitHub Pages'te web havuzuna otomatik yönlenir)`.trim(),
      }));
      if (parsed.length) {
        opencodeFree = parsed.filter(m => m.free);
        opencodePro = parsed.filter(m => !m.free);
      }
    }
  } catch { /* keep embedded list */ }

  let geminiModels = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', free: false, reasoning: true, tools: true, supportsVariant: true, multimodal: true, context: 1048576, description: 'Ayarlanabilir düşünme bütçeli yüksek hızlı Gemini' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', free: false, reasoning: true, tools: true, supportsVariant: true, multimodal: true, context: 1048576, description: 'Derin mimari, analiz ve karmaşık kodlama' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', free: false, reasoning: false, tools: true, supportsVariant: false, multimodal: true, context: 1048576, description: 'Düşük gecikmeli klasik Flash' },
  ];
  if (provider === 'gemini' && apiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      if (res.ok) {
        const gm = await res.json();
        const live = (gm.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map(m => {
            const id = m.name.replace(/^models\//, '');
            return {
              id,
              name: m.displayName || id,
              provider: 'gemini',
              free: false,
              reasoning: id.includes('2.5') || id.includes('thinking'),
              tools: true,
              supportsVariant: id.includes('2.5'),
              multimodal: true,
              context: m.inputTokenLimit || 1048576,
              description: m.description || 'Canlı Google Gemini API modeli',
            };
          });
        if (live.length) geminiModels = live.slice(0, 25);
      }
    } catch { /* ignore */ }
  }

  let ollamaModels = [];
  let ollamaOnline = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 900);
    const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      ollamaModels = (data.models || []).filter(m => m.name).map(m => ({
        id: m.name,
        name: `Ollama · ${m.name}`,
        provider: 'ollama',
        free: true,
        reasoning: false,
        tools: true,
        supportsVariant: false,
        multimodal: false,
        context: 32768,
        description: 'Bilgisayarında yerel çalışan Ollama modeli',
      }));
      ollamaOnline = ollamaModels.length > 0;
    }
  } catch { /* offline */ }

  return {
    opencodeAvailable: false,
    ollamaOnline,
    sections: [
      { key: 'browser_free', label: 'Tarayıcı İçi Yerel AI (%100 Kişiye Özel Limitsiz)', models: BROWSER_LOCAL_MODELS },
      { key: 'web_free', label: 'Ücretsiz Web Havuzu (Pollinations & LLM7)', models: webModels },
      { key: 'groq', label: 'Groq (Ücretsiz Kendi Anahtarın · Kişisel Limit)', models: GROQ_MODELS },
      { key: 'opencode_free', label: 'OpenCode Zen Ücretsiz (Yerel + Oto Yedek)', models: opencodeFree },
      ...(opencodePro.length ? [{ key: 'opencode_pro', label: 'OpenCode Tüm Modeller (Go/Key)', models: opencodePro }] : []),
      {
        key: 'gemini',
        label: 'Google Gemini (Direkt API Key)',
        models: geminiModels,
      },
      {
        key: 'openai',
        label: 'OpenAI (Direkt API Key)',
        models: [
          { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', free: false, reasoning: false, tools: true, supportsVariant: false, multimodal: true, context: 1048576, description: 'Keskin talimat takibi ve yüksek kod kalitesi' },
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', free: false, reasoning: false, tools: true, supportsVariant: false, multimodal: true, context: 128000, description: 'Çok modlu dengeli amiral modeli' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', free: false, reasoning: false, tools: true, supportsVariant: false, multimodal: true, context: 128000, description: 'Ultra ekonomik hızlı OpenAI modeli' },
          { id: 'o3-mini', name: 'o3-mini (Reasoning)', provider: 'openai', free: false, reasoning: true, tools: true, supportsVariant: true, multimodal: false, context: 200000, description: 'Low/Medium/High efor destekli akıl yürütme' },
        ],
      },
      {
        key: 'openrouter',
        label: 'OpenRouter (Direkt API Key)',
        models: [
          { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'openrouter', free: false, reasoning: true, tools: true, supportsVariant: true, multimodal: true, context: 200000, description: 'OpenRouter üzerinden Claude Sonnet 4' },
          { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'openrouter', free: false, reasoning: true, tools: true, supportsVariant: true, multimodal: true, context: 1048576, description: 'OpenRouter üzerinden Gemini 2.5 Pro' },
          { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (OR Free)', provider: 'openrouter', free: true, reasoning: true, tools: false, supportsVariant: true, multimodal: false, context: 64000, description: 'OpenRouter ücretsiz R1 havuzu (OpenRouter key gerekir)' },
          { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (OR Free)', provider: 'openrouter', free: true, reasoning: true, tools: true, supportsVariant: false, multimodal: false, context: 262144, description: 'OpenRouter ücretsiz kodlama modeli' },
        ],
      },
      {
        key: 'anthropic',
        label: 'Anthropic Claude (Direkt API Key)',
        models: [
          { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', free: false, reasoning: true, tools: true, supportsVariant: true, multimodal: true, context: 200000, description: 'Extended Thinking destekli Sonnet 4' },
          { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet', provider: 'anthropic', free: false, reasoning: true, tools: true, supportsVariant: true, multimodal: true, context: 200000, description: 'Hibrit düşünme modlu Claude' },
          { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', provider: 'anthropic', free: false, reasoning: false, tools: true, supportsVariant: false, multimodal: true, context: 200000, description: 'Anlık hızlı Claude yanıtları' },
        ],
      },
      { key: 'ollama', label: 'Yerel Ollama', models: ollamaModels },
    ],
  };
}

export async function transcribeBrowserGemini({ apiKey, base64Audio, mimeType }) {
  if (!apiKey || !base64Audio) return { ok: false, text: '' };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const data = await fetchJsonWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Bu ses kaydını birebir yazıya dök (Türkçe veya konuşulan dilde). Sadece konuşulan metni döndür.' },
          { inlineData: { mimeType: String(mimeType || 'audio/webm').split(';')[0], data: base64Audio } },
        ],
      }],
    }),
  }, 30000);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map(p => p.text || '').join('').trim();
  return { ok: Boolean(text), text, engine: 'gemini-direct' };
}

export async function getBrowserModelCacheInfo() {
  if (typeof caches === 'undefined') return { supported: false, entries: 0, bytes: 0 };
  try {
    const has = await caches.has('transformers-cache');
    if (!has) return { supported: true, entries: 0, bytes: 0 };
    const cache = await caches.open('transformers-cache');
    const keys = await cache.keys();
    let bytes = 0;
    for (const req of keys) {
      const res = await cache.match(req);
      const cl = Number(res?.headers?.get('content-length') || 0);
      if (cl > 0) {
        bytes += cl;
      } else if (res) {
        try { bytes += (await res.clone().arrayBuffer()).byteLength; } catch { /* ignore */ }
      }
    }
    return { supported: true, entries: keys.length, bytes };
  } catch {
    return { supported: false, entries: 0, bytes: 0 };
  }
}

export async function clearBrowserModelCache() {
  localBrowserPipelines.clear();
  if (typeof caches === 'undefined') return { ok: false, deleted: false };
  try {
    const deleted = await caches.delete('transformers-cache');
    return { ok: true, deleted };
  } catch {
    return { ok: false, deleted: false };
  }
}
