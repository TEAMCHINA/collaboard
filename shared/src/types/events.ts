import type { BoardElement } from "./board-element.js";
import type { Operation } from "./operation.js";
import type { ConnectedUser } from "./user.js";

export interface ClientToServerEvents {
  "board:join": (data: { token: string; displayName: string }) => void;
  "board:operation": (op: Operation) => void;
  "board:undo": () => void;
  "board:redo": () => void;
  "board:drawing": (element: BoardElement | null) => void;
  "cursor:move": (data: { x: number; y: number }) => void;
  "user:update-color": (color: string) => void;
  "user:update-name": (newName: string) => void;
}

export interface ServerToClientEvents {
  "board:state": (data: { elements: BoardElement[]; seqNum: number }) => void;
  "board:operation": (op: Operation) => void;
  "board:user-joined": (data: { displayName: string; users: ConnectedUser[] }) => void;
  "board:user-left": (data: { displayName: string; users: ConnectedUser[] }) => void;
  "board:user-list": (users: ConnectedUser[]) => void;
  "board:drawing": (data: { displayName: string; element: BoardElement | null }) => void;
  "cursor:update": (data: { displayName: string; x: number; y: number; color: string }) => void;
  "board:save-start": () => void;
  "board:save-end": () => void;
  "board:save-error": (message: string) => void;
  "board:error": (message: string) => void;
}
