/* ── Orbit Content Script ─────────────────────────────────────────── */
console.log('[Orbit] loaded ✓');

/* ── State ────────────────────────────────────────────────────────── */
let root        = null;   // #orbit-root
let circle      = null;   // #orbit-circle
let panel       = null;   // #orbit-panel
let askRow      = null;
let answerEl    = null;

let selectionText = '';
let selTimer      = null;

// Position of the circle (viewport coords)
let posX = window.innerWidth  - 60;
let posY = window.innerHeight - 60;

// When pinned == false the circle tracks the cursor
let pinned    = false;
let minimized = false;

// Drag state
let dragging    = false;
let dragStartX  = 0;
let dragStartY  = 0;
let dragOrigX   = 0;
let dragOrigY   = 0;
let didDrag     = false;  // distinguish drag from click

/* ── Build DOM ────────────────────────────────────────────────────── */
function init() {
  root = document.createElement('div');
  root.id = 'orbit-root';

  root.innerHTML = `
    <div id="orbit-panel">
      <div class="orbit-pill">
        <div class="orbit-pill-logo" id="orbit-drag-handle">&#9711;</div>
        <button class="orbit-btn orbit-btn-send"  id="orbit-send">&#128206; Send to Aiopad</button>
        <div class="orbit-divider"></div>
        <button class="orbit-btn orbit-btn-ask"   id="orbit-ask-btn">&#10022; Ask Orbit</button>
        <button class="orbit-minimize"            id="orbit-minimize" title="Minimize">&#8722;</button>
      </div>
      <div class="orbit-ask-row" id="orbit-ask-row">
        <input  class="orbit-input"  id="orbit-input"  placeholder="Ask about this text…" />
        <button class="orbit-submit" id="orbit-submit">Ask</button>
      </div>
      <div class="orbit-answer" id="orbit-answer"></div>
    </div>
    <div id="orbit-circle">&#9711;</div>
  `;

  document.body.appendChild(root);

  circle    = document.getElementById('orbit-circle');
  panel     = document.getElementById('orbit-panel');
  askRow    = document.getElementById('orbit-ask-row');
  answerEl  = document.getElementById('orbit-answer');

  setPos(posX, posY);
  showCircle();

  /* Button listeners — mousedown so selection isn't lost */
  document.getElementById('orbit-send')     .addEventListener('mousedown', e => { e.preventDefault(); handleSend(); });
  document.getElementById('orbit-ask-btn')  .addEventListener('mousedown', e => { e.preventDefault(); handleAskToggle(); });
  document.getElementById('orbit-submit')   .addEventListener('mousedown', e => { e.preventDefault(); handleAskSubmit(); });
  document.getElementById('orbit-minimize') .addEventListener('mousedown', e => { e.preventDefault(); handleMinimize(); });
  document.getElementById('orbit-input')    .addEventListener('keydown', e => {
    if (e.key === 'Enter')  handleAskSubmit();
    if (e.key === 'Escape') collapsePanel();
  });

  /* Drag via circle */
  circle.addEventListener('mousedown', onDragStart);

  /* Drag via panel logo handle */
  document.getElementById('orbit-drag-handle').addEventListener('mousedown', onDragStart);
}

/* ── Positioning ──────────────────────────────────────────────────── */
function setPos(x, y) {
  const margin = 6;
  posX = Math.max(margin, Math.min(x, window.innerWidth  - 42));
  posY = Math.max(margin, Math.min(y, window.innerHeight - 42));
  root.style.left = posX + 'px';
  root.style.top  = posY + 'px';
}

/* ── Cursor following ─────────────────────────────────────────────── */
document.addEventListener('mousemove', e => {
  if (minimized || pinned || dragging) return;
  // Trail slightly behind cursor
  setPos(e.clientX + 18, e.clientY + 18);
}, { passive: true });

/* ── Drag ─────────────────────────────────────────────────────────── */
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

/* ── Show / hide states ───────────────────────────────────────────── */
function showCircle() {
  minimized = false;
  circle.style.display = 'flex';
  panel.classList.remove('visible');
}

function expandPanel() {
  minimized = false;
  pinned    = true;   // freeze position while panel is open
  circle.style.display = 'none';
  panel.classList.add('visible');
}

function collapsePanel() {
  // Reset ask UI
  askRow.classList.remove('open');
  answerEl.classList.remove('open');
  answerEl.textContent = '';
  const inp = document.getElementById('orbit-input');
  if (inp) inp.value = '';
  showCircle();
}

function handleMinimize() {
  minimized = true;
  circle.style.display = 'none';
  panel.classList.remove('visible');
}

/* ── Selection detection ──────────────────────────────────────────── */
document.addEventListener('selectionchange', () => {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => {
    // Don't collapse if user is typing in our input
    if (root && root.contains(document.activeElement)) return;

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

/* ── Send to Aiopad ───────────────────────────────────────────────── */
function handleSend() {
  if (!selectionText) return;
  chrome.runtime.sendMessage({ type: 'SEND_TO_AIOPAD', text: selectionText }, resp => {
    // Show green tick on the circle briefly
    collapsePanel();
    circle.style.display = 'flex';
    circle.classList.add('sent');
    setTimeout(() => circle.classList.remove('sent'), 2000);
  });
}

/* ── Ask Orbit ────────────────────────────────────────────────────── */
function handleAskToggle() {
  const open = askRow.classList.contains('open');
  askRow.classList.toggle('open', !open);
  if (!open) setTimeout(() => document.getElementById('orbit-input').focus(), 50);
}

function handleAskSubmit() {
  const question = document.getElementById('orbit-input').value.trim();
  if (!question || !selectionText) return;

  const btn = document.getElementById('orbit-submit');
  btn.disabled    = true;
  btn.textContent = '…';
  answerEl.classList.remove('open');

  chrome.runtime.sendMessage({ type: 'ASK_ORBIT', text: selectionText, question }, resp => {
    btn.disabled    = false;
    btn.textContent = 'Ask';
    answerEl.textContent = (resp && resp.answer)
      ? resp.answer
      : '⚠ ' + ((resp && resp.error) || 'No response.');
    answerEl.classList.add('open');
  });
}

/* ── Receive INJECT_NOTE (when this IS the Aiopad tab) ───────────── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'INJECT_NOTE' && msg.note) {
    window.dispatchEvent(new CustomEvent('orbit:addNote', { detail: msg.note }));
    sendResponse({ ok: true });
  }
});

/* ── Boot ─────────────────────────────────────────────────────────── */
if (document.body) {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
