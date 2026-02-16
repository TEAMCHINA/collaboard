import type { BoardElement, BoardState, Operation } from "shared";
import { applyOperation } from "shared";
import { getLatestSnapshot } from "../persistence/sqlite-snapshots.js";

const boards = new Map<string, BoardState>();

export function getOrCreateBoard(token: string): BoardState {
  let board = boards.get(token);
  if (!board) {
    board = loadFromSnapshot(token);
    boards.set(token, board);
  }
  return board;
}

function loadFromSnapshot(token: string): BoardState {
  try {
    const snapshot = getLatestSnapshot(token);
    if (snapshot) {
      const elements = new Map<string, BoardElement>();
      let maxZIndex = 0;
      for (const el of snapshot.elements) {
        elements.set(el.id, el);
        if (el.zIndex >= maxZIndex) maxZIndex = el.zIndex + 1;
      }
      console.log(`Board ${token} loaded from snapshot (${snapshot.elements.length} elements, seq=${snapshot.seqNum})`);
      return {
        token,
        elements,
        nextZIndex: maxZIndex,
        seqNum: snapshot.seqNum,
        dirty: false,
        empty: false,
      };
    }
  } catch (err) {
    console.error(`Failed to load snapshot for board ${token}:`, err);
  }

  return {
    token,
    elements: new Map(),
    nextZIndex: 0,
    seqNum: 0,
    dirty: false,
    empty: false,
  };
}

export function applyOp(board: BoardState, op: Operation): Operation {
  const seqNum = ++board.seqNum;
  const stamped = { ...op, seqNum };

  if (stamped.type === "addElement") {
    stamped.element = { ...stamped.element, zIndex: board.nextZIndex++ };
  }

  applyOperation(board.elements, stamped);
  board.dirty = true;
  return stamped;
}

export function getBoardElements(token: string): BoardElement[] {
  const board = boards.get(token);
  if (!board) return [];
  return Array.from(board.elements.values()).sort((a, b) => a.zIndex - b.zIndex);
}

export function getBoard(token: string): BoardState | undefined {
  return boards.get(token);
}

export function deleteBoard(token: string): void {
  boards.delete(token);
}

export function getActiveBoards(): string[] {
  return Array.from(boards.keys());
}

export function removeBoard(token: string): void {
  boards.delete(token);
}
