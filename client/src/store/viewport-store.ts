import { create } from "zustand";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

interface ViewportState {
  panX: number;
  panY: number;
  scale: number;
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, cx: number, cy: number) => void;
  reset: () => void;
}

export const useViewportStore = create<ViewportState>((set) => ({
  panX: 0,
  panY: 0,
  scale: 1,

  pan: (dx, dy) => set((s) => ({ panX: s.panX + dx, panY: s.panY + dy })),

  zoom: (factor, cx, cy) =>
    set((s) => {
      const newScale = clamp(s.scale * factor, 0.1, 10);
      const panX = cx - (cx - s.panX) * (newScale / s.scale);
      const panY = cy - (cy - s.panY) * (newScale / s.scale);
      return { scale: newScale, panX, panY };
    }),

  reset: () => set({ panX: 0, panY: 0, scale: 1 }),
}));
