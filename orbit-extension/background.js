/* ── Orbit Background Service Worker ──────────────────────────────── */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL   = 'nvidia/llama-3.3-nemotron-super-49b-v1';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SEND_TO_AIOPAD') {
    sendToAiopad(msg.text).then(sendResponse).catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'ASK_ORBIT') {
    askOrbit(msg.text, msg.question).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

/* ── Send to Aiopad ───────────────────────────────────────────────── */
async function sendToAiopad(text) {
  const { aiopadUrl } = await chrome.storage.local.get({ aiopadUrl: 'http://localhost:5000' });
  const cleanUrl = aiopadUrl.replace(/\/$/, '');

  // Find an open Aiopad tab by checking all tabs' URLs
  const allTabs = await chrome.tabs.query({});
  const aiopadTab = allTabs.find(t => t.url && t.url.startsWith(cleanUrl));

  const noteObj = {
    id: Date.now().toString(),
    title: text.slice(0, 60) + (text.length > 60 ? '…' : ''),
    content: text,
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    type: 'note',
    contentType: 'text',
    tag: 'Orbit',
  };

  if (aiopadTab) {
    // Inject silently — don't switch to or focus the Aiopad tab
    try {
      await chrome.tabs.sendMessage(aiopadTab.id, { type: 'INJECT_NOTE', note: noteObj });
      return { ok: true };
    } catch (e) {
      // Content script not ready — fall through to open in background
    }
  }

  // No Aiopad tab found — open one in the background without focusing it
  const newTab = await chrome.tabs.create({ url: cleanUrl, active: false });
  await waitForTab(newTab.id);
  await chrome.tabs.sendMessage(newTab.id, { type: 'INJECT_NOTE', note: noteObj });
  return { ok: true };
}

function waitForTab(tabId) {
  return new Promise(resolve => {
    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 1500); // wait for React to mount
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

/* ── Ask Orbit via NVIDIA NIM ─────────────────────────────────────── */
async function askOrbit(selectedText, question) {
  const { apiKey } = await chrome.storage.local.get({ apiKey: '' });

  if (!apiKey) {
    return { error: 'No API key set — open Orbit Settings (click ⊙ icon) and save your NVIDIA NIM key.' };
  }

  const prompt = `You are Orbit, a concise AI assistant. The user selected this text on a webpage:\n\n"${selectedText.slice(0, 800)}"\n\nQuestion: ${question}\n\nAnswer concisely in 2-4 sentences.`;

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
        max_tokens: 300,
        temperature: 0.5,
        stream: false,
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      return { error: `API error ${res.status}: ${raw.slice(0, 200)}` };
    }

    const data = JSON.parse(raw);
    const answer = data.choices?.[0]?.message?.content?.trim() || 'No response received.';
    return { answer };
  } catch (err) {
    return { error: err.message };
  }
}
