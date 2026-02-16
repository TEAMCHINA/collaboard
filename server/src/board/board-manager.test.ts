import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the sqlite-snapshots module before importing board-manager
vi.mock("../persistence/sqlite-snapshots.js", () => ({
  getLatestSnapshot: vi.fn().mockReturnValue(null),
}));

import { getOrCreateBoard, applyOp, getBoardElements, getBoard, getActiveBoards, removeBoard } from "./board-manager.js";
import type { AddElementOp, StrokeElement, RemoveElementOp } from "shared";

function makeAddOp(id: string, owner = "alice"): AddElementOp {
  return {
    id: `op-${id}`,
    type: "addElement",
    boardToken: "test",
    owner,
    timestamp: Date.now(),
    seqNum: 0,
    element: {
      id,
      type: "stroke",
      owner,
      createdAt: Date.now(),
      zIndex: 0,
      points: [{ x: 0, y: 0 }],
      color: "#000",
      width: 2,
    } as StrokeElement,
  };
}

beforeEach(() => {
  // Clean up boards between tests
  for (const token of getActiveBoards()) {
    removeBoard(token);
  }
});

describe("getOrCreateBoard", () => {
  it("creates a new empty board", () => {
    const board = getOrCreateBoard("new-board");
    expect(board.token).toBe("new-board");
    expect(board.elements.size).toBe(0);
    expect(board.seqNum).toBe(0);
    expect(board.dirty).toBe(false);
    expect(board.empty).toBe(false);
  });

  it("returns the same board on repeated calls", () => {
    const b1 = getOrCreateBoard("same");
    const b2 = getOrCreateBoard("same");
    expect(b1).toBe(b2);
  });
});

describe("applyOp", () => {
  it("adds element and increments seqNum", () => {
    const board = getOrCreateBoard("b1");
    const op = makeAddOp("s1");
    const stamped = applyOp(board, op);

    expect(stamped.seqNum).toBe(1);
    expect(board.elements.size).toBe(1);
    expect(board.seqNum).toBe(1);
  });

  it("assigns zIndex to added elements", () => {
    const board = getOrCreateBoard("b2");
    const s1 = applyOp(board, makeAddOp("s1"));
    const s2 = applyOp(board, makeAddOp("s2"));

    expect((s1 as AddElementOp).element.zIndex).toBe(0);
    expect((s2 as AddElementOp).element.zIndex).toBe(1);
  });

  it("marks board as dirty", () => {
    const board = getOrCreateBoard("b3");
    expect(board.dirty).toBe(false);

    applyOp(board, makeAddOp("s1"));
    expect(board.dirty).toBe(true);
  });
});

describe("getBoardElements", () => {
  it("returns empty array for unknown board", () => {
    expect(getBoardElements("nope")).toEqual([]);
  });

  it("returns elements sorted by zIndex", () => {
    const board = getOrCreateBoard("b4");
    applyOp(board, makeAddOp("s1"));
    applyOp(board, makeAddOp("s2"));
    applyOp(board, makeAddOp("s3"));

    const elements = getBoardElements("b4");
    expect(elements).toHaveLength(3);
    expect(elements[0].zIndex).toBeLessThan(elements[1].zIndex);
    expect(elements[1].zIndex).toBeLessThan(elements[2].zIndex);
  });
});

describe("dirty and empty flags", () => {
  it("dirty resets when set to false", () => {
    const board = getOrCreateBoard("b5");
    applyOp(board, makeAddOp("s1"));
    expect(board.dirty).toBe(true);

    board.dirty = false;
    expect(board.dirty).toBe(false);
  });

  it("empty flag is settable", () => {
    const board = getOrCreateBoard("b6");
    expect(board.empty).toBe(false);

    board.empty = true;
    expect(board.empty).toBe(true);
  });
});

describe("removeBoard", () => {
  it("removes board from active boards", () => {
    getOrCreateBoard("r1");
    expect(getActiveBoards()).toContain("r1");

    removeBoard("r1");
    expect(getActiveBoards()).not.toContain("r1");
    expect(getBoard("r1")).toBeUndefined();
  });
});
