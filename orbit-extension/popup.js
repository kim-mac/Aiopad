const toggleEl  = document.getElementById('orbit-toggle');
const urlInput  = document.getElementById('aiopad-url');
const keyInput  = document.getElementById('api-key');
const saveBtn   = document.getElementById('save-btn');
const statusEl  = document.getElementById('status');

// Load saved values
chrome.storage.local.get(
  { orbitEnabled: true, aiopadUrl: 'http://localhost:5000', apiKey: '' },
  (data) => {
    toggleEl.checked = data.orbitEnabled;
    urlInput.value   = data.aiopadUrl;
    keyInput.value   = data.apiKey;
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

  chrome.storage.local.set({ aiopadUrl, apiKey }, () => {
    statusEl.classList.add('show');
    setTimeout(() => statusEl.classList.remove('show'), 2000);
  });
});
