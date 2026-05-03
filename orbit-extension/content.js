/* ── Orbit Content Script ─────────────────────────────────────────── */

let bubble      = null;
let askRow      = null;
let answerPanel = null;
let selectionText = '';
let hideTimer   = null;

/* ── Build the bubble DOM (once) ─────────────────────────────────── */
function buildBubble() {
  if (bubble) return;

  bubble = document.createElement('div');
  bubble.id = 'orbit-bubble';
  bubble.innerHTML = `
    <div class="orbit-pill">
      <div class="orbit-logo">&#8857;</div>
      <button class="orbit-btn orbit-btn-send" id="orbit-send">
        <span class="orbit-btn-icon">&#128206;</span> Send to Aiopad
      </button>
      <div class="orbit-divider"></div>
      <button class="orbit-btn orbit-btn-ask" id="orbit-ask-btn">
        <span class="orbit-btn-icon">&#10022;</span> Ask Orbit
      </button>
    </div>
    <div class="orbit-ask-row" id="orbit-ask-row">
      <input class="orbit-input" id="orbit-input" placeholder="Ask about the selected text…" />
      <button class="orbit-submit" id="orbit-submit">Ask</button>
    </div>
    <div class="orbit-answer" id="orbit-answer"></div>
  `;

  document.body.appendChild(bubble);

  askRow      = document.getElementById('orbit-ask-row');
  answerPanel = document.getElementById('orbit-answer');

  document.getElementById('orbit-send').addEventListener('click', handleSend);
  document.getElementById('orbit-ask-btn').addEventListener('click', handleAskToggle);
  document.getElementById('orbit-submit').addEventListener('click', handleAskSubmit);
  document.getElementById('orbit-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAskSubmit();
    if (e.key === 'Escape') hideBubble();
  });

  bubble.addEventListener('mouseenter', () => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  });
  bubble.addEventListener('mouseleave', () => scheduleHide(600));
}

/* ── Position & show ──────────────────────────────────────────────── */
function showBubble(rect) {
  buildBubble();

  // Reset state
  askRow.classList.remove('orbit-ask-visible');
  answerPanel.classList.remove('orbit-answer-visible');
  answerPanel.textContent = '';
  const input = document.getElementById('orbit-input');
  if (input) input.value = '';

  // Place off-screen first so we can measure it
  bubble.style.visibility = 'hidden';
  bubble.style.left = '0px';
  bubble.style.top  = '0px';
  bubble.classList.add('orbit-visible');

  requestAnimationFrame(() => {
    const bw     = bubble.offsetWidth;
    const bh     = bubble.offsetHeight;
    const margin = 8;
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;

    // Horizontal: centre on selection, clamp to viewport
    const selCentreX = rect.left + rect.width / 2;
    let left = selCentreX - bw / 2;
    left = Math.max(margin, Math.min(left, vw - bw - margin));

    // Vertical: above the selection; fall back to below if no room
    let top = rect.top - bh - 10;
    if (top < margin) top = rect.bottom + 10;
    top = Math.max(margin, Math.min(top, vh - bh - margin));

    bubble.style.left       = left + 'px';
    bubble.style.top        = top  + 'px';
    bubble.style.visibility = 'visible';
  });
}

function hideBubble() {
  if (!bubble) return;
  bubble.classList.remove('orbit-visible');
}

function scheduleHide(ms) {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(hideBubble, ms);
}

/* ── Text selection listener ──────────────────────────────────────── */
document.addEventListener('mouseup', () => {
  // Small delay to let the browser finalise the selection
  setTimeout(() => {
    const sel  = window.getSelection();
    const text = sel ? sel.toString().trim() : '';

    if (!text || text.length < 3) {
      scheduleHide(150);
      return;
    }

    if (sel.rangeCount === 0) return;

    selectionText = text;
    const rect = sel.getRangeAt(0).getBoundingClientRect();

    // getBoundingClientRect() is viewport-relative — use as-is with position:fixed
    showBubble(rect);
  }, 30);
});

/* Hide when clicking outside the bubble */
document.addEventListener('mousedown', (e) => {
  if (bubble && bubble.classList.contains('orbit-visible') && !bubble.contains(e.target)) {
    scheduleHide(120);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideBubble();
});

/* ── Send to Aiopad ───────────────────────────────────────────────── */
function handleSend() {
  if (!selectionText) return;
  hideBubble();
  chrome.runtime.sendMessage({ type: 'SEND_TO_AIOPAD', text: selectionText }, (resp) => {
    showToast(resp && resp.ok
      ? '✓ Sent to Aiopad!'
      : '⚠ Opening Aiopad and sending…');
  });
}

/* ── Ask Orbit ────────────────────────────────────────────────────── */
function handleAskToggle() {
  askRow.classList.toggle('orbit-ask-visible');
  if (askRow.classList.contains('orbit-ask-visible')) {
    setTimeout(() => document.getElementById('orbit-input').focus(), 60);
  }
}

function handleAskSubmit() {
  const question = document.getElementById('orbit-input').value.trim();
  if (!question || !selectionText) return;

  const btn = document.getElementById('orbit-submit');
  btn.disabled    = true;
  btn.textContent = '…';
  answerPanel.textContent = '';
  answerPanel.classList.remove('orbit-answer-visible');

  chrome.runtime.sendMessage({ type: 'ASK_ORBIT', text: selectionText, question }, (resp) => {
    btn.disabled    = false;
    btn.textContent = 'Ask';
    answerPanel.textContent = (resp && resp.answer)
      ? resp.answer
      : '⚠ ' + ((resp && resp.error) || 'No response. Check API key in Orbit Settings.');
    answerPanel.classList.add('orbit-answer-visible');
  });
}

/* ── Toast ────────────────────────────────────────────────────────── */
function showToast(msg) {
  let toast = document.getElementById('orbit-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'orbit-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('orbit-toast-show');
  setTimeout(() => toast.classList.remove('orbit-toast-show'), 2800);
}
