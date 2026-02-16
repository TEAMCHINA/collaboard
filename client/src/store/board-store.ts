import { create } from "zustand";
import type { BoardElement, Operation } from "shared";
import { applyOperation } from "shared";

interface BoardState {
  elements: Map<string, BoardElement>;
  seqNum: number;
  setInitialState: (elements: BoardElement[], seqNum: number) => void;
  applyOp: (op: Operation) => void;
  getElementsSorted: () => BoardElement[];
}

export const useBoardStore = create<BoardState>((set, get) => ({
  elements: new Map(),
  seqNum: 0,

  setInitialState: (elements: BoardElement[], seqNum: number) => {
    const map = new Map<string, BoardElement>();
    for (const el of elements) {
      map.set(el.id, el);
    }
    set({ elements: map, seqNum });
  },

  applyOp: (op: Operation) => {
    const elements = new Map(get().elements);
    applyOperation(elements, op);
    set({ elements, seqNum: op.seqNum });
  },

  getElementsSorted: () => {
    return Array.from(get().elements.values()).sort((a, b) => a.zIndex - b.zIndex);
  },
}));
