# Aiopad V2 — AI-Powered Knowledge Base

## Project Overview
A React + TypeScript + Vite + MUI notepad app enhanced with AI-powered multimodal note creation, built on top of the existing Aiopad V1 codebase without redesigning the UI.

## Architecture

### Stack
- **Frontend**: React 18, TypeScript, Vite 4
- **UI**: MUI v5
- **AI**: NVIDIA NIM API (`nvidia/llama-3.3-nemotron-super-49b-v1` for text, `microsoft/phi-3.5-vision-instruct` for images)
- **State**: React useState in App.tsx (no router)
- **Storage**: localStorage via `src/utils/storage.ts`

### Project Structure
```
src/
├── App.tsx                    — Root component, note state, passes notes/setNotes to Sidebar/Editor
├── components/
│   ├── Sidebar.tsx            — Note list, Add Note dropdown (8 options: note/todo/handwriting/5 AI)
│   ├── Editor.tsx             — Note editor + AI buttons (Flashcards/Share/Chat) in status bar
│   ├── Toolbar.tsx            — Rich text toolbar with existing AI features (HuggingFace)
│   ├── YoutubeInput.tsx       — YouTube URL → transcript → NVIDIA → Note dialog
│   ├── PdfInput.tsx           — PDF file upload → text extraction → NVIDIA → Note dialog
│   ├── ImageInput.tsx         — Image upload → base64 → NVIDIA vision API → Note dialog
│   ├── UrlInput.tsx           — URL → allorigins.win CORS proxy → NVIDIA → Note dialog
│   ├── VoiceInput.tsx         — Web Speech API → transcript → NVIDIA → Note dialog
│   ├── ChatPanel.tsx          — Floating chat panel, queries all notes via NVIDIA
│   ├── FlashcardsDialog.tsx   — Generates 8-10 flashcards from current note via NVIDIA
│   └── ShareNoteDialog.tsx    — Copy as Markdown or share via encoded URL
├── services/
│   ├── nvidia.ts              — NVIDIA NIM API: callNvidia, explainContent, generateNoteMeta,
│   │                            chatWithNotes, generateFlashcards, analyzeImage
│   └── youtube.ts             — YouTube transcript fetching (noembed.com + kome.ai fallback)
├── stores/
│   └── aiStore.ts             — Zustand store for AI loading state (NOT used due to React hook conflict, kept for future)
└── utils/
    ├── ai.ts                  — Existing HuggingFace AI features (DO NOT TOUCH)
    └── storage.ts             — localStorage save/load for notes and themes
```

### Note Interface (extended for V2)
All Note interfaces across App.tsx, Sidebar.tsx, Editor.tsx, storage.ts include:
- `tag?`: AI-generated topic category
- `summary?`: One-line AI summary
- `difficulty?`: 'beginner' | 'intermediate' | 'advanced'
- `contentType?`: 'youtube' | 'pdf' | 'image' | 'url' | 'voice' | 'text'
- `thumbnail?`: Image URL (for YouTube/image notes)
- `sourceUrl?`: Original URL or filename

## AI Features (9 total)
1. **YouTube → Note**: Paste YouTube URL, fetches transcript via noembed.com/kome.ai, sends to NVIDIA
2. **PDF → Note**: Upload PDF, extracts text via PDF binary parsing (BT/ET blocks), sends to NVIDIA
3. **Image → Note**: Upload image, base64-encodes, sends to NVIDIA vision model
4. **URL → Note**: Paste URL, fetches via allorigins.win CORS proxy, sends to NVIDIA
5. **Voice → Note**: Web Speech API recording, NVIDIA processes transcript
6. **Auto-tagging**: `generateNoteMeta()` auto-generates title, tag, summary, difficulty for every AI note
7. **Chat with Notes**: Floating ChatPanel, queries all notes context via NVIDIA
8. **Flashcards**: `FlashcardsDialog` generates 8-10 flashcards per note via NVIDIA
9. **Share Note**: Copy as Markdown or encoded URL with note data

## Environment Variables
- `VITE_NVIDIA_API_KEY` — Required: NVIDIA NIM API key (set in Replit Secrets)

## Dev Server
- Port: 5000
- Command: `npm run dev`
- Workflow: "Start application"

## Key Decisions
- Did NOT install pdfjs-dist (used raw binary BT/ET text extraction instead)
- Did NOT use Zustand in components (hook conflict with Vite dev server) — use local React state
- Did NOT add a router — share feature uses encoded URL query params
- Existing HuggingFace AI features in Toolbar.tsx are untouched
