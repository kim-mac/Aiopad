/* ── Orbit Content Script ─────────────────────────────────────────── */
console.log('[Orbit] loaded ✓');

/* ────────────────────────────────────────────────────────────────────
   THEME PALETTE  (mirrors src/themes.ts + src/App.tsx)
   ──────────────────────────────────────────────────────────────────── */
const THEME_PALETTE = {
  ocean: {
    light: { bg: '#ffffff', pill: '#e3f2fd', border: '#90caf9', text: '#0d47a1', primary: '#0288d1', btnText: '#fff' },
    dark:  { bg: '#1565c0', pill: '#0d47a1', border: '#1976d2', text: '#e3f2fd', primary: '#29b6f6', btnText: '#fff' },
  },
  forest: {
    light: { bg: '#ffffff', pill: '#f1f8e9', border: '#a5d6a7', text: '#1b5e20', primary: '#2e7d32', btnText: '#fff' },
    dark:  { bg: '#2e7d32', pill: '#1b5e20', border: '#388e3c', text: '#f1f8e9', primary: '#66bb6a', btnText: '#fff' },
  },
  sunset: {
    light: { bg: '#ffffff', pill: '#fff3e0', border: '#ffcc80', text: '#e65100', primary: '#f57c00', btnText: '#fff' },
    dark:  { bg: '#f57c00', pill: '#e65100', border: '#fb8c00', text: '#fff3e0', primary: '#ffb74d', btnText: '#000' },
  },
  lavender: {
    light: { bg: '#ffffff', pill: '#f3e5f5', border: '#ce93d8', text: '#4a148c', primary: '#7b1fa2', btnText: '#fff' },
    dark:  { bg: '#6a1b9a', pill: '#4a148c', border: '#7b1fa2', text: '#f3e5f5', primary: '#ba68c8', btnText: '#fff' },
  },
  blackwhite: {
    light: { bg: '#ffffff', pill: '#f5f5f5', border: '#cccccc', text: '#000000', primary: '#000000', btnText: '#fff' },
    dark:  { bg: '#111111', pill: '#000000', border: '#333333', text: '#ffffff', primary: '#ffffff', btnText: '#000' },
  },
};

/* ────────────────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────────────────── */
let root      = null;
let circle    = null;
let panel     = null;
let askRow    = null;
let answerEl  = null;

let selectionText = '';
let selTimer      = null;

let posX = window.innerWidth  - 60;
let posY = window.innerHeight - 60;

let pinned    = false;   // stops cursor-following when true
let minimized = false;   // circle hidden; only restored by page reload or future shortcut

let dragging   = false;
let dragStartX = 0, dragStartY = 0;
let dragOrigX  = 0, dragOrigY  = 0;
let didDrag    = false;

let isTyping   = false;  // user is actively typing in orbit input

/* ────────────────────────────────────────────────────────────────────
   THEME
   ──────────────────────────────────────────────────────────────────── */
function applyTheme(variant, mode, fontFamily) {
  const c = (THEME_PALETTE[variant] || THEME_PALETTE.ocean)[mode] || THEME_PALETTE.ocean.dark;
  if (!root) return;
  root.style.setProperty('--ob-bg',      c.bg);
  root.style.setProperty('--ob-pill',    c.pill);
  root.style.setProperty('--ob-border',  c.border);
  root.style.setProperty('--ob-text',    c.text);
  root.style.setProperty('--ob-primary', c.primary);
  root.style.setProperty('--ob-btntxt',  c.btnText);
  root.style.setProperty('--ob-font',    fontFamily || '"JetBrains Mono", monospace');
}

// Load stored theme on startup
chrome.storage.local.get(
  { orbitTheme: 'ocean', orbitMode: 'dark', orbitFont: '"JetBrains Mono", monospace' },
  ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
);

// React to theme changes pushed by Aiopad (or any other tab via chrome.storage)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.orbitTheme || changes.orbitMode || changes.orbitFont) {
    chrome.storage.local.get(
      { orbitTheme: 'ocean', orbitMode: 'dark', orbitFont: '"JetBrains Mono", monospace' },
      ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
    );
  }
});

// If this IS the Aiopad tab, listen for live theme changes and sync to chrome.storage
window.addEventListener('aiopad:themeChanged', (e) => {
  const { variant, mode, fontFamily } = e.detail || {};
  chrome.runtime.sendMessage({ type: 'SYNC_THEME', variant, mode, fontFamily });
  applyTheme(variant, mode, fontFamily);
});

// Also attempt a one-time sync on load (catches already-open Aiopad tabs)
(function syncIfAiopad() {
  const variant    = localStorage.getItem('notepad-theme-variant');
  const mode       = localStorage.getItem('notepad-color-mode');
  if (variant && mode) {
    const fontFamily = '"JetBrains Mono", monospace';
    chrome.runtime.sendMessage({ type: 'SYNC_THEME', variant, mode, fontFamily });
    // applyTheme will be called once chrome.storage.onChanged fires
  }
})();

/* ────────────────────────────────────────────────────────────────────
   BUILD DOM
   ──────────────────────────────────────────────────────────────────── */
function init() {
  if (document.getElementById('orbit-root')) return; // already mounted

  root = document.createElement('div');
  root.id = 'orbit-root';

  root.innerHTML = `
    <div id="orbit-panel">
      <div class="orbit-pill">
        <div class="orbit-drag-handle" id="orbit-drag-handle" title="Drag to move">&#9711;</div>
        <button class="orbit-btn orbit-btn-send" id="orbit-send">&#128206; Send to Aiopad</button>
        <div class="orbit-divider"></div>
        <button class="orbit-btn orbit-btn-ask"  id="orbit-ask-btn">&#10022; Ask Orbit</button>
        <button class="orbit-min-btn"            id="orbit-minimize" title="Minimize">&#8722;</button>
      </div>
      <div class="orbit-ask-row" id="orbit-ask-row">
        <input  class="orbit-input"  id="orbit-input"  placeholder="Ask about this text…" />
        <button class="orbit-submit" id="orbit-submit">Ask</button>
      </div>
      <div class="orbit-answer" id="orbit-answer"></div>
    </div>
    <div id="orbit-circle" title="Orbit — drag to move">&#9711;</div>
  `;

  document.body.appendChild(root);

  circle   = root.querySelector('#orbit-circle');
  panel    = root.querySelector('#orbit-panel');
  askRow   = root.querySelector('#orbit-ask-row');
  answerEl = root.querySelector('#orbit-answer');

  setPos(posX, posY);
  showCircle();

  // Apply stored theme now that root exists
  chrome.storage.local.get(
    { orbitTheme: 'ocean', orbitMode: 'dark', orbitFont: '"JetBrains Mono", monospace' },
    ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
  );

  /* ── Button events (mousedown preserves page selection) ── */
  root.querySelector('#orbit-send')    .addEventListener('mousedown', e => { e.preventDefault(); handleSend(); });
  root.querySelector('#orbit-ask-btn') .addEventListener('mousedown', e => { e.preventDefault(); handleAskToggle(); });
  root.querySelector('#orbit-submit')  .addEventListener('mousedown', e => { e.preventDefault(); handleAskSubmit(); });
  root.querySelector('#orbit-minimize').addEventListener('mousedown', e => { e.preventDefault(); handleMinimize(); });

  const inp = root.querySelector('#orbit-input');
  inp.addEventListener('focus', () => { isTyping = true; });
  inp.addEventListener('blur',  () => { isTyping = false; });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); handleAskSubmit(); }
    if (e.key === 'Escape') { collapsePanel(); }
  });

  /* ── Drag — circle and panel handle both work ── */
  circle.addEventListener('mousedown', onDragStart);
  root.querySelector('#orbit-drag-handle').addEventListener('mousedown', onDragStart);
}

/* ────────────────────────────────────────────────────────────────────
   POSITIONING
   ──────────────────────────────────────────────────────────────────── */
function setPos(x, y) {
  const m = 6;
  posX = Math.max(m, Math.min(x, window.innerWidth  - 46));
  posY = Math.max(m, Math.min(y, window.innerHeight - 46));
  if (root) { root.style.left = posX + 'px'; root.style.top = posY + 'px'; }
}

/* ── Cursor following ── */
document.addEventListener('mousemove', e => {
  if (!root || minimized || pinned || dragging) return;
  setPos(e.clientX + 16, e.clientY + 16);
}, { passive: true });

/* ────────────────────────────────────────────────────────────────────
   DRAG
   ──────────────────────────────────────────────────────────────────── */
function onDragStart(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  dragging   = true;
  didDrag    = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragOrigX  = posX;
  dragOrigY  = posY;

  circle.classList.add('dragging');
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup',   onDragEnd);
}

function onDragMove(e) {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
  if (didDrag) setPos(dragOrigX + dx, dragOrigY + dy);
}

function onDragEnd() {
  dragging = false;
  if (didDrag) pinned = true;
  circle.classList.remove('dragging');
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup',   onDragEnd);
}

/* ────────────────────────────────────────────────────────────────────
   VISIBILITY STATES
   ──────────────────────────────────────────────────────────────────── */
function showCircle() {
  if (minimized) return; // minimize is sticky — only the button un-minimizes
  circle.style.display = 'flex';
  panel.classList.remove('visible');
}

function expandPanel() {
  if (minimized) return;
  pinned = true; // freeze while panel is open
  circle.style.display = 'none';
  panel.classList.add('visible');
}

function collapsePanel() {
  // Reset ask UI
  askRow.classList.remove('open');
  answerEl.classList.remove('open');
  answerEl.textContent = '';
  const inp = root && root.querySelector('#orbit-input');
  if (inp) { inp.value = ''; inp.blur(); }
  isTyping = false;
  showCircle(); // respects minimized guard
}

function handleMinimize() {
  minimized = true;
  circle.style.display = 'none';
  panel.classList.remove('visible');
}

/* ────────────────────────────────────────────────────────────────────
   SELECTION DETECTION
   ──────────────────────────────────────────────────────────────────── */
document.addEventListener('selectionchange', () => {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => {
    // Don't process while user is actively typing in orbit's input
    if (isTyping) return;

    const sel  = window.getSelection();
    const text = sel ? sel.toString().trim() : '';

    if (!text || text.length < 3) {
      collapsePanel();
      return;
    }

    selectionText = text;
    expandPanel();
  }, 150);
});

/* ────────────────────────────────────────────────────────────────────
   SEND TO AIOPAD
   ──────────────────────────────────────────────────────────────────── */
function handleSend() {
  if (!selectionText) return;
  const sendBtn = root.querySelector('#orbit-send');
  sendBtn.disabled    = true;
  sendBtn.textContent = '…';

  chrome.runtime.sendMessage({ type: 'SEND_TO_AIOPAD', text: selectionText }, () => {
    sendBtn.disabled    = false;
    sendBtn.innerHTML   = '&#128206; Send to Aiopad';

    // Collapse panel and flash a green tick on the circle
    collapsePanel();
    circle.style.display = 'flex';
    circle.classList.add('sent');
    setTimeout(() => circle.classList.remove('sent'), 2200);
  });
}

/* ────────────────────────────────────────────────────────────────────
   ASK ORBIT
   ──────────────────────────────────────────────────────────────────── */
function handleAskToggle() {
  const open = askRow.classList.contains('open');
  if (!open) {
    askRow.classList.add('open');
    setTimeout(() => { const inp = root.querySelector('#orbit-input'); if (inp) inp.focus(); }, 40);
  } else {
    askRow.classList.remove('open');
    answerEl.classList.remove('open');
  }
}

function handleAskSubmit() {
  const inp      = root.querySelector('#orbit-input');
  const question = inp ? inp.value.trim() : '';
  if (!question || !selectionText) return;

  const btn = root.querySelector('#orbit-submit');
  btn.disabled    = true;
  btn.textContent = '…';
  answerEl.classList.remove('open');

  // Blur so selectionchange guard releases after reply arrives
  if (inp) inp.blur();
  isTyping = false;

  chrome.runtime.sendMessage({ type: 'ASK_ORBIT', text: selectionText, question }, resp => {
    btn.disabled    = false;
    btn.textContent = 'Ask';
    answerEl.textContent = (resp && resp.answer)
      ? resp.answer
      : '⚠ ' + ((resp && resp.error) || 'No response.');
    answerEl.classList.add('open');
  });
}

/* ────────────────────────────────────────────────────────────────────
   INJECT NOTE  (when this page IS the Aiopad tab)
   ──────────────────────────────────────────────────────────────────── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'INJECT_NOTE' && msg.note) {
    window.dispatchEvent(new CustomEvent('orbit:addNote', { detail: msg.note }));
    sendResponse({ ok: true });
  }
});

/* ────────────────────────────────────────────────────────────────────
   BOOT
   ──────────────────────────────────────────────────────────────────── */
if (document.body) {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
