import type { BoardElement } from "../types/board-element.js";
import type { Operation, AddElementOp, RemoveElementOp, UpdateElementOp } from "../types/operation.js";

export function invertOperation(op: Operation): Omit<Operation, "id" | "seqNum" | "timestamp"> {
  switch (op.type) {
    case "addElement":
      return {
        type: "removeElement",
        boardToken: op.boardToken,
        owner: op.owner,
        elementId: op.element.id,
        removedElement: op.element,
      } as Omit<RemoveElementOp, "id" | "seqNum" | "timestamp">;

    case "removeElement":
      return {
        type: "addElement",
        boardToken: op.boardToken,
        owner: op.owner,
        element: op.removedElement,
      } as Omit<AddElementOp, "id" | "seqNum" | "timestamp">;

    case "updateElement":
      return {
        type: "updateElement",
        boardToken: op.boardToken,
        owner: op.owner,
        elementId: op.elementId,
        changes: op.previousState,
        previousState: op.changes,
      } as Omit<UpdateElementOp, "id" | "seqNum" | "timestamp">;
  }
}

export function applyOperation(
  elements: Map<string, BoardElement>,
  op: Operation
): Map<string, BoardElement> {
  switch (op.type) {
    case "addElement":
      elements.set(op.element.id, op.element);
      break;

    case "removeElement":
      elements.delete(op.elementId);
      break;

    case "updateElement": {
      const existing = elements.get(op.elementId);
      if (existing) {
        elements.set(op.elementId, { ...existing, ...op.changes } as BoardElement);
      }
      break;
    }
  }
  return elements;
}

export function reconstructState(
  baseElements: BoardElement[],
  ops: Operation[]
): Map<string, BoardElement> {
  const elements = new Map<string, BoardElement>();
  for (const el of baseElements) {
    elements.set(el.id, el);
  }
  for (const op of ops) {
    applyOperation(elements, op);
  }
  return elements;
}
