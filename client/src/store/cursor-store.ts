import { create } from "zustand";

interface CursorPosition {
  x: number;
  y: number;
  color: string;
}

interface CursorState {
  cursors: Map<string, CursorPosition>;
  updateCursor: (displayName: string, x: number, y: number, color: string) => void;
  removeCursor: (displayName: string) => void;
}

export const useCursorStore = create<CursorState>((set, get) => ({
  cursors: new Map(),

  updateCursor: (displayName, x, y, color) => {
    const cursors = new Map(get().cursors);
    cursors.set(displayName, { x, y, color });
    set({ cursors });
  },

  removeCursor: (displayName) => {
    const cursors = new Map(get().cursors);
    cursors.delete(displayName);
    set({ cursors });
  },
}));
