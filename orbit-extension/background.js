/* ── Orbit Background Service Worker ──────────────────────────────── */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL   = 'nvidia/llama-3.3-nemotron-super-49b-v1';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SEND_TO_AIOPAD') {
    sendToAiopad(msg.text).then(sendResponse).catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'ASK_ORBIT') {
    askOrbit(msg.context, msg.messages).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (msg.type === 'SYNC_THEME') {
    chrome.storage.local.set({
      orbitTheme: msg.variant || 'ocean',
      orbitMode:  msg.mode    || 'dark',
      orbitFont:  msg.fontFamily || '"JetBrains Mono", monospace',
    });
    return false;
  }
});

/* ── Send to Aiopad via scripting.executeScript ───────────────────── */
async function sendToAiopad(text) {
  const { aiopadUrl } = await chrome.storage.local.get({ aiopadUrl: 'http://localhost:5000' });
  const cleanUrl = aiopadUrl.replace(/\/$/, '');

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

  // Find an open Aiopad tab
  const allTabs  = await chrome.tabs.query({});
  const aiopadTab = allTabs.find(t => t.url && t.url.startsWith(cleanUrl));

  if (aiopadTab) {
    try {
      // executeScript runs directly in the tab — no content-script handshake needed
      await chrome.scripting.executeScript({
        target: { tabId: aiopadTab.id },
        func: injectNote,
        args: [noteObj],
      });
      return { ok: true };
    } catch (e) {
      console.warn('[Orbit] executeScript failed:', e.message);
    }
  }

  // No tab open — write directly to localStorage via a background-opened tab (never focused)
  const newTab = await chrome.tabs.create({ url: cleanUrl, active: false });
  await waitForTab(newTab.id);
  try {
    await chrome.scripting.executeScript({
      target: { tabId: newTab.id },
      func: injectNote,
      args: [noteObj],
    });
  } catch (e) {
    console.warn('[Orbit] executeScript on new tab failed:', e.message);
  }
  return { ok: true };
}

/* Runs INSIDE the Aiopad tab (no closure — must be self-contained) */
function injectNote(noteObj) {
  // Write to localStorage so it persists even if React hasn't mounted yet
  try {
    const raw      = localStorage.getItem('notepad-notes') || '[]';
    const existing = JSON.parse(raw);
    if (!existing.some(n => n.id === noteObj.id)) {
      existing.unshift(noteObj);
      localStorage.setItem('notepad-notes', JSON.stringify(existing));
    }
  } catch (_) {}

  // Also dispatch the live event so React picks it up immediately
  window.dispatchEvent(new CustomEvent('orbit:addNote', { detail: noteObj }));
}

function waitForTab(tabId) {
  return new Promise(resolve => {
    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 1200);
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

/* ── Ask Orbit via NVIDIA NIM ─────────────────────────────────────── */
async function askOrbit(context, messages) {
  const { apiKey } = await chrome.storage.local.get({ apiKey: '' });

  if (!apiKey) {
    return { error: 'No API key set — open Orbit Settings and save your NVIDIA NIM key.' };
  }

  // System message includes the selected text as context
  const systemMsg = {
    role: 'system',
    content: `You are Orbit, a concise and helpful AI assistant embedded in a browser extension. The user has selected the following text on a webpage as context for this conversation:\n\n"""${context.slice(0, 1000)}"""\n\nAnswer questions about this text clearly and concisely. You may engage in multi-turn conversation. Keep responses focused and helpful.`,
  };

  try {
    const res = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       NVIDIA_MODEL,
        messages:    [systemMsg, ...messages],
        max_tokens:  512,
        temperature: 0.6,
        stream:      false,
      }),
    });

    const raw = await res.text();
    if (!res.ok) return { error: `API error ${res.status}: ${raw.slice(0, 200)}` };

    const data   = JSON.parse(raw);
    const answer = data.choices?.[0]?.message?.content?.trim() || 'No response received.';
    return { answer };
  } catch (err) {
    return { error: err.message };
  }
}
