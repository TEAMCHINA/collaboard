import { create } from "zustand";

interface ToolState {
  activeTool: string;
  fontFamily: string;
  recentColors: string[];
  setActiveTool: (tool: string) => void;
  addRecentColor: (color: string) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: "pen",
  fontFamily: "sans-serif",
  recentColors: [],
  setActiveTool: (tool) => set({ activeTool: tool }),
  addRecentColor: (color) =>
    set((state) => ({
      recentColors: [color, ...state.recentColors.filter((c) => c !== color)].slice(0, 8),
    })),
}));
