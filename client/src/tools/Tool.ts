import type { BoardElement } from "shared";

export interface PointerEventData {
  x: number;
  y: number;
  pressure: number;
}

export interface ITool {
  name: string;
  onPointerDown(e: PointerEventData): void;
  onPointerMove(e: PointerEventData): void;
  onPointerUp(e: PointerEventData): void;
  onKeyDown?(e: KeyboardEvent): void;
  getActiveElement(): BoardElement | null;
  activate(): void;
  deactivate(): void;
}
