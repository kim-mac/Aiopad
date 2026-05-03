/* ── Orbit Content Script ─────────────────────────────────────────── */

let bubble = null;
let askRow = null;
let answerPanel = null;
let selectionText = '';
let hideTimer = null;

/* ── Build the bubble DOM (once) ─────────────────────────────────── */
function buildBubble() {
  if (bubble) return;

  bubble = document.createElement('div');
  bubble.id = 'orbit-bubble';
  bubble.innerHTML = `
    <div style="border-radius:999px 999px ${hasAsk() ? '0 0' : '999px 999px'}; overflow:hidden;">
      <div class="orbit-pill">
        <div class="orbit-logo">⊙</div>
        <button class="orbit-btn orbit-btn-send" id="orbit-send">
          <span class="orbit-btn-icon">📎</span> Send to Aiopad
        </button>
        <div class="orbit-divider"></div>
        <button class="orbit-btn orbit-btn-ask" id="orbit-ask-btn">
          <span class="orbit-btn-icon">✦</span> Ask Orbit
        </button>
      </div>
      <div class="orbit-ask-row" id="orbit-ask-row">
        <input class="orbit-input" id="orbit-input" placeholder="Ask about the selected text…" />
        <button class="orbit-submit" id="orbit-submit">Ask</button>
      </div>
      <div class="orbit-answer" id="orbit-answer"></div>
    </div>
  `;

  document.body.appendChild(bubble);

  askRow = document.getElementById('orbit-ask-row');
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
  bubble.addEventListener('mouseleave', () => {
    scheduleHide(800);
  });
}

function hasAsk() { return false; }

/* ── Show / hide ──────────────────────────────────────────────────── */
function showBubble(x, y) {
  buildBubble();

  // Reset ask panel state
  askRow.classList.remove('orbit-ask-visible');
  answerPanel.classList.remove('orbit-answer-visible');
  answerPanel.textContent = '';
  document.getElementById('orbit-input').value = '';

  // Position above the selection endpoint
  bubble.style.left = '0';
  bubble.style.top = '0';
  bubble.classList.remove('orbit-visible');

  // Let browser paint it first so we can read its width
  requestAnimationFrame(() => {
    const w = bubble.offsetWidth;
    const margin = 8;
    let left = x - w / 2;
    if (left < margin) left = margin;
    if (left + w > window.innerWidth - margin) left = window.innerWidth - w - margin;

    const top = y - bubble.offsetHeight - 12;

    bubble.style.left = left + 'px';
    bubble.style.top = Math.max(margin, top) + 'px';
    bubble.classList.add('orbit-visible');
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
document.addEventListener('mouseup', (e) => {
  // Small delay so selection is finalised
  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text || text.length < 3) {
      scheduleHide(200);
      return;
    }
    selectionText = text;

    // Position at end of selection
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showBubble(
        rect.left + rect.width / 2 + window.scrollX,
        rect.top + window.scrollY
      );
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (bubble && !bubble.contains(e.target)) {
    scheduleHide(150);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideBubble();
});

/* ── Send to Aiopad ───────────────────────────────────────────────── */
function handleSend() {
  if (!selectionText) return;
  chrome.runtime.sendMessage(
    { type: 'SEND_TO_AIOPAD', text: selectionText },
    (response) => {
      showToast(
        response && response.ok
          ? '✓ Sent to Aiopad!'
          : '⚠ Could not find Aiopad tab — opening it now…'
      );
      hideBubble();
    }
  );
}

/* ── Ask Orbit ────────────────────────────────────────────────────── */
function handleAskToggle() {
  askRow.classList.toggle('orbit-ask-visible');
  if (askRow.classList.contains('orbit-ask-visible')) {
    setTimeout(() => document.getElementById('orbit-input').focus(), 50);
  }
}

async function handleAskSubmit() {
  const question = document.getElementById('orbit-input').value.trim();
  if (!question || !selectionText) return;

  const submitBtn = document.getElementById('orbit-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = '…';

  answerPanel.textContent = '';
  answerPanel.classList.remove('orbit-answer-visible');

  chrome.runtime.sendMessage(
    { type: 'ASK_ORBIT', text: selectionText, question },
    (response) => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ask';
      if (response && response.answer) {
        answerPanel.textContent = response.answer;
        answerPanel.classList.add('orbit-answer-visible');
      } else {
        answerPanel.textContent = response && response.error
          ? '⚠ ' + response.error
          : '⚠ Could not get a response. Check your API key in Orbit Settings.';
        answerPanel.classList.add('orbit-answer-visible');
      }
    }
  );
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
