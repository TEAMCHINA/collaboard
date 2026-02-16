import { create } from "zustand";

const STORAGE_KEY = "collaboard-names";

function loadNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNames(names: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
}

interface UserState {
  names: Record<string, string>;
  cursorColor: string;
  getName: (token: string) => string | null;
  setName: (token: string, name: string) => void;
  setCursorColor: (color: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  names: loadNames(),
  cursorColor: "#e74c3c",

  getName: (token: string) => {
    return get().names[token] ?? null;
  },

  setName: (token: string, name: string) => {
    const names = { ...get().names, [token]: name };
    saveNames(names);
    set({ names });
  },

  setCursorColor: (color: string) => {
    set({ cursorColor: color });
  },
}));
