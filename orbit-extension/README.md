# Orbit — Aiopad Companion Extension

A Chrome/Edge extension that lets you select text on any webpage and instantly send it to Aiopad or ask AI questions about it.

## Installing in Developer Mode

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `orbit-extension/` folder from this project
5. Orbit is now active — the ⊙ icon appears in your toolbar

## First-time Setup

Click the **Orbit ⊙** icon in your Chrome toolbar to open Settings:

- **Aiopad URL** — paste the URL where your Aiopad app is running  
  - Dev mode: `http://localhost:5000`  
  - Deployed: your `.replit.app` URL
- **NVIDIA NIM API Key** — paste your key from [build.nvidia.com](https://build.nvidia.com)  
  (only needed for "Ask Orbit" — "Send to Aiopad" works without it)

Click **Save Settings**.

## How to Use

1. Go to **any webpage** and select some text
2. The **Orbit bubble** appears near your selection with two buttons:
   - **📎 Send to Aiopad** — creates a new note in Aiopad with the selected text, tagged "Orbit"
   - **✦ Ask Orbit** — opens a text field; type a question about the selection and press Enter
3. For "Send to Aiopad": if Aiopad isn't open, it will open automatically in a new tab
4. Switch to the Aiopad tab — your new note is already there and selected

## Notes

- The extension adds **zero code** to any webpage beyond the floating bubble
- The only change to the Aiopad app is a single event listener (no UI changes)
- The bubble auto-hides when you click elsewhere or press Escape
- The NVIDIA API key is stored locally in the extension — it never leaves your browser except for direct API calls to NVIDIA
