/* ── Orbit Background Service Worker ──────────────────────────────── */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL   = 'nvidia/llama-3.3-nemotron-super-49b-v1';
const ELEVEN_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const ELEVEN_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SEND_TO_NOTEPAD' || msg.type === 'SEND_TO_AIOPAD') {
    sendToNotepad(msg.text).then(sendResponse).catch(err => sendResponse({ ok: false, error: err.message }));
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
  if (msg.type === 'EXPLAIN_SELECTION_VOICE') {
    explainSelectionVoice(msg.text).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (msg.type === 'TRANSCRIBE_AUDIO_BATCH') {
    transcribeAudioBatch(msg.base64Audio).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

/* ── Send to Notepad via scripting.executeScript ──────────────────── */
async function sendToNotepad(text) {
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

  // Find an open Notepad tab
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

/* Runs INSIDE the Notepad tab (no closure — must be self-contained) */
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

async function explainSelectionVoice(text) {
  const { apiKey } = await chrome.storage.local.get({ apiKey: '' });
  if (!apiKey) return { error: 'Missing NVIDIA API key in Orbit settings.' };

  const prompt = `Explain this selected webpage text briefly in 2-3 simple sentences. Do not read it verbatim. Focus on meaning and key point.\n\nSelected text:\n"""${(text || '').slice(0, 1800)}"""`;
  const answerResponse = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: 'You are Orbit. Explain selected text clearly and briefly.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 220,
      temperature: 0.4,
      stream: false,
    }),
  });

  const raw = await answerResponse.text();
  if (!answerResponse.ok) return { error: `NVIDIA API error ${answerResponse.status}: ${raw.slice(0, 180)}` };
  const parsed = JSON.parse(raw);
  const answer = parsed.choices?.[0]?.message?.content?.trim() || 'I could not generate an explanation.';

  const tts = await elevenSpeak(answer);
  if (tts.error) return { answer, error: tts.error };
  return { answer, audioBase64: tts.audioBase64, mimeType: tts.mimeType };
}

async function elevenSpeak(text) {
  const { elevenApiKey, elevenVoiceId } = await chrome.storage.local.get({
    elevenApiKey: '',
    elevenVoiceId: '',
  });
  if (!elevenApiKey) return { error: 'Missing ElevenLabs API key in Orbit settings.' };
  if (!String(elevenVoiceId || '').trim()) {
    return { error: 'Set ElevenLabs voice ID in Orbit extension popup settings.' };
  }

  const response = await fetch(`${ELEVEN_TTS_URL}/${encodeURIComponent(elevenVoiceId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': elevenApiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_v3',
      output_format: 'mp3_44100_128',
    }),
  });
  if (!response.ok) {
    const message = await response.text();
    return { error: `ElevenLabs TTS error ${response.status}: ${message.slice(0, 180)}` };
  }
  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = arrayBufferToBase64(audioBuffer);
  return { audioBase64, mimeType: 'audio/mpeg' };
}

async function transcribeAudioBatch(base64Audio) {
  const { elevenApiKey } = await chrome.storage.local.get({ elevenApiKey: '' });
  if (!elevenApiKey) return { error: 'Missing ElevenLabs API key in Orbit settings.' };
  if (!base64Audio) return { error: 'No audio provided.' };

  const boundary = `----orbitform${Date.now().toString(16)}`;
  const fields = [
    multipartField(boundary, 'model_id', 'scribe_v2'),
    multipartField(boundary, 'language_code', 'eng'),
  ];
  const filePartHeader =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="orbit-command.webm"\r\n` +
    `Content-Type: audio/webm\r\n\r\n`;
  const fileBytes = base64ToUint8(base64Audio);
  const trailer = `\r\n--${boundary}--\r\n`;
  const encoder = new TextEncoder();
  const body = concatUint8([
    ...fields.map((f) => encoder.encode(f)),
    encoder.encode(filePartHeader),
    fileBytes,
    encoder.encode(trailer),
  ]);

  const response = await fetch(ELEVEN_STT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'xi-api-key': elevenApiKey,
    },
    body,
  });
  const raw = await response.text();
  if (!response.ok) return { error: `ElevenLabs STT error ${response.status}: ${raw.slice(0, 180)}` };

  const parsed = JSON.parse(raw);
  return { transcript: (parsed.text || parsed.transcript || '').trim() };
}

function multipartField(boundary, name, value) {
  return `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToUint8(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concatUint8(parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
