import React from 'react';
import { ThemeProvider, CssBaseline, Box, createTheme } from '@mui/material';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ThemeControls from './components/ThemeControls';
import { getThemeOptions, ThemeVariant, ColorMode } from './themes';
import { saveThemePreference, getThemePreference, saveNotes, getNotes } from './utils/storage';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  createdAt?: Date;
  isPinned?: boolean;
  isLocked?: boolean;
  password?: string;
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

  // Save notes whenever they change
  React.useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const theme = React.useMemo(
    () => createTheme(getThemeOptions(themeVariant, mode)),
    [themeVariant, mode]
  );

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
      // Don't select locked notes
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