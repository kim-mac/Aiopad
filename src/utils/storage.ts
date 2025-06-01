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

const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export const saveThemePreference = (variant: ThemeVariant, mode: ColorMode) => {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(THEME_VARIANT_KEY, variant);
    localStorage.setItem(COLOR_MODE_KEY, mode);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
};

export const getThemePreference = (): { variant: ThemeVariant; mode: ColorMode } | null => {
  if (!isStorageAvailable()) return null;
  try {
    const savedVariant = localStorage.getItem(THEME_VARIANT_KEY) as ThemeVariant;
    const savedMode = localStorage.getItem(COLOR_MODE_KEY) as ColorMode;

    if (savedVariant && savedMode) {
      return { variant: savedVariant, mode: savedMode };
    }
  } catch (error) {
    console.error('Error getting theme preference:', error);
  }
  return null;
};

export const saveNotes = (notes: Note[]) => {
  if (!isStorageAvailable()) return;
  try {
    const notesToSave = notes.map(note => ({
      ...note,
      lastModified: note.lastModified.toISOString(),
      createdAt: note.createdAt?.toISOString()
    }));
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesToSave));
  } catch (error) {
    console.error('Error saving notes:', error);
  }
};

export const getNotes = (): Note[] => {
  if (!isStorageAvailable()) return [];
  try {
    const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!savedNotes) return [];
    
    const parsedNotes = JSON.parse(savedNotes);
    return parsedNotes.map((note: any) => ({
      ...note,
      lastModified: new Date(note.lastModified),
      createdAt: note.createdAt ? new Date(note.createdAt) : undefined
    }));
  } catch (error) {
    console.error('Error getting saved notes:', error);
    return [];
  }
}; 