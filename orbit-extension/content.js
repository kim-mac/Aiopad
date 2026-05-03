/* ── Orbit Content Script ─────────────────────────────────────────── */

let bubble        = null;
let askRow        = null;
let answerPanel   = null;
let selectionText = '';

/* ── Build bubble (once) ──────────────────────────────────────────── */
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
      <input class="orbit-input" id="orbit-input" placeholder="Ask about the selected text…" />
      <button class="orbit-submit" id="orbit-submit">Ask</button>
    </div>
    <div class="orbit-answer" id="orbit-answer"></div>
  `;
  document.body.appendChild(el);
  bubble      = el;
  askRow      = document.getElementById('orbit-ask-row');
  answerPanel = document.getElementById('orbit-answer');

  document.getElementById('orbit-send').addEventListener('mousedown', e => { e.preventDefault(); handleSend(); });
  document.getElementById('orbit-ask-btn').addEventListener('mousedown', e => { e.preventDefault(); handleAskToggle(); });
  document.getElementById('orbit-submit').addEventListener('mousedown', e => { e.preventDefault(); handleAskSubmit(); });
  document.getElementById('orbit-input').addEventListener('keydown', e => {
    if (e.key === 'Enter')  handleAskSubmit();
    if (e.key === 'Escape') hideBubble();
  });
}

/* ── Show ─────────────────────────────────────────────────────────── */
function showBubble(viewportRect) {
  buildBubble();

  // Reset panels
  askRow.style.display      = 'none';
  answerPanel.style.display = 'none';
  answerPanel.textContent   = '';
  const inp = document.getElementById('orbit-input');
  if (inp) inp.value = '';

  // Position: centred above selection, clamped to viewport
  const margin  = 10;
  const estW    = 310;  // approximate bubble width
  const estH    = 46;   // approximate bubble height

  const selMidX = viewportRect.left + viewportRect.width / 2;
  let left = selMidX - estW / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth  - estW - margin));

  let top = viewportRect.top - estH - 10;
  if (top < margin) top = viewportRect.bottom + 10;   // flip below if no room

  bubble.style.left    = left + 'px';
  bubble.style.top     = top  + 'px';
  bubble.style.display = 'block';
}

function hideBubble() {
  if (bubble) bubble.style.display = 'none';
}

/* ── Selection listener ───────────────────────────────────────────── */
document.addEventListener('mouseup', () => {
  setTimeout(() => {
    const sel  = window.getSelection();
    const text = sel ? sel.toString().trim() : '';

    if (!text || text.length < 3) {
      hideBubble();
      return;
    }

    if (!sel.rangeCount) return;
    selectionText = text;

    // getBoundingClientRect() returns VIEWPORT coordinates → correct for position:fixed
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    showBubble(rect);
  }, 30);
});

/* Hide on click outside */
document.addEventListener('mousedown', e => {
  if (bubble && bubble.style.display !== 'none' && !bubble.contains(e.target)) {
    // Give button mousedown handlers a chance to fire first
    setTimeout(hideBubble, 150);
  }
});

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
  const visible = askRow.style.display === 'flex';
  askRow.style.display = visible ? 'none' : 'flex';
  if (!visible) setTimeout(() => document.getElementById('orbit-input').focus(), 50);
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
    answerPanel.textContent   = (resp && resp.answer) ? resp.answer : '⚠ ' + ((resp && resp.error) || 'No response. Check API key in Orbit Settings.');
    answerPanel.style.display = 'block';
  });
}

/* ── Toast ────────────────────────────────────────────────────────── */
function showToast(msg) {
  let t = document.getElementById('orbit-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'orbit-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity   = '1';
  t.style.transform = 'translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 2500);
}
