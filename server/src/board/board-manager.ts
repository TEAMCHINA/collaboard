import type { BoardElement, BoardState, Operation } from "shared";
import { applyOperation } from "shared";

const boards = new Map<string, BoardState>();

export function getOrCreateBoard(token: string): BoardState {
  let board = boards.get(token);
  if (!board) {
    board = {
      token,
      elements: new Map(),
      nextZIndex: 0,
      seqNum: 0,
    };
    boards.set(token, board);
  }
  return board;
}

export function applyOp(board: BoardState, op: Operation): Operation {
  const seqNum = ++board.seqNum;
  const stamped = { ...op, seqNum };

  if (stamped.type === "addElement") {
    stamped.element = { ...stamped.element, zIndex: board.nextZIndex++ };
  }

  applyOperation(board.elements, stamped);
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
