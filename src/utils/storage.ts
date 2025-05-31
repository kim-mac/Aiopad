import { ThemeVariant, ColorMode } from '../themes';

const THEME_VARIANT_KEY = 'notepad-theme-variant';
const COLOR_MODE_KEY = 'notepad-color-mode';
const NOTES_STORAGE_KEY = 'notepad-notes';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  createdAt?: Date;
}

export const saveThemePreference = (variant: ThemeVariant, mode: ColorMode) => {
  localStorage.setItem(THEME_VARIANT_KEY, variant);
  localStorage.setItem(COLOR_MODE_KEY, mode);
};

export const getThemePreference = (): { variant: ThemeVariant; mode: ColorMode } | null => {
  const savedVariant = localStorage.getItem(THEME_VARIANT_KEY) as ThemeVariant;
  const savedMode = localStorage.getItem(COLOR_MODE_KEY) as ColorMode;

  if (savedVariant && savedMode) {
    return { variant: savedVariant, mode: savedMode };
  }
  return null;
};

export const saveNotes = (notes: Note[]) => {
  const notesToSave = notes.map(note => ({
    ...note,
    lastModified: note.lastModified.toISOString(),
    createdAt: note.createdAt?.toISOString()
  }));
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesToSave));
};

export const getNotes = (): Note[] => {
  const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
  if (!savedNotes) return [];
  
  try {
    const parsedNotes = JSON.parse(savedNotes);
    return parsedNotes.map((note: any) => ({
      ...note,
      lastModified: new Date(note.lastModified),
      createdAt: note.createdAt ? new Date(note.createdAt) : undefined
    }));
  } catch (error) {
    console.error('Error parsing saved notes:', error);
    return [];
  }
}; 