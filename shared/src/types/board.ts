import type { BoardElement } from "./board-element.js";

export interface BoardState {
  token: string;
  elements: Map<string, BoardElement>;
  nextZIndex: number;
  seqNum: number;
}

export interface BoardSnapshot {
  token: string;
  elements: BoardElement[];
  seqNum: number;
  timestamp: number;
}
