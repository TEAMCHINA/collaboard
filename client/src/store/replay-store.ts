import { create } from "zustand";
import type { BoardElement } from "shared";

interface ReplayState {
  active: boolean;
  playing: boolean;
  index: number;
  elements: BoardElement[]; // frozen snapshot sorted by createdAt
  enter: (elements: BoardElement[]) => void;
  exit: () => void;
  setIndex: (i: number) => void;
  setPlaying: (v: boolean) => void;
}

export const useReplayStore = create<ReplayState>((set) => ({
  active: false,
  playing: false,
  index: 0,
  elements: [],
  enter: (elements) => set({ active: true, playing: false, elements, index: 0 }),
  exit: () => set({ active: false, playing: false, index: 0, elements: [] }),
  setIndex: (index) => set({ index }),
  setPlaying: (playing) => set({ playing }),
}));
