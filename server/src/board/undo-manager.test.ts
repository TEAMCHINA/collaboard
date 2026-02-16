import { describe, it, expect, beforeEach } from "vitest";
import { pushOp, popUndo, popRedo, clearStacks, clearBoardStacks } from "./undo-manager.js";
import type { AddElementOp, StrokeElement } from "shared";

function makeOp(id: string, owner = "alice"): AddElementOp {
  return {
    id,
    type: "addElement",
    boardToken: "board-1",
    owner,
    timestamp: Date.now(),
    seqNum: 0,
    element: {
      id: `el-${id}`,
      type: "stroke",
      owner,
      createdAt: Date.now(),
      zIndex: 0,
      points: [],
      color: "#000",
      width: 2,
    } as StrokeElement,
  };
}

beforeEach(() => {
  clearBoardStacks("board-1");
  clearBoardStacks("board-2");
});

describe("pushOp / popUndo", () => {
  it("pops last pushed op", () => {
    const op1 = makeOp("1");
    const op2 = makeOp("2");
    pushOp("board-1", "alice", op1);
    pushOp("board-1", "alice", op2);

    const popped = popUndo("board-1", "alice");
    expect(popped?.id).toBe("2");
  });

  it("returns undefined when stack is empty", () => {
    expect(popUndo("board-1", "alice")).toBeUndefined();
  });

  it("isolates stacks per user", () => {
    const opAlice = makeOp("a", "alice");
    const opBob = makeOp("b", "bob");
    pushOp("board-1", "alice", opAlice);
    pushOp("board-1", "bob", opBob);

    expect(popUndo("board-1", "alice")?.id).toBe("a");
    expect(popUndo("board-1", "bob")?.id).toBe("b");
  });

  it("isolates stacks per board", () => {
    const op1 = makeOp("1");
    const op2 = makeOp("2");
    pushOp("board-1", "alice", op1);
    pushOp("board-2", "alice", op2);

    expect(popUndo("board-1", "alice")?.id).toBe("1");
    expect(popUndo("board-2", "alice")?.id).toBe("2");
  });
});

describe("redo", () => {
  it("popUndo moves op to redo stack", () => {
    const op = makeOp("1");
    pushOp("board-1", "alice", op);
    popUndo("board-1", "alice");

    const redone = popRedo("board-1", "alice");
    expect(redone?.id).toBe("1");
  });

  it("popRedo moves op back to undo stack", () => {
    const op = makeOp("1");
    pushOp("board-1", "alice", op);
    popUndo("board-1", "alice");
    popRedo("board-1", "alice");

    const undone = popUndo("board-1", "alice");
    expect(undone?.id).toBe("1");
  });

  it("new push clears redo stack", () => {
    const op1 = makeOp("1");
    const op2 = makeOp("2");
    pushOp("board-1", "alice", op1);
    popUndo("board-1", "alice");

    pushOp("board-1", "alice", op2);
    expect(popRedo("board-1", "alice")).toBeUndefined();
  });

  it("returns undefined when redo stack is empty", () => {
    expect(popRedo("board-1", "alice")).toBeUndefined();
  });
});

describe("stack cap", () => {
  it("limits undo stack to 100 ops", () => {
    for (let i = 0; i < 110; i++) {
      pushOp("board-1", "alice", makeOp(String(i)));
    }

    let count = 0;
    while (popUndo("board-1", "alice")) count++;
    expect(count).toBe(100);
  });
});

describe("clearStacks", () => {
  it("clears a specific user's stacks", () => {
    pushOp("board-1", "alice", makeOp("1"));
    pushOp("board-1", "bob", makeOp("2"));
    clearStacks("board-1", "alice");

    expect(popUndo("board-1", "alice")).toBeUndefined();
    expect(popUndo("board-1", "bob")?.id).toBe("2");
  });
});

describe("clearBoardStacks", () => {
  it("clears all stacks for a board", () => {
    pushOp("board-1", "alice", makeOp("1"));
    pushOp("board-1", "bob", makeOp("2"));
    clearBoardStacks("board-1");

    expect(popUndo("board-1", "alice")).toBeUndefined();
    expect(popUndo("board-1", "bob")).toBeUndefined();
  });
});
