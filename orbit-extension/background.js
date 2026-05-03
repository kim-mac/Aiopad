/* ── Orbit Background Service Worker ──────────────────────────────── */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL   = 'nvidia/llama-3.3-nemotron-super-49b-v1';

/* ── Message router ───────────────────────────────────────────────── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SEND_TO_AIOPAD') {
    sendToAiopad(msg.text).then(sendResponse);
    return true; // keep channel open for async
  }
  if (msg.type === 'ASK_ORBIT') {
    askOrbit(msg.text, msg.question).then(sendResponse);
    return true;
  }
});

/* ── Send selected text to Aiopad ─────────────────────────────────── */
async function sendToAiopad(text) {
  const { aiopadUrl } = await chrome.storage.local.get({ aiopadUrl: 'http://localhost:5000' });

  // Find an open Aiopad tab
  const tabs = await chrome.tabs.query({ url: aiopadUrl.replace(/\/$/, '') + '/*' });

  if (tabs.length > 0) {
    await injectNote(tabs[0].id, text);
    await chrome.tabs.update(tabs[0].id, { active: true });
    return { ok: true };
  }

  // No tab found — open one, then inject after load
  const tab = await chrome.tabs.create({ url: aiopadUrl });
  await waitForTabLoad(tab.id);
  await injectNote(tab.id, text);
  return { ok: true };
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        // Extra delay for React to mount
        setTimeout(resolve, 1200);
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function injectNote(tabId, text) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (noteText) => {
      const STORAGE_KEY = 'notepad-notes';
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const now = new Date().toISOString();
        const newNote = {
          id: Date.now().toString(),
          title: noteText.slice(0, 60) + (noteText.length > 60 ? '…' : ''),
          content: noteText,
          lastModified: now,
          createdAt: now,
          type: 'note',
          contentType: 'text',
          tag: 'Orbit',
        };
        existing.unshift(newNote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

        // Notify the React app via a custom event (crosses the content-script boundary)
        window.dispatchEvent(new CustomEvent('orbit:addNote', { detail: newNote }));
      } catch (err) {
        console.error('[Orbit] Failed to inject note:', err);
      }
    },
    args: [text],
  });
}

/* ── Ask Orbit via NVIDIA NIM ─────────────────────────────────────── */
async function askOrbit(selectedText, question) {
  const { apiKey } = await chrome.storage.local.get({ apiKey: '' });
  if (!apiKey) {
    return { error: 'No API key set. Open Orbit Settings and paste your NVIDIA NIM API key.' };
  }

  const prompt = `You are Orbit, a concise AI assistant. The user has selected the following text on a webpage:\n\n"${selectedText}"\n\nUser's question: ${question}\n\nAnswer helpfully and concisely (2-4 sentences max).`;

  try {
    const res = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 256,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { error: `API error ${res.status}: ${err.slice(0, 120)}` };
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || 'No response received.';
    return { answer };
  } catch (err) {
    return { error: err.message };
  }
}
