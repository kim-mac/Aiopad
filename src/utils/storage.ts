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
  isPinned?: boolean;
  isLocked?: boolean;
  password?: string;
  color?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  type?: 'note' | 'todo';
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
    return parsedNotes.map((note: any) => {
      // Ensure tasks have the new fields for compatibility
      const migratedTasks = note.tasks?.map((task: any) => ({
        ...task,
        priority: task.priority || undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        taskType: task.taskType || 'one-time',
        lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : undefined,
      })) || [];
      
      // Ensure tabs have the new fields for compatibility
      const migratedTabs = note.tabs?.map((tab: any) => ({
        ...tab,
        tasks: tab.tasks?.map((task: any) => ({
          ...task,
          priority: task.priority || undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          taskType: task.taskType || 'one-time',
          lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : undefined,
        })) || [],
      })) || [];
      
      return {
        ...note,
        lastModified: new Date(note.lastModified),
        createdAt: note.createdAt ? new Date(note.createdAt) : undefined,
        tasks: migratedTasks,
        tabs: migratedTabs,
      };
    });
  } catch (error) {
    console.error('Error getting saved notes:', error);
    return [];
  }
}; 