import { create } from "zustand";

interface ToolState {
  activeTool: string;
  penColor: string;
  penWidth: number;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  setActiveTool: (tool: string) => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: "pen",
  penColor: "#000000",
  penWidth: 3,
  fontSize: 24,
  fontFamily: "sans-serif",
  textColor: "#000000",
  setActiveTool: (tool) => set({ activeTool: tool }),
  setPenColor: (color) => set({ penColor: color }),
  setPenWidth: (width) => set({ penWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),
  setTextColor: (color) => set({ textColor: color }),
}));
