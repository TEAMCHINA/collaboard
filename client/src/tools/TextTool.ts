import type { TextElement } from "shared";
import type { ITool, PointerEventData } from "./Tool";

export interface TextPlacement {
  id: string;
  x: number;       // world
  y: number;       // world
  screenX: number;
  screenY: number;
}

export class TextTool implements ITool {
  name = "text";
  private onClick: (x: number, y: number) => void;

  constructor(onClick: (x: number, y: number) => void) {
    this.onClick = onClick;
  }

  onPointerDown(e: PointerEventData): void {
    this.onClick(e.x, e.y);
  }

  onPointerMove(_e: PointerEventData): void {}
  onPointerUp(_e: PointerEventData): void {}

  getActiveElement(): TextElement | null {
    return null;
  }

  activate(): void {}
  deactivate(): void {}
}
