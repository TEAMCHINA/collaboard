import { describe, it, expect } from "vitest";
import type { BoardElement, StrokeElement, TextElement } from "../types/board-element.js";
import type { AddElementOp, RemoveElementOp, UpdateElementOp } from "../types/operation.js";
import { invertOperation, applyOperation, reconstructState } from "./operation-helpers.js";

function makeStroke(id: string, owner = "alice"): StrokeElement {
  return {
    id,
    type: "stroke",
    owner,
    createdAt: Date.now(),
    zIndex: 0,
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    color: "#000",
    width: 2,
  };
}

function makeText(id: string, content: string, owner = "alice"): TextElement {
  return {
    id,
    type: "text",
    owner,
    createdAt: Date.now(),
    zIndex: 0,
    x: 100,
    y: 100,
    content,
    fontSize: 16,
    fontFamily: "sans-serif",
    color: "#000",
  };
}

function makeAddOp(element: BoardElement, seqNum = 1): AddElementOp {
  return {
    id: `op-${seqNum}`,
    type: "addElement",
    boardToken: "test-board",
    owner: element.owner,
    timestamp: Date.now(),
    seqNum,
    element,
  };
}

function makeRemoveOp(element: BoardElement, seqNum = 1): RemoveElementOp {
  return {
    id: `op-${seqNum}`,
    type: "removeElement",
    boardToken: "test-board",
    owner: element.owner,
    timestamp: Date.now(),
    seqNum,
    elementId: element.id,
    removedElement: element,
  };
}

function makeUpdateOp(elementId: string, changes: Partial<BoardElement>, previousState: Partial<BoardElement>, seqNum = 1): UpdateElementOp {
  return {
    id: `op-${seqNum}`,
    type: "updateElement",
    boardToken: "test-board",
    owner: "alice",
    timestamp: Date.now(),
    seqNum,
    elementId,
    changes,
    previousState,
  };
}

describe("invertOperation", () => {
  it("inverts addElement to removeElement", () => {
    const stroke = makeStroke("s1");
    const op = makeAddOp(stroke);
    const inv = invertOperation(op);

    expect(inv.type).toBe("removeElement");
    expect((inv as RemoveElementOp).elementId).toBe("s1");
    expect((inv as RemoveElementOp).removedElement).toEqual(stroke);
  });

  it("inverts removeElement to addElement", () => {
    const stroke = makeStroke("s1");
    const op = makeRemoveOp(stroke);
    const inv = invertOperation(op);

    expect(inv.type).toBe("addElement");
    expect((inv as AddElementOp).element).toEqual(stroke);
  });

  it("inverts updateElement by swapping changes and previousState", () => {
    const op = makeUpdateOp("s1", { color: "#f00" } as Partial<BoardElement>, { color: "#000" } as Partial<BoardElement>);
    const inv = invertOperation(op);

    expect(inv.type).toBe("updateElement");
    expect((inv as UpdateElementOp).changes).toEqual({ color: "#000" });
    expect((inv as UpdateElementOp).previousState).toEqual({ color: "#f00" });
  });

  it("double invert returns equivalent operation", () => {
    const stroke = makeStroke("s1");
    const op = makeAddOp(stroke);
    const inv1 = invertOperation(op);
    const inv2 = invertOperation({
      ...inv1,
      id: "x",
      seqNum: 0,
      timestamp: 0,
    } as RemoveElementOp);

    expect(inv2.type).toBe("addElement");
    expect((inv2 as AddElementOp).element).toEqual(stroke);
  });
});

describe("applyOperation", () => {
  it("adds an element", () => {
    const elements = new Map<string, BoardElement>();
    const stroke = makeStroke("s1");
    applyOperation(elements, makeAddOp(stroke));

    expect(elements.size).toBe(1);
    expect(elements.get("s1")).toEqual(stroke);
  });

  it("removes an element", () => {
    const stroke = makeStroke("s1");
    const elements = new Map<string, BoardElement>([["s1", stroke]]);
    applyOperation(elements, makeRemoveOp(stroke));

    expect(elements.size).toBe(0);
  });

  it("updates an element", () => {
    const stroke = makeStroke("s1");
    const elements = new Map<string, BoardElement>([["s1", stroke]]);
    applyOperation(elements, makeUpdateOp("s1", { color: "#f00" } as Partial<BoardElement>, { color: "#000" } as Partial<BoardElement>));

    const updated = elements.get("s1") as StrokeElement;
    expect(updated.color).toBe("#f00");
    expect(updated.points).toEqual(stroke.points); // unchanged fields preserved
  });

  it("ignores update for nonexistent element", () => {
    const elements = new Map<string, BoardElement>();
    applyOperation(elements, makeUpdateOp("missing", { color: "#f00" } as Partial<BoardElement>, { color: "#000" } as Partial<BoardElement>));

    expect(elements.size).toBe(0);
  });

  it("handles multiple ops sequentially", () => {
    const elements = new Map<string, BoardElement>();
    const s1 = makeStroke("s1");
    const s2 = makeStroke("s2", "bob");

    applyOperation(elements, makeAddOp(s1, 1));
    applyOperation(elements, makeAddOp(s2, 2));
    expect(elements.size).toBe(2);

    applyOperation(elements, makeRemoveOp(s1, 3));
    expect(elements.size).toBe(1);
    expect(elements.has("s2")).toBe(true);
  });
});

describe("reconstructState", () => {
  it("returns empty map with no base and no ops", () => {
    const result = reconstructState([], []);
    expect(result.size).toBe(0);
  });

  it("returns base elements when no ops", () => {
    const s1 = makeStroke("s1");
    const result = reconstructState([s1], []);
    expect(result.size).toBe(1);
    expect(result.get("s1")).toEqual(s1);
  });

  it("applies ops on top of base elements", () => {
    const s1 = makeStroke("s1");
    const s2 = makeStroke("s2");
    const result = reconstructState([s1], [makeAddOp(s2, 1)]);

    expect(result.size).toBe(2);
  });

  it("reconstructs after add then remove", () => {
    const s1 = makeStroke("s1");
    const ops = [
      makeAddOp(s1, 1),
      makeRemoveOp(s1, 2),
    ];
    const result = reconstructState([], ops);
    expect(result.size).toBe(0);
  });

  it("reconstructs with text elements", () => {
    const t1 = makeText("t1", "hello");
    const result = reconstructState([], [makeAddOp(t1, 1)]);
    expect(result.size).toBe(1);
    expect((result.get("t1") as TextElement).content).toBe("hello");
  });
});
