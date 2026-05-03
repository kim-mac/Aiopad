/* ── Orbit Content Script ─────────────────────────────────────────── */
console.log('[Orbit] content script loaded ✓');

let bubble        = null;
let askRow        = null;
let answerPanel   = null;
let selectionText = '';
let selTimer      = null;
let mouseX        = 0;
let mouseY        = 0;

/* Track mouse position at all times */
document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}, true);

/* ── Build bubble DOM (once) ──────────────────────────────────────── */
function buildBubble() {
  if (bubble) return;
  const el = document.createElement('div');
  el.id = 'orbit-bubble';
  el.innerHTML = `
    <div class="orbit-pill">
      <span class="orbit-logo">&#9711;</span>
      <button class="orbit-btn orbit-btn-send" id="orbit-send">&#128206; Send to Aiopad</button>
      <div class="orbit-divider"></div>
      <button class="orbit-btn orbit-btn-ask" id="orbit-ask-btn">&#10022; Ask Orbit</button>
    </div>
    <div class="orbit-ask-row" id="orbit-ask-row">
      <input class="orbit-input" id="orbit-input" placeholder="Ask about this text…" />
      <button class="orbit-submit" id="orbit-submit">Ask</button>
    </div>
    <div class="orbit-answer" id="orbit-answer"></div>
  `;
  document.body.appendChild(el);
  bubble      = el;
  askRow      = document.getElementById('orbit-ask-row');
  answerPanel = document.getElementById('orbit-answer');

  /* Use mousedown so click doesn't clear the selection first */
  document.getElementById('orbit-send').addEventListener('mousedown',    e => { e.preventDefault(); handleSend(); });
  document.getElementById('orbit-ask-btn').addEventListener('mousedown', e => { e.preventDefault(); handleAskToggle(); });
  document.getElementById('orbit-submit').addEventListener('mousedown',  e => { e.preventDefault(); handleAskSubmit(); });
  document.getElementById('orbit-input').addEventListener('keydown', e => {
    if (e.key === 'Enter')  handleAskSubmit();
    if (e.key === 'Escape') hideBubble();
  });

  console.log('[Orbit] bubble DOM built ✓');
}

/* ── Show at a given viewport coordinate ─────────────────────────── */
function showBubbleAt(x, y) {
  buildBubble();

  askRow.style.display      = 'none';
  answerPanel.style.display = 'none';
  answerPanel.textContent   = '';
  const inp = document.getElementById('orbit-input');
  if (inp) inp.value = '';

  const margin = 10;
  const estW   = 310;
  const estH   = 46;
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;

  let left = x - estW / 2;
  left = Math.max(margin, Math.min(left, vw - estW - margin));

  let top = y - estH - 14;
  if (top < margin) top = y + 14;
  top = Math.max(margin, Math.min(top, vh - estH - margin));

  bubble.style.left    = left + 'px';
  bubble.style.top     = top  + 'px';
  bubble.style.display = 'block';

  console.log('[Orbit] bubble shown at', left, top);
}

function hideBubble() {
  if (bubble) bubble.style.display = 'none';
}

/* ── Selection detection via selectionchange ──────────────────────── */
document.addEventListener('selectionchange', () => {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => {
    // Never hide while the user is interacting with the bubble itself
    if (bubble && bubble.contains(document.activeElement)) return;

    const sel  = window.getSelection();
    const text = sel ? sel.toString().trim() : '';

    if (!text || text.length < 3) {
      hideBubble();
      return;
    }

    selectionText = text;
    console.log('[Orbit] selection detected:', text.slice(0, 40));

    /* Use the end of the selection range for position, fall back to mouse */
    if (sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        showBubbleAt(rect.left + rect.width / 2, rect.top);
        return;
      }
    }
    showBubbleAt(mouseX, mouseY);
  }, 200);
});

/* Hide when clicking outside the bubble */
document.addEventListener('mousedown', e => {
  if (bubble && bubble.style.display === 'block' && !bubble.contains(e.target)) {
    setTimeout(hideBubble, 200);
  }
}, true);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideBubble();
});

/* ── Send to Aiopad ───────────────────────────────────────────────── */
function handleSend() {
  if (!selectionText) return;
  hideBubble();
  chrome.runtime.sendMessage({ type: 'SEND_TO_AIOPAD', text: selectionText }, resp => {
    showToast(resp && resp.ok ? '✓ Sent to Aiopad!' : '⚠ Opening Aiopad…');
  });
}

/* ── Ask Orbit ────────────────────────────────────────────────────── */
function handleAskToggle() {
  const open = askRow.style.display === 'flex';
  askRow.style.display = open ? 'none' : 'flex';
  if (!open) setTimeout(() => document.getElementById('orbit-input').focus(), 50);
}

function handleAskSubmit() {
  const question = document.getElementById('orbit-input').value.trim();
  if (!question || !selectionText) return;
  const btn = document.getElementById('orbit-submit');
  btn.disabled    = true;
  btn.textContent = '…';
  answerPanel.style.display = 'none';
  chrome.runtime.sendMessage({ type: 'ASK_ORBIT', text: selectionText, question }, resp => {
    btn.disabled    = false;
    btn.textContent = 'Ask';
    answerPanel.textContent   = (resp && resp.answer) ? resp.answer : '⚠ ' + ((resp && resp.error) || 'No response.');
    answerPanel.style.display = 'block';
  });
}

/* ── Receive INJECT_NOTE from background (when on Aiopad tab) ────── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'INJECT_NOTE' && msg.note) {
    window.dispatchEvent(new CustomEvent('orbit:addNote', { detail: msg.note }));
    sendResponse({ ok: true });
  }
});

/* ── Toast ────────────────────────────────────────────────────────── */
function showToast(msg) {
  let t = document.getElementById('orbit-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'orbit-toast';
    document.body.appendChild(t);
  }
  t.textContent   = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 2500);
}
