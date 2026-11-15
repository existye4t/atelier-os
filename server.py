#!/usr/bin/env python3
"""
Atelier OS Local Server & Real AI/OpenCode/GitHub Bridge
Stdlib-only Python 3 HTTP server providing:
- Static workspace hosting (with smart cache headers)
- /api/github: Live profile & repository fetch for github.com/existye4t
- /api/models: Curated + live model catalog across OpenCode Zen (free & full), Pollinations, Gemini, OpenAI, OpenRouter, Claude, Ollama
- /api/chat: Multi-provider real LLM harness with Reasoning Effort (low/med/high/max), thinking trace extraction, and Atelier OS tools
- /api/transcribe: Audio dictation transcription fallback (Gemini Multimodal)
"""
import base64
import http.server
import json
import os
import re
import shutil
import socketserver
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("ATELIER_PORT", "4173"))
OPENCODE_BIN = shutil.which("opencode") or str(Path.home() / ".opencode/bin/opencode")
FFMPEG_BIN = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"
ASR_ROOT = Path.home() / ".cache/atelier-os-asr"
WHISPER_CLI = ASR_ROOT / "whisper.cpp/build/bin/whisper-cli"
WHISPER_MODEL_FAST = ASR_ROOT / "models/ggml-tiny-q5_1.bin"
WHISPER_MODEL_ACC = ASR_ROOT / "models/ggml-base-q5_1.bin"
WHISPER_MODEL_SMALL = ASR_ROOT / "models/ggml-small-q5_1.bin"

GITHUB_FALLBACK_PROFILE = {
    "login": "existye4t",
    "name": "Exist",
    "avatar_url": "https://avatars.githubusercontent.com/u/240194776?v=4",
    "html_url": "https://github.com/existye4t",
    "bio": "Yerel-öncelikli web araçları, Linux donanım/paket yazılımları, piksel oyunlar ve akışkan arayüz sistemleri.",
    "public_repos": 10,
    "followers": 0,
    "following": 2,
}

GITHUB_FALLBACK_REPOS = [
    {
        "name": "flow",
        "html_url": "https://github.com/existye4t/flow",
        "description": "A fast, minimal, keyboard-first launcher for Windows with a dark precise interface and built-in screenshot tool.",
        "language": "TypeScript",
        "stargazers_count": 0,
    },
    {
        "name": "erenin-yatagi",
        "html_url": "https://github.com/existye4t/erenin-yatagi",
        "description": "Eren's Bed: 25 Parts, 70 Chapters of retro pixel arcade simulation built with pure Vanilla JS, Canvas & Web Audio API.",
        "language": "JavaScript",
        "stargazers_count": 0,
    },
    {
        "name": "exist-bw",
        "html_url": "https://github.com/existye4t/exist-bw",
        "description": "A private black-and-white photo converter that runs entirely in the browser. Nothing is uploaded.",
        "language": "TypeScript",
        "stargazers_count": 0,
    },
    {
        "name": "darmoshark-packages",
        "html_url": "https://github.com/existye4t/darmoshark-packages",
        "description": "Signed pacman packages for Darmoshark Linux; desktop hardware control & HID utilities.",
        "language": "Python",
        "stargazers_count": 0,
    },
    {
        "name": "skin-fixer",
        "html_url": "https://github.com/existye4t/skin-fixer",
        "description": "Browser port of the cslol-go Skin Fixer. Import a .fantome locally and fix it.",
        "language": "TypeScript",
        "stargazers_count": 0,
    },
    {
        "name": "lilium",
        "html_url": "https://github.com/existye4t/lilium",
        "description": "Interactive botanical & atmospheric Lilium light simulation.",
        "language": "HTML",
        "stargazers_count": 0,
    },
]

_GITHUB_CACHE = {"ts": 0.0, "data": None}
_ZEN_CACHE = {"ts": 0.0, "models": []}

OPENCODE_FREE_PRIORITY = [
    "mimo-v2.6-flash-free",
    "beam-free",
    "flint-40b-free",
    "iceman-free",
    "inkling-2-small-free",
    "longcat-2.5-free",
    "nemotron-3.5-lightning-free",
    "nemotron-3.5-super-vl-free",
    "big-pickle",
    "deepseek-v4.1-flash-free",
    "glm-5.3-flash-free",
    "minimax-m3.1-flash-free",
]

ATELIER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "control_studio",
            "description": "Odak & Ses Stüdyosu kontrollerini değiştirir: müzik oynat/duraklat, parça seç, kadran filtresini (%) ayarla, ortam lamba pozlamasını (0.0-1.0) ayarla, Pomodoro zamanlayıcısını başlat/duraklat/sıfırla/süre ayarla.",
            "parameters": {
                "type": "object",
                "properties": {
                    "playing": {"type": "boolean"},
                    "trackIdx": {"type": "integer", "description": "0=Gece Yağmuru, 1=Obsidian Lo-Fi, 2=Derin Yörünge, 3=Atölye Şöminesi"},
                    "dialMix": {"type": "integer"},
                    "exposure": {"type": "number"},
                    "pomodoroAction": {"type": "string", "enum": ["start", "pause", "reset", "set"]},
                    "pomodoroMinutes": {"type": "integer"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "manage_tasks",
            "description": "Günlük Odak Listesine yeni görev ekler, bir görevi tamamlar veya siler.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["add", "toggle", "delete"]},
                    "text": {"type": "string"},
                },
                "required": ["action"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "manage_vault",
            "description": "Fikir Kasasına yeni kart/not ekler veya etiket filtresi uygular.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["add", "filter"]},
                    "title": {"type": "string"},
                    "subtitle": {"type": "string"},
                    "tag": {"type": "string"},
                    "body": {"type": "string"},
                    "highlight": {"type": "string"},
                },
                "required": ["action"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "manage_shell",
            "description": "Çalışma alanı/sayfa değiştirir, koyu/aydınlık tema geçirir, 3D dergi sayfası çevirir veya komut paletini açar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "view": {"type": "string", "enum": ["studio", "ai", "portfolio", "vault"]},
                    "theme": {"type": "string", "enum": ["dark", "light"]},
                    "magazinePage": {"type": "integer"},
                    "openPalette": {"type": "boolean"},
                },
            },
        },
    },
]


def http_json(url, method="GET", body=None, headers=None, timeout=45):
    hdrs = {"User-Agent": "AtelierOS/2.5"}
    if headers:
        hdrs.update(headers)
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        try:
            return resp.status, json.loads(raw)
        except json.JSONDecodeError:
            return resp.status, {"raw": raw}


def fetch_github_data():
    now = time.time()
    if _GITHUB_CACHE["data"] and now - _GITHUB_CACHE["ts"] < 600:
        return _GITHUB_CACHE["data"]
    try:
        _, profile = http_json("https://api.github.com/users/existye4t", timeout=8)
        _, repos = http_json("https://api.github.com/users/existye4t/repos?sort=updated&per_page=15", timeout=8)
        if not isinstance(repos, list):
            repos = GITHUB_FALLBACK_REPOS
        payload = {"profile": profile, "repos": repos, "live": True}
        _GITHUB_CACHE["ts"] = now
        _GITHUB_CACHE["data"] = payload
        return payload
    except Exception:
        return {"profile": GITHUB_FALLBACK_PROFILE, "repos": GITHUB_FALLBACK_REPOS, "live": False}


def fetch_opencode_zen_catalog():
    now = time.time()
    if _ZEN_CACHE["models"] and now - _ZEN_CACHE["ts"] < 600:
        return _ZEN_CACHE["models"]

    models = []
    try:
        _, data = http_json("https://opencode.ai/zen/v1/models", timeout=8)
        for m in data.get("data", []):
            mid = m.get("id")
            if not mid:
                continue
            price = ((m.get("cost") or {}).get("text") or {}).get("input", {}).get("price", 1)
            caps = m.get("capabilities") or {}
            modalities = ((m.get("modalities") or {}).get("input")) or ["text"]
            models.append({
                "id": mid,
                "name": m.get("name") or mid,
                "provider": "opencode",
                "free": price == 0 or mid.endswith("-free") or mid == "big-pickle",
                "reasoning": bool((caps.get("reasoning") or {}).get("supported", False)),
                "tools": bool((caps.get("tools") or {}).get("supported", True)),
                "supportsVariant": bool(caps.get("effort_updates", False)),
                "multimodal": any(x.startswith("image/") for x in modalities),
                "context": int(((m.get("limit") or {}).get("context")) or 128000),
                "description": (m.get("description") or "").strip(),
            })
    except Exception:
        # Clean embedded fallback of OpenCode free catalog
        fallback_specs = [
            ("mimo-v2.6-flash-free", "MiMo-V2.6-Flash Free", True, 200000, "Çok modlu kodlama ajanı ve hızlı reasoning modeli"),
            ("beam-free", "Beam Free", False, 1048576, "1M bağlam penceresine sahip ücretsiz hızlı model"),
            ("flint-40b-free", "Flint 40B Free", False, 262144, "Ücretsiz 40B akıl yürütme ve sohbet modeli"),
            ("iceman-free", "Iceman Free", False, 262144, "Ücretsiz akıl yürütme ve kod analiz modeli"),
            ("inkling-2-small-free", "Inkling 2 Small Free", False, 1048576, "Hafif ve uzun bağlamlı ücretsiz model"),
            ("longcat-2.5-free", "LongCat 2.5 Free", False, 1000000, "1M bağlamlı genel amaçlı ücretsiz ajan modeli"),
            ("nemotron-3.5-lightning-free", "Nemotron 3.5 Lightning Free", False, 262144, "NVIDIA ultra hızlı ücretsiz model"),
            ("nemotron-3.5-super-vl-free", "Nemotron 3.5 Super VL Free", True, 1048576, "Multimodal geniş bağlamlı NVIDIA modeli"),
            ("big-pickle", "Big Pickle", False, 200000, "Adım adım problem çözümü ve araç kullanımı için ücretsiz model"),
            ("deepseek-v4.1-flash-free", "DeepSeek V4.1 Flash Free", True, 200000, "Derin kodlama ve çok adımlı akıl yürütme modeli"),
            ("glm-5.3-flash-free", "GLM-5.3-Flash Free", False, 200000, "Hızlı mantıksal akıl yürütme modeli"),
            ("minimax-m3.1-flash-free", "MiniMax M3.1 Flash Free", False, 1000000, "1M bağlamlı ajan ve sohbet modeli"),
        ]
        for mid, name, mm, ctx, desc in fallback_specs:
            models.append({
                "id": mid,
                "name": name,
                "provider": "opencode",
                "free": True,
                "reasoning": True,
                "tools": True,
                "supportsVariant": False,
                "multimodal": mm,
                "context": ctx,
                "description": desc,
            })

    # Order free priority models first, then remaining models alphabetically
    prio_map = {mid: i for i, mid in enumerate(OPENCODE_FREE_PRIORITY)}
    models.sort(key=lambda x: (0 if x["free"] else 1, prio_map.get(x["id"], 999), x["name"]))
    _ZEN_CACHE["ts"] = now
    _ZEN_CACHE["models"] = models
    return models


def list_all_models(api_key="", provider="opencode"):
    zen_models = fetch_opencode_zen_catalog()
    opencode_free = [m for m in zen_models if m["free"]]
    opencode_pro = [m for m in zen_models if not m["free"]]

    browser_free = [
        {"id": "onnx-community/Qwen2.5-0.5B-Instruct", "name": "Qwen 2.5 0.5B (Tarayıcı İçi Yerel AI)", "provider": "browser", "free": True, "reasoning": False, "tools": False, "supportsVariant": False, "multimodal": False, "context": 32768, "description": "%100 tarayıcında çalışır · Ortak limit YOK, tamamen kişiye özel (WebGPU/WASM)"},
        {"id": "onnx-community/SmolLM2-360M-Instruct", "name": "SmolLM2 360M (Hafif Tarayıcı İçi AI)", "provider": "browser", "free": True, "reasoning": False, "tools": False, "supportsVariant": False, "multimodal": False, "context": 8192, "description": "Ultra hafif · Yalnızca kendi tarayıcında çalışır, başkasıyla limit paylaşmaz"},
    ]

    web_free = [
        {"id": "openai-fast", "name": "GPT-OSS 20B Reasoning (Pollinations)", "provider": "pollinations", "free": True, "reasoning": True, "tools": True, "supportsVariant": False, "multimodal": False, "context": 128000, "description": "Tarayıcıdan doğrudan çalışır (IP başına 45sn limit veya kendi Pollen key'inle limitsiz)"},
        {"id": "openai", "name": "Pollinations · OpenAI Router", "provider": "pollinations", "free": True, "reasoning": True, "tools": True, "supportsVariant": False, "multimodal": False, "context": 128000, "description": "Ziyaretçi IP'sine özel ücretsiz Pollinations modeli (veya kendi anahtarınla limitsiz)"},
        {"id": "mistral", "name": "Pollinations · Mistral Small", "provider": "pollinations", "free": True, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": False, "context": 128000, "description": "Hızlı ve akıcı metin/kod yanıtları"},
        {"id": "codestral-latest", "name": "Codestral Latest (LLM7)", "provider": "llm7", "free": True, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": False, "context": 256000, "description": "LLM7 hızlı kod & sohbet (Paylaşımlı havuz veya kendi ücretsiz LLM7 token'ın)"},
        {"id": "gpt-oss:20b", "name": "GPT-OSS 20B (LLM7)", "provider": "llm7", "free": True, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": False, "context": 128000, "description": "LLM7 açık ağırlıklı 20B modeli (kendi token'ınla kişisel limit)"},
        {"id": "glm-5.3-flash", "name": "GLM 5.3 Flash (LLM7)", "provider": "llm7", "free": True, "reasoning": True, "tools": True, "supportsVariant": False, "multimodal": False, "context": 200000, "description": "LLM7 ücretsiz GLM reasoning modeli"},
    ]

    groq = [
        {"id": "llama-3.3-70b-versatile", "name": "Groq · Llama 3.3 70B Versatile", "provider": "groq", "free": True, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": False, "context": 128000, "description": "Ücretsiz kendi Groq anahtarınla günde 14.400 istek · Kişiye özel tam izole limit"},
        {"id": "llama-3.1-8b-instant", "name": "Groq · Llama 3.1 8B Instant", "provider": "groq", "free": True, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": False, "context": 128000, "description": "Ultra hızlı ücretsiz kendi Groq API anahtarınla anında yanıt"},
        {"id": "qwen/qwen3-32b", "name": "Groq · Qwen3 32B Reasoning", "provider": "groq", "free": True, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": False, "context": 131072, "description": "Ücretsiz kendi Groq anahtarınla derin akıl yürütme"},
    ]

    gemini = [
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "gemini", "free": False, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": True, "context": 1048576, "description": "Ayarlanabilir düşünme bütçeli yüksek hızlı Gemini"},
        {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "provider": "gemini", "free": False, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": True, "context": 1048576, "description": "Derin mimari, analiz ve karmaşık kodlama"},
        {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "provider": "gemini", "free": False, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": True, "context": 1048576, "description": "Düşük gecikmeli klasik Flash"},
    ]

    openai = [
        {"id": "gpt-4.1", "name": "GPT-4.1", "provider": "openai", "free": False, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": True, "context": 1048576, "description": "Keskin talimat takibi ve yüksek kod kalitesi"},
        {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "free": False, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": True, "context": 128000, "description": "Çok modlu dengeli amiral modeli"},
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai", "free": False, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": True, "context": 128000, "description": "Ultra ekonomik hızlı OpenAI modeli"},
        {"id": "o3-mini", "name": "o3-mini (Reasoning)", "provider": "openai", "free": False, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": False, "context": 200000, "description": "Low/Medium/High efor destekli akıl yürütme"},
    ]

    openrouter = [
        {"id": "anthropic/claude-sonnet-4", "name": "Claude Sonnet 4", "provider": "openrouter", "free": False, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": True, "context": 200000, "description": "OpenRouter üzerinden Claude Sonnet 4"},
        {"id": "google/gemini-2.5-pro", "name": "Gemini 2.5 Pro", "provider": "openrouter", "free": False, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": True, "context": 1048576, "description": "OpenRouter üzerinden Gemini 2.5 Pro"},
        {"id": "deepseek/deepseek-r1:free", "name": "DeepSeek R1 (OR Free)", "provider": "openrouter", "free": True, "reasoning": True, "tools": False, "supportsVariant": True, "multimodal": False, "context": 64000, "description": "OpenRouter ücretsiz R1 havuzu (OpenRouter key gerekir)"},
        {"id": "qwen/qwen3-coder:free", "name": "Qwen3 Coder (OR Free)", "provider": "openrouter", "free": True, "reasoning": True, "tools": True, "supportsVariant": False, "multimodal": False, "context": 262144, "description": "OpenRouter ücretsiz kodlama modeli"},
    ]

    anthropic = [
        {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4", "provider": "anthropic", "free": False, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": True, "context": 200000, "description": "Extended Thinking destekli Sonnet 4"},
        {"id": "claude-3-7-sonnet-latest", "name": "Claude 3.7 Sonnet", "provider": "anthropic", "free": False, "reasoning": True, "tools": True, "supportsVariant": True, "multimodal": True, "context": 200000, "description": "Hibrit düşünme modlu Claude"},
        {"id": "claude-3-5-haiku-latest", "name": "Claude 3.5 Haiku", "provider": "anthropic", "free": False, "reasoning": False, "tools": True, "supportsVariant": False, "multimodal": True, "context": 200000, "description": "Anlık hızlı Claude yanıtları"},
    ]

    ollama = []
    try:
        _, tags = http_json("http://127.0.0.1:11434/api/tags", timeout=0.9)
        for m in tags.get("models", []):
            if m.get("name"):
                ollama.append({
                    "id": m["name"],
                    "name": f"Ollama · {m['name']}",
                    "provider": "ollama",
                    "free": True,
                    "reasoning": False,
                    "tools": True,
                    "supportsVariant": False,
                    "multimodal": False,
                    "context": 32768,
                    "description": "Bilgisayarında yerel çalışan Ollama modeli",
                })
    except Exception:
        pass

    if provider == "gemini" and api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={urllib.parse.quote(api_key)}"
            _, gm = http_json(url, timeout=6)
            live_gem = []
            for m in gm.get("models", []):
                if "generateContent" in m.get("supportedGenerationMethods", []):
                    mid = m["name"].replace("models/", "")
                    live_gem.append({
                        "id": mid,
                        "name": m.get("displayName") or mid,
                        "provider": "gemini",
                        "free": False,
                        "reasoning": "2.5" in mid or "thinking" in mid,
                        "tools": True,
                        "supportsVariant": "2.5" in mid,
                        "multimodal": True,
                        "context": m.get("inputTokenLimit") or 1048576,
                        "description": m.get("description") or "Canlı Google Gemini API modeli",
                    })
            if live_gem:
                gemini = live_gem[:25]
        except Exception:
            pass

    return {
        "opencodeAvailable": os.path.exists(OPENCODE_BIN),
        "ollamaOnline": bool(ollama),
        "sections": [
            {"key": "opencode_free", "label": "OpenCode Ücretsiz (Zen)", "models": opencode_free},
            {"key": "browser_free", "label": "Tarayıcı İçi Yerel AI (%100 Kişiye Özel Limitsiz)", "models": browser_free},
            {"key": "web_free", "label": "Ücretsiz Web Havuzu (Pollinations & LLM7)", "models": web_free},
            {"key": "groq", "label": "Groq (Ücretsiz Kendi Anahtarın · Kişisel Limit)", "models": groq},
            {"key": "opencode_pro", "label": "OpenCode Tüm Modeller (Go/Key)", "models": opencode_pro},
            {"key": "gemini", "label": "Google Gemini", "models": gemini},
            {"key": "openai", "label": "OpenAI", "models": openai},
            {"key": "openrouter", "label": "OpenRouter", "models": openrouter},
            {"key": "anthropic", "label": "Anthropic Claude", "models": anthropic},
            {"key": "ollama", "label": "Yerel Ollama", "models": ollama},
        ],
    }


def effort_directive(effort):
    mapping = {
        "low": "EFOR SEVİYESİ: LOW — Kısa, doğrudan ve hızlı yanıt ver; gereksiz uzatma.",
        "medium": "EFOR SEVİYESİ: MEDIUM — Dengeli analiz ve net adımlarla yanıt ver.",
        "high": "EFOR SEVİYESİ: HIGH — Cevaplamadan önce problemi derinlemesine irdele, kenar durumları doğrula ve kapsamlı ama özlü sun.",
        "max": "EFOR SEVİYESİ: MAX — Azami derinlikte teknik analiz, akıl yürütme ve doğrulama yap.",
    }
    return mapping.get(effort or "auto", "")


def build_system_prompt(app_state, effort="auto", agent_mode="build"):
    state_json = json.dumps(app_state or {}, ensure_ascii=False)
    effort_line = effort_directive(effort)
    mode_note = (
        "AJAN MODU: CHAT (Salt Sohbet) — Bu modda site aracı ÇAĞIRMA, yalnızca kullanıcıyla sohbet et."
        if agent_mode == "chat"
        else "AJAN MODU: Site kontrolü istendiğinde ilgili araçları kullan; aksi halde doğal sohbet et."
    )
    return (
        "Sen Atelier OS'in içinde çalışan üst düzey, OpenCode harness mimarisinden ilham alan bir yapay zeka ajanısın.\n"
        "Kullanıcıyla her konuda (kodlama, mimari, tasarım, günlük sohbet, araştırma) tam kapsamlı gerçek konuşabilirsin.\n"
        f"{effort_line}\n{mode_note}\n"
        f"Sitenin canlı durumu:\n{state_json}\n\n"
        "Site üzerinde gerçek değişiklik yapmak gerektiğinde tanımlı araçları kullan (control_studio, manage_tasks, manage_vault, manage_shell). "
        "Araç şeması desteklenmiyorsa veya metin içi eylem gerekirse yanıtın son satırlarına "
        "`<atelier_action>{\"name\": \"control_studio\", \"args\": {\"playing\": true}}</atelier_action>` şeklinde JSON etiketi yazabilirsin.\n"
        "Kullanıcı sadece soru soruyorsa veya sohbet ediyorsa araç etiketi EKLEME. Yanıtlarını Türkçe (veya kullanıcının dilinde) ver."
    )


def extract_inline_actions(text):
    actions = []
    pattern = re.compile(r"<atelier_action>\s*(\{.*?\})\s*</atelier_action>", re.DOTALL)
    for match in pattern.finditer(text or ""):
        try:
            obj = json.loads(match.group(1))
            if isinstance(obj, dict) and obj.get("name"):
                actions.append({
                    "id": f"inline_{len(actions)}",
                    "name": obj["name"],
                    "args": obj.get("args") or {},
                })
        except Exception:
            pass
    cleaned = pattern.sub("", text or "").strip()
    return cleaned, actions


def run_opencode_single(model_id, effort, messages, app_state, agent_mode="build"):
    if not os.path.exists(OPENCODE_BIN):
        raise RuntimeError("OpenCode CLI bulunamadı (~/.opencode/bin/opencode)")

    zen_list = fetch_opencode_zen_catalog()
    meta = next((m for m in zen_list if m["id"] == model_id), None)
    supports_variant = bool(meta and meta.get("supportsVariant"))

    model_arg = f"opencode/{model_id}"
    if supports_variant and effort in ("low", "medium", "high", "max"):
        model_arg = f"{model_arg}#{effort}"

    sys_txt = build_system_prompt(app_state, effort=effort, agent_mode=agent_mode)
    hist_lines = []
    for m in messages[-12:-1]:
        who = "Kullanıcı" if m.get("role") == "user" else "Asistan"
        hist_lines.append(f"{who}: {str(m.get('content', ''))[:900]}")
    last_user = str((messages[-1] if messages else {}).get("content", ""))
    history_block = "\n".join(hist_lines) if hist_lines else "(İlk mesaj)"

    prompt = (
        f"[SİSTEM TALİMATI — KESİN UY]\n{sys_txt}\n"
        "NOT: Bu çağrı Atelier OS sohbet köprüsüdür; dosya sistemi/terminal tool'larını çalıştırmana gerek yok.\n\n"
        f"[SON KONUŞMA GEÇMİŞİ]\n{history_block}\n\n"
        f"[KULLANICI MESAJI]\n{last_user}"
    )

    cmd = [OPENCODE_BIN, "run", "-m", model_arg, "--format", "json", "--thinking", "--archived", prompt]
    proc = subprocess.run(cmd, cwd="/tmp", capture_output=True, text=True, timeout=90)
    raw_lines = (proc.stdout or "").splitlines()

    reasoning_parts = []
    text_parts = []
    error_info = None
    tokens = None
    cost = 0

    for line in raw_lines:
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        etype = ev.get("type")
        part = ev.get("part") or {}
        if etype == "reasoning":
            rtxt = part.get("text") or ""
            if rtxt:
                reasoning_parts.append(rtxt)
        elif etype == "text":
            ttxt = part.get("text") or ""
            if ttxt:
                text_parts.append(ttxt)
        elif etype == "step_finish":
            if part.get("tokens"):
                tokens = part.get("tokens")
            cost = part.get("cost", 0)
        elif etype == "error":
            error_info = ev.get("error") or {}

    if error_info and not text_parts:
        err_type = error_info.get("type") or "opencode.error"
        err_msg = error_info.get("message") or str(error_info)
        return {
            "ok": False,
            "errorType": err_type,
            "error": err_msg,
        }

    full_text = "\n".join(text_parts).strip()
    if not full_text and proc.returncode != 0:
        return {"ok": False, "errorType": "cli.exit", "error": (proc.stderr or "OpenCode yanıt döndürmedi")[:300]}

    cleaned, actions = extract_inline_actions(full_text)
    if agent_mode == "chat":
        actions = []
    if not cleaned and actions:
        cleaned = "İstediğin Atelier OS eylemleri hazırlandı."

    return {
        "ok": True,
        "reply": cleaned or full_text or "Tamamlandı.",
        "reasoning": "\n".join(reasoning_parts).strip(),
        "toolCalls": actions,
        "tokens": tokens,
        "cost": cost,
        "model": model_id,
    }


def call_opencode_with_failover(model_id, effort, messages, app_state, agent_mode="build", auto_fallback=True):
    res = run_opencode_single(model_id, effort, messages, app_state, agent_mode)
    if res.get("ok"):
        return res

    is_free_limit = res.get("errorType") == "provider.free-limit" or "FreeUsageLimitError" in str(res.get("error", ""))
    if auto_fallback and is_free_limit:
        for alt in OPENCODE_FREE_PRIORITY:
            if alt == model_id:
                continue
            alt_res = run_opencode_single(alt, effort, messages, app_state, agent_mode)
            if alt_res.get("ok"):
                alt_res["fallbackFrom"] = model_id
                return alt_res
    return res


def call_openai_like(endpoint, api_key, model, messages, app_state, effort="auto", agent_mode="build", extra_headers=None, send_tools=True, send_effort=True, timeout=60):
    sys_msg = {"role": "system", "content": build_system_prompt(app_state, effort, agent_mode)}
    clean_msgs = [sys_msg] + [
        {"role": m.get("role", "user"), "content": str(m.get("content", ""))}
        for m in messages[-18:]
        if m.get("role") in ("user", "assistant")
    ]
    payload = {"model": model, "messages": clean_msgs, "temperature": 0.7}
    if send_effort:
        if effort in ("low", "medium", "high"):
            payload["reasoning_effort"] = effort
        elif effort == "max":
            payload["reasoning_effort"] = "high"

    if send_tools and agent_mode != "chat":
        payload["tools"] = ATELIER_TOOLS
        payload["tool_choice"] = "auto"

    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    if extra_headers:
        headers.update(extra_headers)

    _, data = http_json(endpoint, method="POST", body=payload, headers=headers, timeout=timeout)
    choice = (data.get("choices") or [{}])[0]
    msg = choice.get("message") or {}
    text = msg.get("content") or ""
    reasoning = msg.get("reasoning_content") or msg.get("reasoning") or ""
    tool_calls = []

    if agent_mode != "chat":
        for tc in msg.get("tool_calls") or []:
            fn = tc.get("function") or {}
            raw_args = fn.get("arguments") or "{}"
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            except Exception:
                args = {}
            if fn.get("name"):
                tool_calls.append({"id": tc.get("id") or f"tc_{len(tool_calls)}", "name": fn["name"], "args": args})

    cleaned, inline_actions = extract_inline_actions(text)
    if agent_mode != "chat":
        tool_calls.extend(inline_actions)
    if not cleaned and tool_calls:
        cleaned = "İstediğin eylemler hazırlandı."
    usage = data.get("usage") or {}
    tokens = {
        "input": usage.get("prompt_tokens", 0),
        "output": usage.get("completion_tokens", 0),
    } if usage else None
    return cleaned, reasoning, tool_calls, tokens


def call_gemini(api_key, model, messages, app_state, effort="auto", agent_mode="build"):
    model_id = (model or "gemini-2.5-flash").replace("models/", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{urllib.parse.quote(model_id)}:generateContent?key={urllib.parse.quote(api_key)}"
    contents = [
        {"role": "model" if m.get("role") == "assistant" else "user", "parts": [{"text": str(m.get("content", ""))}]}
        for m in messages[-18:]
    ]

    payload = {
        "systemInstruction": {"parts": [{"text": build_system_prompt(app_state, effort, agent_mode)}]},
        "contents": contents,
    }
    if agent_mode != "chat":
        payload["tools"] = [{
            "functionDeclarations": [
                {"name": t["function"]["name"], "description": t["function"]["description"], "parameters": t["function"]["parameters"]}
                for t in ATELIER_TOOLS
            ]
        }]

    budget_map = {"low": 1024, "medium": 4096, "high": 12288, "max": 24576}
    if effort in budget_map:
        payload["generationConfig"] = {"thinkingConfig": {"thinkingBudget": budget_map[effort], "includeThoughts": True}}

    _, data = http_json(url, method="POST", body=payload, timeout=60)
    cand = (data.get("candidates") or [{}])[0]
    parts = ((cand.get("content") or {}).get("parts")) or []
    texts, thoughts, tool_calls = [], [], []
    for p in parts:
        if p.get("thought") and "text" in p:
            thoughts.append(p["text"])
        elif "text" in p:
            texts.append(p["text"])
        if "functionCall" in p and agent_mode != "chat":
            fc = p["functionCall"]
            tool_calls.append({"id": f"gem_{len(tool_calls)}", "name": fc.get("name"), "args": fc.get("args") or {}})
    cleaned, inline_actions = extract_inline_actions("\n".join(texts))
    if agent_mode != "chat":
        tool_calls.extend(inline_actions)
    if not cleaned and tool_calls:
        cleaned = "İstediğin eylem hazır."
    umeta = data.get("usageMetadata") or {}
    tokens = {
        "input": umeta.get("promptTokenCount", 0),
        "output": umeta.get("candidatesTokenCount", 0),
        "reasoning": umeta.get("thoughtsTokenCount", 0),
    } if umeta else None
    return cleaned, "\n".join(thoughts), tool_calls, tokens


def call_anthropic(api_key, model, messages, app_state, effort="auto", agent_mode="build"):
    url = "https://api.anthropic.com/v1/messages"
    clean_msgs = [
        {"role": "assistant" if m.get("role") == "assistant" else "user", "content": str(m.get("content", ""))}
        for m in messages[-18:]
    ]
    payload = {
        "model": model or "claude-sonnet-4-20250514",
        "max_tokens": 4096,
        "system": build_system_prompt(app_state, effort, agent_mode),
        "messages": clean_msgs,
    }
    if agent_mode != "chat":
        payload["tools"] = [
            {"name": t["function"]["name"], "description": t["function"]["description"], "input_schema": t["function"]["parameters"]}
            for t in ATELIER_TOOLS
        ]
    budget_map = {"low": 1024, "medium": 4096, "high": 10000, "max": 16000}
    if effort in budget_map:
        payload["thinking"] = {"type": "enabled", "budget_tokens": budget_map[effort]}

    headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
    _, data = http_json(url, method="POST", body=payload, headers=headers, timeout=60)
    texts, thoughts, tool_calls = [], [], []
    for block in data.get("content") or []:
        if block.get("type") == "thinking":
            thoughts.append(block.get("thinking", ""))
        elif block.get("type") == "text":
            texts.append(block.get("text", ""))
        elif block.get("type") == "tool_use" and agent_mode != "chat":
            tool_calls.append({"id": block.get("id") or f"cl_{len(tool_calls)}", "name": block.get("name"), "args": block.get("input") or {}})
    cleaned, inline_actions = extract_inline_actions("\n".join(texts))
    if agent_mode != "chat":
        tool_calls.extend(inline_actions)
    usage = data.get("usage") or {}
    tokens = {"input": usage.get("input_tokens", 0), "output": usage.get("output_tokens", 0)} if usage else None
    return cleaned, "\n".join(thoughts), tool_calls, tokens


def call_ollama(model, messages, app_state, effort="auto", agent_mode="build"):
    url = "http://127.0.0.1:11434/api/chat"
    clean_msgs = [{"role": "system", "content": build_system_prompt(app_state, effort, agent_mode)}] + [
        {"role": m.get("role", "user"), "content": str(m.get("content", ""))}
        for m in messages[-18:]
    ]
    payload = {"model": model, "messages": clean_msgs, "stream": False}
    if agent_mode != "chat":
        payload["tools"] = ATELIER_TOOLS
    _, data = http_json(url, method="POST", body=payload, timeout=90)
    msg = data.get("message") or {}
    text = msg.get("content") or ""
    reasoning = msg.get("thinking") or ""
    tool_calls = []
    if agent_mode != "chat":
        for tc in msg.get("tool_calls") or []:
            fn = tc.get("function") or {}
            if fn.get("name"):
                tool_calls.append({"id": f"ol_{len(tool_calls)}", "name": fn["name"], "args": fn.get("arguments") or {}})
    cleaned, inline_actions = extract_inline_actions(text)
    if agent_mode != "chat":
        tool_calls.extend(inline_actions)
    return cleaned, reasoning, tool_calls, None


def clean_whisper_text(raw):
    # Strip bracketed sound tags like [Müzik], (Alkış), [BLANK_AUDIO] and known subtitle hallucinations
    t = re.sub(r"\[[^\]]{1,40}\]|\([^)]{1,40}\)", " ", raw or "")
    t = re.sub(r"(?i)\b(altyazı\s*m\.?k\.?|teşekkürler\s+izlediğiniz\s+için)\b\.?", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    if t and t[0].islower():
        t = t[0].upper() + t[1:]
    return t


def transcribe_local_whisper(audio_b64, mime, model_path, fast=False):
    raw_bytes = base64.b64decode(audio_b64)
    if len(raw_bytes) < 400:
        return ""
    ext = ".ogg" if "ogg" in mime else (".wav" if "wav" in mime else ".webm")
    with tempfile.TemporaryDirectory(prefix="atelier_asr_") as tmp:
        src = Path(tmp) / f"in{ext}"
        wav = Path(tmp) / "out.wav"
        src.write_bytes(raw_bytes)
        ff = subprocess.run(
            [FFMPEG_BIN, "-y", "-i", str(src), "-af", "highpass=f=80,lowpass=f=7600", "-ar", "16000", "-ac", "1", "-f", "wav", str(wav)],
            capture_output=True,
            timeout=15,
        )
        if ff.returncode != 0 or not wav.exists() or wav.stat().st_size < 1600:
            return ""
        cmd = [
            str(WHISPER_CLI),
            "-m", str(model_path),
            "-l", "tr",
            "-t", "4",
            "-np",
            "-nt",
            "--no-speech-thold", "0.55",
            "--prompt", "Türkçe konuşma. Atölye OS, GitHub, kodlama ve günlük notlar.",
            "-f", str(wav),
        ]
        if fast:
            cmd.extend(["-bo", "1", "-bs", "1"])
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        return clean_whisper_text(res.stdout)


class AtelierHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        if not self.path.startswith("/assets/"):
            self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def send_json(self, status, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/health":
            return self.send_json(200, {
                "ok": True,
                "opencode": os.path.exists(OPENCODE_BIN),
                "whisper": WHISPER_CLI.exists(),
            })
        if parsed.path == "/api/github":
            return self.send_json(200, fetch_github_data())
        if parsed.path == "/api/models":
            qs = urllib.parse.parse_qs(parsed.query)
            provider = (qs.get("provider") or ["opencode"])[0]
            api_key = (qs.get("apiKey") or [""])[0]
            return self.send_json(200, list_all_models(api_key=api_key, provider=provider))
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/chat":
            try:
                body = self.read_json_body()
                provider = body.get("provider") or "opencode"
                model = (body.get("model") or "").strip() or "mimo-v2.6-flash-free"
                effort = body.get("effort") or "auto"
                agent_mode = body.get("agentMode") or "build"
                auto_fallback = bool(body.get("autoFallback", True))
                api_key = (body.get("apiKey") or "").strip()
                base_url = (body.get("baseUrl") or "").strip()
                messages = body.get("messages") or []
                app_state = body.get("appState") or {}

                if provider == "opencode":
                    out = call_opencode_with_failover(model, effort, messages, app_state, agent_mode, auto_fallback)
                    if not out.get("ok"):
                        return self.send_json(429 if out.get("errorType") == "provider.free-limit" else 500, out)
                    out["provider"] = "opencode"
                    return self.send_json(200, out)

                reasoning = ""
                tokens = None
                if provider == "llm7":
                    llm7_effort = model in ("glm-5.3-flash", "DeepSeek-V4-Flash-0731", "minimax-m2.7")
                    try:
                        reply, reasoning, tools, tokens = call_openai_like(
                            "https://api.llm7.io/v1/chat/completions", api_key, model, messages, app_state, effort, agent_mode, send_tools=True, send_effort=llm7_effort, timeout=12
                        )
                    except urllib.error.HTTPError as he:
                        if he.code != 400:
                            raise
                        reply, reasoning, tools, tokens = call_openai_like(
                            "https://api.llm7.io/v1/chat/completions", api_key, model, messages, app_state, effort, agent_mode, send_tools=False, send_effort=False, timeout=12
                        )
                elif provider == "pollinations":
                    try:
                        reply, reasoning, tools, tokens = call_openai_like(
                            "https://text.pollinations.ai/openai", api_key, model, messages, app_state, effort, agent_mode, send_tools=True, timeout=18
                        )
                    except urllib.error.HTTPError as he:
                        if he.code != 400:
                            raise
                        reply, reasoning, tools, tokens = call_openai_like(
                            "https://text.pollinations.ai/openai", api_key, model, messages, app_state, effort, agent_mode, send_tools=False, send_effort=False, timeout=18
                        )
                elif provider == "groq":
                    if not api_key:
                        return self.send_json(400, {"ok": False, "error": "Groq için ücretsiz kişisel API anahtarı gerekiyor (console.groq.com)."})
                    reply, reasoning, tools, tokens = call_openai_like(
                        "https://api.groq.com/openai/v1/chat/completions",
                        api_key,
                        model,
                        messages,
                        app_state,
                        effort,
                        agent_mode,
                        send_effort="qwen" in model,
                        timeout=25,
                    )
                elif provider == "ollama":
                    reply, reasoning, tools, tokens = call_ollama(model, messages, app_state, effort, agent_mode)
                elif provider == "gemini":
                    if not api_key:
                        return self.send_json(400, {"ok": False, "error": "Gemini için API anahtarı gerekiyor."})
                    reply, reasoning, tools, tokens = call_gemini(api_key, model, messages, app_state, effort, agent_mode)
                elif provider == "anthropic":
                    if not api_key:
                        return self.send_json(400, {"ok": False, "error": "Claude (Anthropic) için API anahtarı gerekiyor."})
                    reply, reasoning, tools, tokens = call_anthropic(api_key, model, messages, app_state, effort, agent_mode)
                elif provider == "openrouter":
                    if not api_key:
                        return self.send_json(400, {"ok": False, "error": "OpenRouter için API anahtarı gerekiyor."})
                    reply, reasoning, tools, tokens = call_openai_like(
                        "https://openrouter.ai/api/v1/chat/completions",
                        api_key,
                        model,
                        messages,
                        app_state,
                        effort,
                        agent_mode,
                        extra_headers={"HTTP-Referer": f"http://127.0.0.1:{PORT}", "X-Title": "Atelier OS"},
                    )
                elif provider in ("openai", "custom"):
                    ep = (base_url or "https://api.openai.com/v1").rstrip("/")
                    if not ep.endswith("/chat/completions"):
                        ep = f"{ep}/chat/completions"
                    if provider == "openai" and not api_key:
                        return self.send_json(400, {"ok": False, "error": "OpenAI için API anahtarı gerekiyor."})
                    reply, reasoning, tools, tokens = call_openai_like(ep, api_key, model, messages, app_state, effort, agent_mode)
                else:
                    return self.send_json(400, {"ok": False, "error": f"Bilinmeyen sağlayıcı: {provider}"})

                return self.send_json(
                    200,
                    {"ok": True, "reply": reply, "reasoning": reasoning, "toolCalls": tools, "tokens": tokens, "model": model, "provider": provider},
                )

            except urllib.error.HTTPError as e:
                detail = e.read().decode("utf-8", errors="replace")[:350]
                return self.send_json(e.code, {"ok": False, "error": f"Sağlayıcı hatası ({e.code}): {detail}"})
            except Exception as e:
                return self.send_json(500, {"ok": False, "error": f"Bağlantı hatası: {e}"})

        if parsed.path == "/api/transcribe":
            try:
                body = self.read_json_body()
                provider = body.get("provider") or "whisper"
                api_key = (body.get("apiKey") or "").strip()
                audio_b64 = body.get("audio") or ""
                mime = body.get("mimeType") or "audio/webm"
                partial = bool(body.get("partial", False))

                if not audio_b64:
                    return self.send_json(200, {"ok": True, "text": "", "engine": "empty"})

                # 1. Free local offline Whisper.cpp (works in Zen Browser & Chromium without any key)
                model_path = (
                    WHISPER_MODEL_FAST
                    if (partial and WHISPER_MODEL_FAST.exists())
                    else (WHISPER_MODEL_ACC if WHISPER_MODEL_ACC.exists() else WHISPER_MODEL_SMALL)
                )
                if WHISPER_CLI.exists() and model_path.exists() and Path(FFMPEG_BIN).exists():
                    text = transcribe_local_whisper(audio_b64, mime, model_path, fast=partial)
                    return self.send_json(200, {"ok": True, "text": text, "engine": f"whisper:{model_path.stem}"})

                # 2. Optional Gemini key fallback
                if provider == "gemini" and api_key:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={urllib.parse.quote(api_key)}"
                    payload = {
                        "contents": [{
                            "parts": [
                                {"text": "Bu ses kaydını birebir yazıya dök (Türkçe veya konuşulan dilde). Sadece konuşulan metni döndür."},
                                {"inlineData": {"mimeType": mime.split(";")[0], "data": audio_b64}},
                            ]
                        }]
                    }
                    _, data = http_json(url, method="POST", body=payload, timeout=45)
                    parts = (((data.get("candidates") or [{}])[0].get("content") or {}).get("parts")) or []
                    text = "".join(p.get("text", "") for p in parts).strip()
                    return self.send_json(200, {"ok": True, "text": text, "engine": "gemini"})

                return self.send_json(400, {"ok": False, "error": "Yerel Whisper bulunamadı ve API anahtarı tanımlı değil."})
            except Exception as e:
                return self.send_json(500, {"ok": False, "error": str(e)})

        return self.send_json(404, {"ok": False, "error": "Bilinmeyen uç nokta"})


class ReusableTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with ReusableTCPServer(("127.0.0.1", PORT), AtelierHandler) as httpd:
        print(f"Atelier OS sunucusu http://127.0.0.1:{PORT}/ üzerinde çalışıyor", flush=True)
        httpd.serve_forever()
