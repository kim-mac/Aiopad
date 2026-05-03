const urlInput   = document.getElementById('aiopad-url');
const keyInput   = document.getElementById('api-key');
const saveBtn    = document.getElementById('save-btn');
const statusEl   = document.getElementById('status');

// Load saved values
chrome.storage.local.get({ aiopadUrl: 'http://localhost:5000', apiKey: '' }, (data) => {
  urlInput.value = data.aiopadUrl;
  keyInput.value = data.apiKey;
});

saveBtn.addEventListener('click', () => {
  const aiopadUrl = urlInput.value.trim().replace(/\/$/, '') || 'http://localhost:5000';
  const apiKey    = keyInput.value.trim();

  chrome.storage.local.set({ aiopadUrl, apiKey }, () => {
    statusEl.classList.add('show');
    setTimeout(() => statusEl.classList.remove('show'), 2000);
  });
});
