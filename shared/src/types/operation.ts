import type { BoardElement } from "./board-element.js";

export interface BaseOperation {
  id: string;
  type: string;
  boardToken: string;
  owner: string;
  timestamp: number;
  seqNum: number;
}

export interface AddElementOp extends BaseOperation {
  type: "addElement";
  element: BoardElement;
}

export interface RemoveElementOp extends BaseOperation {
  type: "removeElement";
  elementId: string;
  removedElement: BoardElement;
}

export interface UpdateElementOp extends BaseOperation {
  type: "updateElement";
  elementId: string;
  changes: Partial<BoardElement>;
  previousState: Partial<BoardElement>;
}

export type Operation = AddElementOp | RemoveElementOp | UpdateElementOp;
