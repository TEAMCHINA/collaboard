import { create } from "zustand";
import { useSyncExternalStore } from "react";
import type { FC } from "react";
import type { TextElement } from "shared";
import type { ITool, PointerEventData, ToolOption } from "./Tool";

const textStore = create<ToolOption>(() => ({ size: 24, color: "#000000" }));

const TextIcon: FC = () => (
  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>T</span>
);

export function useTextOptions(): ToolOption {
  return useSyncExternalStore(
    (cb) => textStore.subscribe(cb),
    () => textStore.getState(),
  );
}

export interface TextPlacement {
  id: string;
  x: number;       // world
  y: number;       // world
  screenX: number;
  screenY: number;
}

export class TextTool implements ITool {
  name = "text";
  label = "Text";
  icon = TextIcon;
  keybinds = ["t", "T"];
  sizeConfig = { min: 12, max: 72 };
  hasColor = true;
  selectTool: () => void = () => {};

  private onClick: (x: number, y: number) => void;

  constructor(onClick: (x: number, y: number) => void) {
    this.onClick = onClick;
  }

  setSize(n: number) { textStore.setState({ size: n }); }
  setColor(c: string) { textStore.setState({ color: c }); }
  getOptions() { return textStore.getState(); }
  subscribeOptions(cb: () => void) { return textStore.subscribe(cb); }

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
