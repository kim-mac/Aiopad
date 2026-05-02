import { create } from 'zustand';

interface AIStore {
  isLoading: boolean;
  currentTask: string;
  setLoading: (task: string) => void;
  clearLoading: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  isLoading: false,
  currentTask: '',
  setLoading: (task: string) => set({ isLoading: true, currentTask: task }),
  clearLoading: () => set({ isLoading: false, currentTask: '' }),
}));
