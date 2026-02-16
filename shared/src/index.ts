export type { BaseElement, StrokeElement, TextElement, BoardElement } from "./types/board-element.js";
export type { BaseOperation, AddElementOp, RemoveElementOp, UpdateElementOp, Operation } from "./types/operation.js";
export type { BoardState, BoardSnapshot } from "./types/board.js";
export type { ConnectedUser } from "./types/user.js";
export type { ClientToServerEvents, ServerToClientEvents } from "./types/events.js";

export { generateId, generateToken } from "./utils/id.js";
export { invertOperation, applyOperation, reconstructState } from "./utils/operation-helpers.js";
