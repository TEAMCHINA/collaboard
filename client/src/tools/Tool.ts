import type { FC } from "react";
import type { BoardElement } from "shared";

export interface PointerEventData {
  x: number;
  y: number;
  pressure: number;
}

export interface ToolOption {
  size: number;
  color: string;
}

export interface ITool {
  name: string;
  label: string;
  icon: FC;
  keybinds: string[];
  sizeConfig: { min: number; max: number } | null;
  hasColor: boolean;
  selectTool(): void;
  setSize(n: number): void;
  setColor(c: string): void;
  getOptions(): ToolOption;
  subscribeOptions(cb: () => void): () => void;
  onPointerDown(e: PointerEventData): void;
  onPointerMove(e: PointerEventData): void;
  onPointerUp(e: PointerEventData): void;
  onKeyDown?(e: KeyboardEvent): void;
  getActiveElement(): BoardElement | null;
  activate(): void;
  deactivate(): void;
}
