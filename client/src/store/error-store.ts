import { create } from "zustand";

interface ErrorState {
  message: string | null;
  setError: (msg: string, durationMs?: number) => void;
  clearError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  message: null,
  setError: (msg, durationMs = 4000) => {
    set({ message: msg });
    setTimeout(() => set({ message: null }), durationMs);
  },
  clearError: () => set({ message: null }),
}));
