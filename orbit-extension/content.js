/* ── Orbit Content Script ─────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────
   THEME PALETTE  (mirrors src/themes.ts)
   ──────────────────────────────────────────────────────────────────── */
const THEME_PALETTE = {
  ocean:      { light: { bg:'#ffffff', pill:'#e3f2fd', border:'#90caf9', text:'#0d47a1', primary:'#0288d1', btntxt:'#fff' },
                dark:  { bg:'#1565c0', pill:'#0d47a1', border:'#1976d2', text:'#e3f2fd', primary:'#29b6f6', btntxt:'#fff' } },
  forest:     { light: { bg:'#ffffff', pill:'#f1f8e9', border:'#a5d6a7', text:'#1b5e20', primary:'#2e7d32', btntxt:'#fff' },
                dark:  { bg:'#2e7d32', pill:'#1b5e20', border:'#388e3c', text:'#f1f8e9', primary:'#66bb6a', btntxt:'#fff' } },
  sunset:     { light: { bg:'#ffffff', pill:'#fff3e0', border:'#ffcc80', text:'#e65100', primary:'#f57c00', btntxt:'#fff' },
                dark:  { bg:'#f57c00', pill:'#e65100', border:'#fb8c00', text:'#fff3e0', primary:'#ffb74d', btntxt:'#000' } },
  lavender:   { light: { bg:'#ffffff', pill:'#f3e5f5', border:'#ce93d8', text:'#4a148c', primary:'#7b1fa2', btntxt:'#fff' },
                dark:  { bg:'#6a1b9a', pill:'#4a148c', border:'#7b1fa2', text:'#f3e5f5', primary:'#ba68c8', btntxt:'#fff' } },
  blackwhite: { light: { bg:'#ffffff', pill:'#f5f5f5', border:'#cccccc', text:'#000000', primary:'#555555', btntxt:'#fff' },
                dark:  { bg:'#111111', pill:'#000000', border:'#333333', text:'#ffffff', primary:'#aaaaaa', btntxt:'#000' } },
};

/* ────────────────────────────────────────────────────────────────────
   CHROME CONTEXT GUARD
   Any chrome.* call after context invalidation throws. Centralise the
   check so every API call goes through it.
   ──────────────────────────────────────────────────────────────────── */
function chromeOk() {
  try { return !!(chrome && chrome.runtime && chrome.runtime.id); }
  catch (_) { return false; }
}

function safeStorageGet(keys, cb) {
  if (!chromeOk()) return;
  try { chrome.storage.local.get(keys, cb); } catch (_) {}
}

function safeStorageSet(obj) {
  if (!chromeOk()) return;
  try { chrome.storage.local.set(obj); } catch (_) {}
}

function safeSendMessage(msg, cb) {
  if (!chromeOk()) {
    if (cb) cb(null);
    return;
  }
  try {
    chrome.runtime.sendMessage(msg, (resp) => {
      // chrome.runtime.lastError must be read to suppress console errors
      void chrome.runtime.lastError;
      if (cb) cb(resp);
    });
  } catch (_) {
    if (cb) cb(null);
  }
}

/* ────────────────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────────────────── */
let circleEl  = null;   // tiny dot following cursor
let pillEl    = null;   // action panel at selection point
let askRow    = null;
let answerEl  = null;
let sentEl    = null;

let selText     = '';     // current selected text
let selTimer    = null;
let isTyping    = false;  // user typing in orbit input
let pillOpen    = false;  // pill currently visible
let chatHistory = [];     // [{ role: 'user'|'assistant', content: string }]

// Cursor tracking
let curX = window.innerWidth  / 2;
let curY = window.innerHeight / 2;

// Pill pinned position (set when selection is made)
let pillX = 0;
let pillY = 0;

// Circle pinned (set on drag)
let circlePinned = false;
let circleX = window.innerWidth  - 40;
let circleY = window.innerHeight - 40;

// Drag state for pill
let dragging   = false;
let dragStartX = 0, dragStartY = 0;
let dragOrigX  = 0, dragOrigY  = 0;
let didDrag    = false;

let askTimeout = null;

/* ────────────────────────────────────────────────────────────────────
   THEME
   ──────────────────────────────────────────────────────────────────── */
function applyTheme(variant, mode, fontFamily) {
  const c = (THEME_PALETTE[variant] || THEME_PALETTE.ocean)[mode] || THEME_PALETTE.ocean.dark;
  const font = fontFamily || '"JetBrains Mono", monospace';
  const root = document.documentElement;
  root.style.setProperty('--ob-bg',      c.bg);
  root.style.setProperty('--ob-pill',    c.pill);
  root.style.setProperty('--ob-border',  c.border);
  root.style.setProperty('--ob-text',    c.text);
  root.style.setProperty('--ob-primary', c.primary);
  root.style.setProperty('--ob-btntxt',  c.btntxt);
  root.style.setProperty('--ob-font',    font);
  if (circleEl) circleEl.style.background = c.primary;
}

safeStorageGet(
  { orbitTheme:'ocean', orbitMode:'dark', orbitFont:'"JetBrains Mono", monospace' },
  ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
);

try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.orbitEnabled) {
      const enabled = changes.orbitEnabled.newValue;
      if (!enabled) shutdownOrbit();
      else if (circleEl) circleEl.style.display = 'block';
      return;
    }
    if (changes.orbitTheme || changes.orbitMode || changes.orbitFont) {
      safeStorageGet(
        { orbitTheme:'ocean', orbitMode:'dark', orbitFont:'"JetBrains Mono", monospace' },
        ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
      );
    }
  });
} catch (_) {}

// Live theme sync when on the Aiopad tab
window.addEventListener('aiopad:themeChanged', (e) => {
  const { variant, mode, fontFamily } = e.detail || {};
  safeSendMessage({ type:'SYNC_THEME', variant, mode, fontFamily });
  applyTheme(variant, mode, fontFamily);
});

// One-time sync if this IS the Aiopad tab
(function syncIfAiopad() {
  const variant = localStorage.getItem('notepad-theme-variant');
  const mode    = localStorage.getItem('notepad-color-mode');
  if (variant && mode) {
    safeSendMessage({ type:'SYNC_THEME', variant, mode, fontFamily:'"JetBrains Mono", monospace' });
  }
})();

/* ────────────────────────────────────────────────────────────────────
   BUILD DOM
   ──────────────────────────────────────────────────────────────────── */
function init() {
  safeStorageGet({ orbitEnabled: true }, ({ orbitEnabled }) => {
    if (!orbitEnabled) return;
    buildDOM();
  });
}

function buildDOM() {
  if (document.getElementById('orbit-circle')) return;

  /* ── Circle ── */
  circleEl = document.createElement('div');
  circleEl.id = 'orbit-circle';
  document.body.appendChild(circleEl);
  setCirclePos(circleX, circleY);

  /* ── Pill ── */
  pillEl = document.createElement('div');
  pillEl.id = 'orbit-pill';
  pillEl.innerHTML = `
    <div class="ob-row">
      <div class="ob-handle" id="ob-handle">&#9711;</div>
      <button class="ob-btn ob-btn-send" id="ob-send">&#128206; Send to Aiopad</button>
      <div class="ob-sep"></div>
      <button class="ob-btn ob-btn-ask"  id="ob-ask">&#10022; Ask Orbit</button>
      <div class="ob-spacer"></div>
      <button class="ob-icon-btn" id="ob-minimize" title="Minimize to circle">&#8722;</button>
      <button class="ob-icon-btn" id="ob-close"    title="Close Orbit">&#215;</button>
    </div>
    <div class="ob-sent-feedback" id="ob-sent">&#10003; Sent to Aiopad</div>
    <div class="ob-chat-panel" id="ob-chat-panel">
      <div class="ob-chat-window" id="ob-chat-window"></div>
      <div class="ob-chat-input-row">
        <input class="ob-input" id="ob-input" placeholder="Ask about this text…" />
        <button class="ob-submit" id="ob-submit" title="Send">&#8593;</button>
      </div>
    </div>
  `;
  document.body.appendChild(pillEl);

  askRow  = pillEl.querySelector('#ob-chat-panel');
  sentEl  = pillEl.querySelector('#ob-sent');

  /* ── Button events ── */
  pillEl.querySelector('#ob-send')    .addEventListener('mousedown', e => { e.preventDefault(); handleSend(); });
  pillEl.querySelector('#ob-ask')     .addEventListener('mousedown', e => { e.preventDefault(); handleAskToggle(); });
  pillEl.querySelector('#ob-submit')  .addEventListener('mousedown', e => { e.preventDefault(); handleAskSubmit(); });
  pillEl.querySelector('#ob-minimize').addEventListener('mousedown', e => { e.preventDefault(); minimizeToBubble(); });
  pillEl.querySelector('#ob-close')   .addEventListener('mousedown', e => { e.preventDefault(); closeOrbit(); });

  const inp = pillEl.querySelector('#ob-input');
  inp.addEventListener('focus', () => { isTyping = true; });
  inp.addEventListener('blur',  () => { isTyping = false; });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskSubmit(); }
    if (e.key === 'Escape') { minimizeToBubble(); }
  });

  /* ── Drag pill via handle ── */
  pillEl.querySelector('#ob-handle').addEventListener('mousedown', onDragStart);

  /* ── Apply stored theme ── */
  safeStorageGet(
    { orbitTheme:'ocean', orbitMode:'dark', orbitFont:'"JetBrains Mono", monospace' },
    ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
  );
}

/* ────────────────────────────────────────────────────────────────────
   CIRCLE POSITIONING  — follows cursor until dragged
   ──────────────────────────────────────────────────────────────────── */
function setCirclePos(x, y) {
  const m = 4;
  circleX = Math.max(m, Math.min(x, window.innerWidth  - 20));
  circleY = Math.max(m, Math.min(y, window.innerHeight - 20));
  if (circleEl) { circleEl.style.left = circleX + 'px'; circleEl.style.top = circleY + 'px'; }
}

document.addEventListener('mousemove', e => {
  curX = e.clientX;
  curY = e.clientY;
  if (!circlePinned && circleEl && circleEl.style.display !== 'none') {
    setCirclePos(e.clientX + 14, e.clientY + 14);
  }
}, { passive: true });

/* ────────────────────────────────────────────────────────────────────
   PILL POSITIONING  — anchored below cursor where selection happened
   ──────────────────────────────────────────────────────────────────── */
function setPillPos(x, y) {
  const pw = 300;
  const vw = window.innerWidth;
  pillX = Math.max(8, Math.min(x, vw - pw - 8));
  pillY = y;
  if (pillEl) { pillEl.style.left = pillX + 'px'; pillEl.style.top = pillY + 'px'; }
}

/* ────────────────────────────────────────────────────────────────────
   PILL DRAG
   ──────────────────────────────────────────────────────────────────── */
function onDragStart(e) {
  if (e.button !== 0) return;
  e.preventDefault(); e.stopPropagation();
  dragging = true; didDrag = false;
  dragStartX = e.clientX; dragStartY = e.clientY;
  dragOrigX  = pillX;     dragOrigY  = pillY;
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup',   onDragEnd);
}
function onDragMove(e) {
  const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
  if (didDrag) setPillPos(dragOrigX + dx, dragOrigY + dy);
}
function onDragEnd() {
  dragging = false;
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup',   onDragEnd);
}

/* ────────────────────────────────────────────────────────────────────
   VISIBILITY STATES
   ──────────────────────────────────────────────────────────────────── */
function showPill() {
  // Guard: DOM not built yet (buildDOM is async behind storage.get)
  if (!pillEl) return;
  setPillPos(curX + 8, curY + 22);
  pillEl.classList.add('visible');
  pillOpen = true;
  if (circleEl) circleEl.style.display = 'none';
}

function hidePill() {
  if (!pillEl) return;
  pillEl.classList.remove('visible');
  pillOpen = false;
  resetPillUI();
}

function resetPillUI() {
  if (!pillEl) return;
  const inp = pillEl.querySelector('#ob-input');
  if (inp) { inp.value = ''; inp.blur(); }
  if (askRow) askRow.classList.remove('open');
  const chatWin = pillEl.querySelector('#ob-chat-window');
  if (chatWin) chatWin.innerHTML = '';
  chatHistory = [];
  if (sentEl) sentEl.classList.remove('show');
  const sendBtn = pillEl.querySelector('#ob-send');
  if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '&#128206; Send to Aiopad'; }
  const subBtn = pillEl.querySelector('#ob-submit');
  if (subBtn) { subBtn.disabled = false; subBtn.innerHTML = '&#8593;'; }
  clearTimeout(askTimeout);
  isTyping = false;
}

function minimizeToBubble() {
  hidePill();
  if (circleEl) {
    setCirclePos(curX + 14, curY + 14);
    circleEl.style.display = 'block';
    circlePinned = false;
  }
}

function closeOrbit() {
  hidePill();
  if (circleEl) circleEl.style.display = 'none';
  safeStorageSet({ orbitEnabled: false });
}

function shutdownOrbit() {
  hidePill();
  if (circleEl) circleEl.style.display = 'none';
}

/* ────────────────────────────────────────────────────────────────────
   SELECTION DETECTION
   ──────────────────────────────────────────────────────────────────── */
document.addEventListener('selectionchange', () => {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => {
    if (isTyping || dragging) return;

    const sel  = window.getSelection();
    const text = sel ? sel.toString().trim() : '';

    if (!text || text.length < 2) {
      if (pillOpen) minimizeToBubble();
      return;
    }

    selText = text;
    showPill();
  }, 160);
});

/* ────────────────────────────────────────────────────────────────────
   SEND TO AIOPAD
   ──────────────────────────────────────────────────────────────────── */
function handleSend() {
  if (!selText || !pillEl) return;
  const sendBtn = pillEl.querySelector('#ob-send');
  if (!sendBtn) return;
  sendBtn.disabled    = true;
  sendBtn.textContent = '…';

  safeSendMessage({ type:'SEND_TO_AIOPAD', text: selText }, () => {
    if (!pillEl) return;
    const btn = pillEl.querySelector('#ob-send');
    if (btn) { btn.disabled = false; btn.innerHTML = '&#128206; Send to Aiopad'; }
    if (sentEl) {
      sentEl.classList.add('show');
      setTimeout(() => {
        sentEl.classList.remove('show');
        minimizeToBubble();
      }, 2000);
    }
  });
}

/* ────────────────────────────────────────────────────────────────────
   ASK ORBIT — multi-turn chat
   ──────────────────────────────────────────────────────────────────── */
function handleAskToggle() {
  if (!askRow) return;
  const open = askRow.classList.contains('open');
  if (open) {
    askRow.classList.remove('open');
  } else {
    askRow.classList.add('open');
    if (pillEl) setTimeout(() => pillEl.querySelector('#ob-input').focus(), 40);
  }
}

function appendBubble(role, text) {
  if (!pillEl) return null;
  const chatWin = pillEl.querySelector('#ob-chat-window');
  if (!chatWin) return null;
  const bubble  = document.createElement('div');
  bubble.className = role === 'user' ? 'ob-msg ob-msg-user' : 'ob-msg ob-msg-ai';
  bubble.textContent = text;
  chatWin.appendChild(bubble);
  chatWin.scrollTop = chatWin.scrollHeight;
  return bubble;
}

function showTyping() {
  if (!pillEl) return null;
  const chatWin = pillEl.querySelector('#ob-chat-window');
  if (!chatWin) return null;
  let el = chatWin.querySelector('.ob-typing');
  if (!el) {
    el = document.createElement('div');
    el.className = 'ob-msg ob-msg-ai ob-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    chatWin.appendChild(el);
    chatWin.scrollTop = chatWin.scrollHeight;
  }
  return el;
}

function removeTyping() {
  if (!pillEl) return;
  const chatWin = pillEl.querySelector('#ob-chat-window');
  const el = chatWin && chatWin.querySelector('.ob-typing');
  if (el) el.remove();
}

function handleAskSubmit() {
  if (!pillEl) return;
  const inp      = pillEl.querySelector('#ob-input');
  const question = inp ? inp.value.trim() : '';
  if (!question || !selText) return;

  const subBtn = pillEl.querySelector('#ob-submit');
  if (subBtn) subBtn.disabled = true;
  if (inp) inp.value = '';

  appendBubble('user', question);
  chatHistory.push({ role: 'user', content: question });
  showTyping();

  if (inp) inp.blur();
  isTyping = false;

  clearTimeout(askTimeout);
  askTimeout = setTimeout(() => {
    removeTyping();
    appendBubble('assistant', '⚠ Request timed out. Please try again.');
    if (pillEl) {
      const btn = pillEl.querySelector('#ob-submit');
      if (btn) btn.disabled = false;
      const input = pillEl.querySelector('#ob-input');
      if (input) input.focus();
    }
  }, 30000);

  safeSendMessage(
    { type: 'ASK_ORBIT', context: selText, messages: chatHistory },
    resp => {
      clearTimeout(askTimeout);
      removeTyping();
      if (!pillEl) return;

      const btn   = pillEl.querySelector('#ob-submit');
      if (btn) btn.disabled = false;

      const answer = (resp && resp.answer)
        ? resp.answer
        : '⚠ ' + ((resp && resp.error) || 'Extension context lost — please reload the page.');

      appendBubble('assistant', answer);
      chatHistory.push({ role: 'assistant', content: answer });

      setTimeout(() => {
        if (pillEl) {
          const input = pillEl.querySelector('#ob-input');
          if (input) input.focus();
        }
      }, 50);
    }
  );
}

/* ────────────────────────────────────────────────────────────────────
   INJECT NOTE  (when this page IS the Aiopad tab)
   ──────────────────────────────────────────────────────────────────── */
try {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'INJECT_NOTE' && msg.note) {
      window.dispatchEvent(new CustomEvent('orbit:addNote', { detail: msg.note }));
      sendResponse({ ok: true });
    }
  });
} catch (_) {}

/* ────────────────────────────────────────────────────────────────────
   BOOT
   ──────────────────────────────────────────────────────────────────── */
if (document.body) {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
