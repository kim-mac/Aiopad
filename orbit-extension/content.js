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
   STATE
   ──────────────────────────────────────────────────────────────────── */
let circleEl  = null;   // tiny dot following cursor
let pillEl    = null;   // action panel at selection point
let askRow    = null;
let answerEl  = null;
let sentEl    = null;

let selText   = '';     // current selected text
let selTimer  = null;
let isTyping  = false;  // user typing in orbit input
let pillOpen  = false;  // pill currently visible

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
  // Also update circle color directly
  if (circleEl) circleEl.style.background = c.primary;
}

chrome.storage.local.get(
  { orbitTheme:'ocean', orbitMode:'dark', orbitFont:'"JetBrains Mono", monospace' },
  ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.orbitEnabled) {
    const enabled = changes.orbitEnabled.newValue;
    if (!enabled) shutdownOrbit();
    else if (circleEl) circleEl.style.display = 'block';
    return;
  }
  if (changes.orbitTheme || changes.orbitMode || changes.orbitFont) {
    chrome.storage.local.get(
      { orbitTheme:'ocean', orbitMode:'dark', orbitFont:'"JetBrains Mono", monospace' },
      ({ orbitTheme, orbitMode, orbitFont }) => applyTheme(orbitTheme, orbitMode, orbitFont)
    );
  }
});

// Live theme sync when on the Aiopad tab
window.addEventListener('aiopad:themeChanged', (e) => {
  const { variant, mode, fontFamily } = e.detail || {};
  chrome.runtime.sendMessage({ type:'SYNC_THEME', variant, mode, fontFamily });
  applyTheme(variant, mode, fontFamily);
});

// One-time sync if this IS the Aiopad tab
(function syncIfAiopad() {
  const variant = localStorage.getItem('notepad-theme-variant');
  const mode    = localStorage.getItem('notepad-color-mode');
  if (variant && mode) {
    chrome.runtime.sendMessage({ type:'SYNC_THEME', variant, mode, fontFamily:'"JetBrains Mono", monospace' });
  }
})();

/* ────────────────────────────────────────────────────────────────────
   BUILD DOM
   ──────────────────────────────────────────────────────────────────── */
function init() {
  // Check enabled flag first
  chrome.storage.local.get({ orbitEnabled: true }, ({ orbitEnabled }) => {
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
    <div class="ob-ask-row" id="ob-ask-row">
      <input class="ob-input" id="ob-input" placeholder="Ask about this text…" />
      <button class="ob-submit" id="ob-submit">Ask</button>
    </div>
    <div class="ob-answer" id="ob-answer"></div>
  `;
  document.body.appendChild(pillEl);

  askRow   = pillEl.querySelector('#ob-ask-row');
  answerEl = pillEl.querySelector('#ob-answer');
  sentEl   = pillEl.querySelector('#ob-sent');

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
    if (e.key === 'Enter')  { e.preventDefault(); handleAskSubmit(); }
    if (e.key === 'Escape') { minimizeToBubble(); }
  });

  /* ── Drag pill via handle ── */
  pillEl.querySelector('#ob-handle').addEventListener('mousedown', onDragStart);

  /* ── Apply stored theme ── */
  chrome.storage.local.get(
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
  const pw = 300; // approx pill width
  const vw = window.innerWidth;
  // Keep pill on screen horizontally
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
  // Position pill below cursor
  setPillPos(curX + 8, curY + 22);
  pillEl.classList.add('visible');
  pillOpen = true;
  // Hide circle while pill is open to avoid overlap
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
  if (answerEl) { answerEl.classList.remove('open'); answerEl.textContent = ''; }
  if (sentEl)   sentEl.classList.remove('show');
  const sendBtn = pillEl.querySelector('#ob-send');
  if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '&#128206; Send to Aiopad'; }
  const subBtn = pillEl.querySelector('#ob-submit');
  if (subBtn) { subBtn.disabled = false; subBtn.textContent = 'Ask'; }
  clearTimeout(askTimeout);
  isTyping = false;
}

function minimizeToBubble() {
  hidePill();
  // Restore circle at current cursor position
  if (circleEl) {
    setCirclePos(curX + 14, curY + 14);
    circleEl.style.display = 'block';
    circlePinned = false;
  }
}

function closeOrbit() {
  hidePill();
  if (circleEl) circleEl.style.display = 'none';
  // Persist disabled so popup can toggle back on
  chrome.storage.local.set({ orbitEnabled: false });
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
      // Only collapse if pill is open; don't touch closed state
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
  if (!selText) return;
  const sendBtn = pillEl.querySelector('#ob-send');
  sendBtn.disabled    = true;
  sendBtn.textContent = '…';

  chrome.runtime.sendMessage({ type:'SEND_TO_AIOPAD', text: selText }, () => {
    sendBtn.disabled  = false;
    sendBtn.innerHTML = '&#128206; Send to Aiopad';
    // Show green tick inside the pill
    sentEl.classList.add('show');
    setTimeout(() => {
      sentEl.classList.remove('show');
      minimizeToBubble();
    }, 2000);
  });
}

/* ────────────────────────────────────────────────────────────────────
   ASK ORBIT
   ──────────────────────────────────────────────────────────────────── */
function handleAskToggle() {
  const open = askRow.classList.contains('open');
  if (open) {
    askRow.classList.remove('open');
    answerEl.classList.remove('open');
  } else {
    askRow.classList.add('open');
    setTimeout(() => pillEl.querySelector('#ob-input').focus(), 40);
  }
}

function handleAskSubmit() {
  const inp      = pillEl.querySelector('#ob-input');
  const question = inp ? inp.value.trim() : '';
  if (!question || !selText) return;

  const subBtn = pillEl.querySelector('#ob-submit');
  subBtn.disabled    = true;
  subBtn.textContent = '…';
  answerEl.classList.remove('open');

  // Blur to release the isTyping guard
  inp.blur();
  isTyping = false;

  // Safety timeout — re-enable button if no response in 30s
  clearTimeout(askTimeout);
  askTimeout = setTimeout(() => {
    subBtn.disabled    = false;
    subBtn.textContent = 'Ask';
    answerEl.textContent = '⚠ Request timed out.';
    answerEl.classList.add('open');
  }, 30000);

  chrome.runtime.sendMessage({ type:'ASK_ORBIT', text: selText, question }, resp => {
    clearTimeout(askTimeout);
    subBtn.disabled    = false;
    subBtn.textContent = 'Ask';
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
