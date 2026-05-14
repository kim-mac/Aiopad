import React from 'react';
import { ThemeProvider, CssBaseline, Box, createTheme } from '@mui/material';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ThemeControls from './components/ThemeControls';
import { getThemeOptions, ThemeVariant, ColorMode } from './themes';
import { saveThemePreference, getThemePreference, saveNotes, getNotes } from './utils/storage';
import { parseVoiceIntent } from './utils/voiceCommands';
import { resolveVoiceIntent } from './services/voiceIntentLlm';
import { startRealtimeTranscription, RealtimeSession, speakWithEleven } from './services/voice';
import { explainContent } from './services/nvidia';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  createdAt?: Date;
  isPinned?: boolean;
  isLocked?: boolean;
  password?: string;
  color?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  type?: 'note' | 'todo' | 'handwriting';
  tag?: string;
  summary?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  contentType?: 'youtube' | 'pdf' | 'image' | 'url' | 'voice' | 'text';
  thumbnail?: string;
  sourceUrl?: string;
  embeddedImages?: Array<{ id: string; src: string; x: number; y: number; width: number; height: number }>;
  tasks?: Array<{
    id: string;
    text: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
    taskType?: 'one-time' | 'daily';
    lastCompleted?: Date;
  }>;
  tabs?: Array<{
    id: string;
    name: string;
    tasks: Array<{
      id: string;
      text: string;
      completed: boolean;
      priority?: 'low' | 'medium' | 'high';
      dueDate?: Date;
      taskType?: 'one-time' | 'daily';
      lastCompleted?: Date;
    }>;
  }>;
}

function App() {
  const savedTheme = React.useMemo(() => getThemePreference(), []);
  const [notes, setNotes] = React.useState<Note[]>(() => getNotes());
  const [selectedNote, setSelectedNote] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<ColorMode>(savedTheme?.mode || 'dark');
  const [themeVariant, setThemeVariant] = React.useState<ThemeVariant>(savedTheme?.variant || 'ocean');
  const [fontFamily, setFontFamily] = React.useState('"JetBrains Mono", monospace');
  const [fontSize, setFontSize] = React.useState(16);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const voiceSessionRef = React.useRef<RealtimeSession | null>(null);
  const handleVoiceCommandRef = React.useRef<(transcript: string) => Promise<void>>(async () => {});
  const startVoiceRef = React.useRef<(opts?: { announce?: boolean }) => Promise<void>>(async () => {});
  const lastVoiceDedupeRef = React.useRef<{ norm: string; t: number } | null>(null);
  /** When set, toolbar speech appends into this voice note instead of running commands. */
  const voiceDictationNoteIdRef = React.useRef<string | null>(null);
  const selectedNoteRef = React.useRef<string | null>(null);
  const currentNoteRef = React.useRef<Note | undefined>(undefined);
  const speakConfirmationRef = React.useRef<(msg: string, opts?: { resumeMic?: boolean }) => Promise<void>>(
    async () => {}
  );

  const stopVoice = React.useCallback(() => {
    voiceSessionRef.current?.stop();
    voiceSessionRef.current = null;
    window.dispatchEvent(new CustomEvent('aiopad:voiceStatus', { detail: { listening: false } }));
  }, []);

  React.useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Orbit extension bridge - receives notes sent from other tabs
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !detail.content) return;
      const newNote: Note = {
        ...detail,
        lastModified: new Date(detail.lastModified || Date.now()),
        createdAt: new Date(detail.createdAt || Date.now()),
      };
      setNotes((prev) => {
        if (prev.some((n) => n.id === newNote.id)) return prev;
        return [newNote, ...prev];
      });
      setSelectedNote(newNote.id);
    };
    window.addEventListener('orbit:addNote', handler);
    return () => window.removeEventListener('orbit:addNote', handler);
  }, []);

  const theme = React.useMemo(
    () => createTheme(getThemeOptions(themeVariant, mode)),
    [themeVariant, mode]
  );

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('aiopad:themeChanged', {
      detail: { variant: themeVariant, mode, fontFamily }
    }));
  }, [themeVariant, mode, fontFamily]);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    saveThemePreference(themeVariant, newMode);
  };

  const handleThemeChange = (variant: ThemeVariant) => {
    setThemeVariant(variant);
    saveThemePreference(variant, mode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const currentNote = React.useMemo(
    () => notes.find((note) => note.id === selectedNote),
    [notes, selectedNote]
  );

  React.useLayoutEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  React.useLayoutEffect(() => {
    currentNoteRef.current = currentNote;
  }, [currentNote]);

  const speakConfirmation = React.useCallback(
    async (message: string, opts?: { resumeMic?: boolean }) => {
      const hadSession = Boolean(voiceSessionRef.current);
      if (hadSession) {
        voiceSessionRef.current?.stop();
        voiceSessionRef.current = null;
        window.dispatchEvent(new CustomEvent('aiopad:voiceStatus', { detail: { listening: false } }));
      }
      try {
        await speakWithEleven(message);
      } catch {
        // Keep UX non-blocking when TTS is unavailable.
      }
      const resume = opts?.resumeMic !== false && hadSession;
      if (resume) {
        await startVoiceRef.current({ announce: false });
      }
    },
    []
  );

  React.useLayoutEffect(() => {
    speakConfirmationRef.current = speakConfirmation;
  }, [speakConfirmation]);

  React.useEffect(() => {
    const d = voiceDictationNoteIdRef.current;
    if (d && selectedNote !== d) voiceDictationNoteIdRef.current = null;
  }, [selectedNote]);

  React.useEffect(() => {
    const onDoneDictation = () => {
      voiceDictationNoteIdRef.current = null;
    };
    window.addEventListener('aiopad:stopVoiceDictation', onDoneDictation);
    return () => window.removeEventListener('aiopad:stopVoiceDictation', onDoneDictation);
  }, []);

  const deliverVoiceLine = React.useCallback((raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const norm = t.toLowerCase().replace(/\s+/g, ' ').slice(0, 400);
    const now = Date.now();
    const prev = lastVoiceDedupeRef.current;
    if (prev && prev.norm === norm && now - prev.t < 2200) return;
    lastVoiceDedupeRef.current = { norm, t: now };

    const dictId = voiceDictationNoteIdRef.current;
    const sel = selectedNoteRef.current;
    const cn = currentNoteRef.current;
    const lower = t.toLowerCase();
    const exitDict =
      /^(stop\s+dictation|done\s+dictating|end\s+dictation|stop\s+recording|finish\s+dictation|voice\s+commands)\b/.test(
        lower
      ) || /^done\s+with\s+dictation\b/.test(lower);

    if (dictId && exitDict) {
      voiceDictationNoteIdRef.current = null;
      void speakConfirmationRef.current('Back to voice commands.');
      return;
    }

    if (dictId && sel === dictId && cn?.id === dictId && cn.contentType === 'voice') {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== dictId) return n;
          const base = (n.content || '').trimEnd();
          const sep = base && !/\s$/.test(base) && !/^[\s.,!?]/.test(t) ? ' ' : '';
          return { ...n, content: `${base}${sep}${t}`, lastModified: new Date() };
        })
      );
      return;
    }

    void handleVoiceCommandRef.current(t);
  }, []);

  const startVoice = React.useCallback(
    async (options?: { announce?: boolean }) => {
      const announce = options?.announce !== false;
      if (voiceSessionRef.current) {
        if (announce) {
          try {
            await speakWithEleven('Voice control is already on.');
          } catch {
            /* ignore */
          }
        }
        return;
      }
      if (announce) {
        try {
          await speakWithEleven('Voice control enabled.');
        } catch {
          /* ignore */
        }
      }
      const session = startRealtimeTranscription(
        deliverVoiceLine,
        undefined,
        async () => {
          stopVoice();
          try {
            await speakWithEleven('Voice listening hit an error. Mic turned off.');
          } catch {
            /* ignore */
          }
        }
      );
      if (!session) {
        try {
          await speakWithEleven('Speech recognition is not available in this browser.');
        } catch {
          /* ignore */
        }
        return;
      }
      voiceSessionRef.current = session;
      window.dispatchEvent(new CustomEvent('aiopad:voiceStatus', { detail: { listening: true } }));
    },
    [deliverVoiceLine, stopVoice]
  );

  React.useLayoutEffect(() => {
    startVoiceRef.current = startVoice;
  }, [startVoice]);

  const handleVoiceCommand = React.useCallback(
    async (transcript: string) => {
      let intent = parseVoiceIntent(transcript);
      if (intent.type === 'unknown') {
        const hadMic = Boolean(voiceSessionRef.current);
        if (hadMic) stopVoice();
        try {
          intent = await resolveVoiceIntent(transcript, {
            noteTitles: notes.map((n) => n.title),
            hasOpenNote: Boolean(currentNote),
            selectedTitle: currentNote?.title,
          });
        } catch {
          intent = { type: 'unknown' };
        }
        if (hadMic) await startVoiceRef.current({ announce: false });
      }

      const unlocked = notes.filter((n) => !n.isLocked);

      const pickOrdinal = (ordinal: 'first' | 'second' | 'third' | 'fourth' | 'last') => {
        if (!unlocked.length) return null;
        if (ordinal === 'last') return unlocked[unlocked.length - 1];
        const idx = { first: 0, second: 1, third: 2, fourth: 3 }[ordinal];
        return unlocked[Math.min(idx, unlocked.length - 1)];
      };

      switch (intent.type) {
        case 'stop_voice': {
          stopVoice();
          try {
            await speakWithEleven('Voice control stopped.');
          } catch {
            /* ignore */
          }
          return;
        }
        case 'start_voice': {
          await startVoice({ announce: false });
          return;
        }
        case 'toggle_sidebar': {
          setIsSidebarOpen((o) => !o);
          await speakConfirmation('Sidebar toggled.');
          return;
        }
        case 'open_sidebar': {
          setIsSidebarOpen(true);
          await speakConfirmation('Sidebar opened.');
          return;
        }
        case 'close_sidebar': {
          setIsSidebarOpen(false);
          await speakConfirmation('Sidebar closed.');
          return;
        }
        case 'select_note_ordinal': {
          const note = pickOrdinal(intent.ordinal);
          if (!note) {
            await speakConfirmation('No notes available to select.');
            return;
          }
          setSelectedNote(note.id);
          await speakConfirmation(`Opened ${note.title}.`);
          return;
        }
        case 'select_note_by_title': {
          const q = intent.title.toLowerCase();
          const found = unlocked.find((n) => n.title.toLowerCase().includes(q));
          if (!found) {
            await speakConfirmation('No matching note title found.');
            return;
          }
          setSelectedNote(found.id);
          await speakConfirmation(`Opened ${found.title}.`);
          return;
        }
        case 'next_note': {
          if (!notes.length) {
            await speakConfirmation('No notes yet.');
            return;
          }
          const idx = selectedNote ? notes.findIndex((n) => n.id === selectedNote) : -1;
          for (let step = 1; step <= notes.length; step++) {
            const j = (idx + step + notes.length) % notes.length;
            const cand = notes[j];
            if (!cand.isLocked) {
              setSelectedNote(cand.id);
              await speakConfirmation(`Opened ${cand.title}.`);
              return;
            }
          }
          await speakConfirmation('No unlocked notes to switch to.');
          return;
        }
        case 'previous_note': {
          if (!notes.length) {
            await speakConfirmation('No notes yet.');
            return;
          }
          const idx = selectedNote ? notes.findIndex((n) => n.id === selectedNote) : 0;
          for (let step = 1; step <= notes.length; step++) {
            const j = (idx - step + notes.length * 4) % notes.length;
            const cand = notes[j];
            if (!cand.isLocked) {
              setSelectedNote(cand.id);
              await speakConfirmation(`Opened ${cand.title}.`);
              return;
            }
          }
          await speakConfirmation('No unlocked notes to switch to.');
          return;
        }
        case 'append_text': {
          if (!selectedNote || !currentNote) {
            await speakConfirmation('Please select a note first.');
            return;
          }
          if (currentNote.isLocked) {
            await speakConfirmation('This note is locked.');
            return;
          }
          const addition = intent.text.trim();
          const base = (currentNote.content || '').trim();
          const next = base ? `${base}\n\n${addition}` : addition;
          setNotes((prev) =>
            prev.map((n) => (n.id === selectedNote ? { ...n, content: next, lastModified: new Date() } : n))
          );
          await speakConfirmation('Added to your note.');
          return;
        }
        case 'set_note_title': {
          if (!selectedNote || !currentNote) {
            await speakConfirmation('Please select a note first.');
            return;
          }
          if (currentNote.isLocked) {
            await speakConfirmation('This note is locked.');
            return;
          }
          const t = intent.title.trim() || 'Untitled';
          setNotes((prev) =>
            prev.map((n) => (n.id === selectedNote ? { ...n, title: t, lastModified: new Date() } : n))
          );
          await speakConfirmation(`Title set to ${t}.`);
          return;
        }
        case 'create_note': {
          const title = intent.title?.trim() || 'Voice Note';
          const noteId = `${Date.now()}`;
          const note: Note = {
            id: noteId,
            title,
            content: '',
            lastModified: new Date(),
            createdAt: new Date(),
            type: 'note',
            contentType: 'voice',
          };
          voiceDictationNoteIdRef.current = noteId;
          setNotes((prev) => [note, ...prev]);
          setSelectedNote(noteId);
          await speakConfirmation(
            `Voice note ${title} ready. Keep the mic on and speak; say stop dictation when you want commands again.`,
            { resumeMic: true }
          );
          return;
        }
        case 'create_todo': {
          const title = intent.title?.trim() || 'Todo';
          const taskText = intent.initialTask?.trim();
          const note: Note = {
            id: Date.now().toString(),
            title,
            content: '',
            lastModified: new Date(),
            createdAt: new Date(),
            type: 'todo',
            tasks: taskText
              ? [{ id: `${Date.now()}t`, text: taskText, completed: false, taskType: 'one-time' as const }]
              : [],
          };
          setNotes((prev) => [note, ...prev]);
          setSelectedNote(note.id);
          await speakConfirmation(
            taskText ? `Created your to-do with task: ${taskText}.` : `Created to-do ${title}.`
          );
          return;
        }
        case 'start_timer': {
          window.dispatchEvent(new CustomEvent('aiopad:voiceAction', { detail: { type: 'start_pomodoro' } }));
          await speakConfirmation('Timer started.');
          return;
        }
        case 'stop_timer': {
          window.dispatchEvent(new CustomEvent('aiopad:voiceAction', { detail: { type: 'stop_pomodoro' } }));
          await speakConfirmation('Timer stopped.');
          return;
        }
        case 'delete_note': {
          if (!selectedNote || !currentNote) {
            await speakConfirmation('No note selected to delete.');
            return;
          }
          if (currentNote.isLocked) {
            await speakConfirmation('This note is locked.');
            return;
          }
          if (voiceDictationNoteIdRef.current === selectedNote) voiceDictationNoteIdRef.current = null;
          const idToRemove = selectedNote;
          const filtered = notes.filter((n) => n.id !== idToRemove);
          const nextSel =
            selectedNote === idToRemove ? filtered.find((n) => !n.isLocked)?.id ?? null : selectedNote;
          setNotes(filtered);
          setSelectedNote(nextSel);
          await speakConfirmation('Note deleted.');
          return;
        }
        case 'delete_task': {
          if (!currentNote || currentNote.type !== 'todo') {
            await speakConfirmation('Open a to-do note first.');
            return;
          }
          window.dispatchEvent(new CustomEvent('aiopad:voiceAction', { detail: { type: 'delete_last_task' } }));
          await speakConfirmation('Removed the last task if there was one.');
          return;
        }
        case 'open_note_chat': {
          window.dispatchEvent(new CustomEvent('aiopad:voiceAction', { detail: { type: 'open_chat' } }));
          await speakConfirmation('Opening note chat.');
          return;
        }
        case 'close_note_chat': {
          window.dispatchEvent(new CustomEvent('aiopad:voiceAction', { detail: { type: 'close_chat' } }));
          await speakConfirmation('Closing note chat.');
          return;
        }
        case 'add_task': {
          if (!selectedNote) {
            await speakConfirmation('Please select a note first.');
            return;
          }
          const text = intent.text?.trim() || 'New task';
          setNotes((prev) =>
            prev.map((n) => {
              if (n.id !== selectedNote) return n;
              const existing = n.tasks || [];
              return {
                ...n,
                type: 'todo',
                tasks: [...existing, { id: Date.now().toString(), text, completed: false, taskType: 'one-time' }],
                lastModified: new Date(),
              };
            })
          );
          await speakConfirmation(`Task added: ${text}`);
          return;
        }
        case 'summarize_note': {
          if (!currentNote?.content?.trim()) {
            await speakConfirmation('No note content available to summarize.');
            return;
          }
          const hadMic = Boolean(voiceSessionRef.current);
          if (hadMic) stopVoice();
          const summary = await explainContent(currentNote.content.slice(0, 5000), 'text');
          setNotes((prev) =>
            prev.map((n) => (n.id === currentNote.id ? { ...n, summary, lastModified: new Date() } : n))
          );
          try {
            await speakWithEleven('Summary is ready.');
          } catch {
            /* ignore */
          }
          if (hadMic) await startVoiceRef.current({ announce: false });
          return;
        }
        case 'generate_flashcards': {
          if (!currentNote) {
            await speakConfirmation('Please select a note first.');
            return;
          }
          window.dispatchEvent(new CustomEvent('aiopad:voiceAction', { detail: { type: 'generate_flashcards' } }));
          await speakConfirmation('Generating flashcards.');
          return;
        }
        case 'chat_with_notes': {
          window.dispatchEvent(
            new CustomEvent('aiopad:voiceAction', { detail: { type: 'open_chat', question: intent.question } })
          );
          await speakConfirmation('Opening note chat.');
          return;
        }
        case 'export_note': {
          if (!currentNote) {
            await speakConfirmation('Please select a note first.');
            return;
          }
          window.dispatchEvent(
            new CustomEvent('aiopad:voiceAction', { detail: { type: 'export_note', format: intent.format } })
          );
          await speakConfirmation(`Exporting as ${intent.format.toUpperCase()}.`);
          return;
        }
        case 'voice_reply': {
          await speakConfirmation(intent.message);
          return;
        }
        default:
          await speakConfirmation('I did not catch a supported command. Please try again.');
      }
    },
    [currentNote, notes, selectedNote, speakConfirmation, startVoice, stopVoice]
  );

  React.useLayoutEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  }, [handleVoiceCommand]);

  React.useEffect(() => {
    const onOrbitNotepadVoice = (e: Event) => {
      const detail = (e as CustomEvent<{ transcript?: string }>).detail;
      const t = detail?.transcript?.trim();
      if (!t) return;
      void handleVoiceCommand(t);
    };
    window.addEventListener('orbit:notepadVoiceCommand', onOrbitNotepadVoice);
    return () => window.removeEventListener('orbit:notepadVoiceCommand', onOrbitNotepadVoice);
  }, [handleVoiceCommand]);

  React.useEffect(() => {
    const onToggle = async () => {
      if (voiceSessionRef.current) stopVoice();
      else await startVoice({ announce: true });
    };
    window.addEventListener('aiopad:voiceToggle', onToggle);
    return () => {
      window.removeEventListener('aiopad:voiceToggle', onToggle);
      stopVoice();
    };
  }, [startVoice, stopVoice]);

  const handleNoteChange = (changes: Partial<Note>) => {
    if (!selectedNote) return;

    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === selectedNote
          ? { ...note, ...changes, lastModified: new Date() }
          : note
      )
    );
  };

  const handleFontChange = (newFontFamily: string, newFontSize: number) => {
    setFontFamily(newFontFamily);
    setFontSize(newFontSize);
  };

  const handleNoteSelect = (noteId: string | null) => {
    const targetNote = notes.find(note => note.id === noteId);
    if (targetNote?.isLocked) {
      return;
    }
    setSelectedNote(noteId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Box
          sx={{
            width: isSidebarOpen ? 280 : 0,
            transition: 'width 0.2s ease-in-out',
            position: 'relative',
            display: 'flex',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 280,
              transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.2s ease-in-out',
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <Sidebar
              notes={notes}
              setNotes={setNotes}
              selectedNote={selectedNote}
              onNoteSelect={handleNoteSelect}
              isOpen={isSidebarOpen}
            />
          </Box>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Editor
            note={currentNote}
            notes={notes}
            onNoteChange={handleNoteChange}
            fontFamily={fontFamily}
            fontSize={fontSize}
            onFontChange={handleFontChange}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={toggleSidebar}
          />
        </Box>
      </Box>
      <ThemeControls
        mode={mode}
        themeVariant={themeVariant}
        onThemeChange={handleThemeChange}
        onToggleTheme={toggleTheme}
      />
    </ThemeProvider>
  );
}

export default App;
