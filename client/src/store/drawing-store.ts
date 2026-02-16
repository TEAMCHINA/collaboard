import { create } from "zustand";
import type { BoardElement } from "shared";

interface DrawingState {
  remoteDrawing: Map<string, BoardElement>;
  setRemoteDrawing: (displayName: string, element: BoardElement | null) => void;
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
  remoteDrawing: new Map(),

  setRemoteDrawing: (displayName, element) => {
    const remoteDrawing = new Map(get().remoteDrawing);
    if (element) {
      remoteDrawing.set(displayName, element);
    } else {
      remoteDrawing.delete(displayName);
    }
    set({ remoteDrawing });
  },
}));
