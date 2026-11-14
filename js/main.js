import { store } from './store.js';
import { initShell } from './shell.js';
import { mountStudio } from './views/studio.js';
import { mountAI } from './views/ai.js';
import { mountPortfolio } from './views/portfolio.js';
import { mountVault } from './views/vault.js';

const VIEW_KEYS = ['studio', 'ai', 'portfolio', 'vault'];

function bootstrap() {
  // Apply initial theme & exposure tokens immediately
  document.documentElement.dataset.theme = store.state.theme;
  store.setExposure(store.state.exposure);
  store.hydrateGithub();

  initShell();

  const containers = {
    studio: document.getElementById('view-studio'),
    ai: document.getElementById('view-ai'),
    portfolio: document.getElementById('view-portfolio'),
    vault: document.getElementById('view-vault'),
  };

  // Keep all four workspaces mounted so audio, timers, and springs survive view switches
  mountStudio(containers.studio);
  mountAI(containers.ai);
  mountPortfolio(containers.portfolio);
  mountVault(containers.vault);

  const syncActiveView = (activeId) => {
    for (const key of VIEW_KEYS) {
      const el = containers[key];
      if (!el) continue;
      const isActive = key === activeId;
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-hidden', String(!isActive));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  syncActiveView(store.state.activeView);
  store.on('view', syncActiveView);

  // Number keys 1-4 switch spaces outside text inputs
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    const idx = Number(e.key) - 1;
    if (idx >= 0 && idx < VIEW_KEYS.length) {
      store.setView(VIEW_KEYS[idx]);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
