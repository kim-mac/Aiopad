const toggleEl  = document.getElementById('orbit-toggle');
const urlInput  = document.getElementById('aiopad-url');
const keyInput  = document.getElementById('api-key');
const elevenKeyInput = document.getElementById('eleven-api-key');
const elevenVoiceInput = document.getElementById('eleven-voice-id');
const saveBtn   = document.getElementById('save-btn');
const statusEl  = document.getElementById('status');

// Load saved values
chrome.storage.local.get(
  { orbitEnabled: true, aiopadUrl: 'http://localhost:5000', apiKey: '', elevenApiKey: '', elevenVoiceId: '' },
  (data) => {
    toggleEl.checked = data.orbitEnabled;
    urlInput.value   = data.aiopadUrl;
    keyInput.value   = data.apiKey;
    elevenKeyInput.value = data.elevenApiKey;
    elevenVoiceInput.value = data.elevenVoiceId;
  }
);

// Enable / disable toggle — takes effect immediately across all tabs
toggleEl.addEventListener('change', () => {
  chrome.storage.local.set({ orbitEnabled: toggleEl.checked });
});

// Save settings
saveBtn.addEventListener('click', () => {
  const aiopadUrl = urlInput.value.trim().replace(/\/$/, '') || 'http://localhost:5000';
  const apiKey    = keyInput.value.trim();
  const elevenApiKey = elevenKeyInput.value.trim();
  const elevenVoiceId = elevenVoiceInput.value.trim();

  chrome.storage.local.set({ aiopadUrl, apiKey, elevenApiKey, elevenVoiceId }, () => {
    statusEl.classList.add('show');
    setTimeout(() => statusEl.classList.remove('show'), 2000);
  });
});
