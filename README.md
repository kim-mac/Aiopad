# Modern Notepad App + Orbit Voice Extension

A React + TypeScript notepad app for creating and organizing notes, now paired with an Orbit browser extension for hands-free wake-word voice actions across tabs.

## What this app does

- Create three note types: text notes, to-do lists, and handwriting notes.
- Edit notes with rich tools such as formatting, undo/redo, and text helpers.
- Organize notes with search, sort, pin, favorites, archive, color tags, and lock/unlock.
- Manage to-do items with completion status, priorities, due dates, and task tabs.
- Convert handwriting to text using in-browser OCR.
- Export notes as TXT, DOCX, or PDF.
- Support in-app voice commands for note creation, tasks, summaries, exports, and productivity actions.
- Integrate with the Orbit extension so selected text from any tab can be sent directly to Notepad.

## New voice features

- **Hybrid wake + push-to-talk**: say `Hey Orbit ...` or click the mic in the Orbit pill.
- **Single phrase flow**: supports wake + command in one line, like `Hey Orbit, send this to Notepad`.
- **More reliable listening handoff**: wake and command capture are serialized to reduce "Wake but not listening" states.
- **Fallback transcription**: automatically falls back to ElevenLabs batch transcription if realtime speech fails.
- **Notepad-aware command routing**: when on the Notepad page, Orbit forwards note intents (for example, `create a new note`) to the app command handler.
- **Selection actions**:
  - `send selected text to Notepad`
  - `explain what this says`
  - `summarize this`

## Orbit extension highlights

- Pill opens from text selection on regular pages.
- On the Notepad page, global wake can open the pill even without pre-selecting text.
- Renamed user-facing action to **Send to Notepad** (legacy `Aiopad` phrasing is still accepted in voice parsing for compatibility).
- Voice state chip shows `Idle`, `Wake`, `Command`, and `Thinking`.

## How it works (high level)

- The app is a frontend-only single-page application built with React, Vite, and TypeScript.
- Notes are stored in browser `localStorage` and restored on reload.
- The main app shell is composed of:
  - `src/components/Sidebar.tsx` for note creation, selection, and organization.
  - `src/components/Editor.tsx` for editing note content, todo lists, and handwriting mode.
  - `src/components/Toolbar.tsx` for formatting, utility tools, and export actions.
- Theme controls are managed in `src/components/ThemeControls.tsx` and `src/themes.ts`.
- Orbit extension lives under `orbit-extension/`:
  - `content.js` handles wake word, command capture, and in-page UI.
  - `background.js` handles explain requests, TTS/STT calls, and tab messaging.
  - `popup.html` and `popup.js` manage extension settings and URL targeting.

## Data and persistence

- Note data is saved locally in the browser with `src/utils/storage.ts`.
- There is no backend database for note storage in the current architecture.
- Exports are generated on the client using `src/utils/fileExport.ts`.

## Project structure

- `src/App.tsx`: app-level state and layout orchestration.
- `src/components/`: UI building blocks (Sidebar, Editor, Toolbar, handwriting canvas, dialogs).
- `src/utils/`: storage, export, and helper utilities.
- `src/themes.ts`: theme variants and color mode support.

## Getting started

### Prerequisites

- Node.js 18+ recommended

### Install dependencies

```bash
npm install
```

### Configure voice APIs (for hands-free mode)

Create a `.env` with:

```bash
VITE_NVIDIA_API_KEY=your_nvidia_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_ELEVENLABS_VOICE_ID=your_voice_id_from_elevenlabs_voices_page
```

These are used by both in-app voice responses and extension-driven fallback STT/TTS.

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Notes

- User note content is tied to the browser/device because storage is local.
- Handwriting recognition runs in-browser via Tesseract.
- Voice control uses realtime speech recognition with command execution and ElevenLabs spoken confirmations.
- Orbit extension commands on any page: `send this to notepad`, `explain what this says`.
- Orbit commands on the Notepad page: `create a new note`, `add task ...`, `summarize this note`, `generate flashcards`, `chat with notes about ...`, `export as pdf`.

## Quick test checklist (demo-ready)

1. Start app with `npm run dev`.
2. Load `orbit-extension/` as an unpacked extension in Chromium.
3. On any webpage, select text and say: `Hey Orbit, send this to Notepad`.
4. On the Notepad tab, say: `Hey Orbit, create a new note`.
5. Verify voice state transitions (`Wake` -> `Command` -> `Thinking` -> `Idle`) and fallback behavior if realtime capture fails.
