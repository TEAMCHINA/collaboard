import type { Operation } from "shared";

const MAX_STACK_SIZE = 100;

interface UndoState {
  undoStack: Operation[];
  redoStack: Operation[];
}

// Keyed by `${boardToken}:${owner}`
const stacks = new Map<string, UndoState>();

function getKey(boardToken: string, owner: string): string {
  return `${boardToken}:${owner}`;
}

function getOrCreate(boardToken: string, owner: string): UndoState {
  const key = getKey(boardToken, owner);
  let state = stacks.get(key);
  if (!state) {
    state = { undoStack: [], redoStack: [] };
    stacks.set(key, state);
  }
  return state;
}

export function pushOp(boardToken: string, owner: string, op: Operation): void {
  const state = getOrCreate(boardToken, owner);
  state.undoStack.push(op);
  if (state.undoStack.length > MAX_STACK_SIZE) {
    state.undoStack.shift();
  }
  // New operation clears redo stack
  state.redoStack = [];
}

export function pushOpForUndo(boardToken: string, owner: string, op: Operation): void {
  // Push without clearing redo - used when applying inverse ops from undo/redo
  const state = getOrCreate(boardToken, owner);
  state.undoStack.push(op);
  if (state.undoStack.length > MAX_STACK_SIZE) {
    state.undoStack.shift();
  }
}

export function popUndo(boardToken: string, owner: string): Operation | undefined {
  const state = getOrCreate(boardToken, owner);
  const op = state.undoStack.pop();
  if (op) {
    state.redoStack.push(op);
    if (state.redoStack.length > MAX_STACK_SIZE) {
      state.redoStack.shift();
    }
  }
  return op;
}

export function popRedo(boardToken: string, owner: string): Operation | undefined {
  const state = getOrCreate(boardToken, owner);
  const op = state.redoStack.pop();
  if (op) {
    state.undoStack.push(op);
    if (state.undoStack.length > MAX_STACK_SIZE) {
      state.undoStack.shift();
    }
  }
  return op;
}

export function clearStacks(boardToken: string, owner: string): void {
  stacks.delete(getKey(boardToken, owner));
}

export function clearBoardStacks(boardToken: string): void {
  for (const key of stacks.keys()) {
    if (key.startsWith(`${boardToken}:`)) {
      stacks.delete(key);
    }
  }
}
