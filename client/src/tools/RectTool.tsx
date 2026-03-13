import { create } from "zustand";
import type { FC } from "react";
import type { RectElement, AddElementOp, BoardElement } from "shared";
import { generateId } from "shared";
import type { ITool, PointerEventData, ToolOption } from "./Tool";

const rectStore = create<ToolOption>(() => ({ size: 2, color: "#000000" }));

const RectIcon: FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="1" />
  </svg>
);

type Phase = "idle" | "pressing" | "dragging" | "anchored";

const DRAG_THRESHOLD = 4;

export class RectTool implements ITool {
  name = "rect";
  label = "Rect";
  icon = RectIcon;
  keybinds = ["r", "R"];
  sizeConfig = { min: 1, max: 20 };
  hasColor = true;
  selectTool: () => void = () => {};

  private phase: Phase = "idle";
  private anchor: { x: number; y: number } | null = null;
  private cursor = { x: 0, y: 0 };
  private shiftHeld = false;

  private owner: string;
  private boardToken: string;
  private onCommit: (op: AddElementOp) => void;
  private onDrawing: (element: BoardElement | null) => void;

  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onKeyUp: (e: KeyboardEvent) => void;

  constructor(
    owner: string,
    boardToken: string,
    onCommit: (op: AddElementOp) => void,
    onDrawing: (element: BoardElement | null) => void,
  ) {
    this.owner = owner;
    this.boardToken = boardToken;
    this.onCommit = onCommit;
    this.onDrawing = onDrawing;

    this._onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        this.shiftHeld = true;
        this.emitPreview();
      }
      if (e.key === "Escape" && this.phase !== "idle") {
        this.phase = "idle";
        this.anchor = null;
        this.onDrawing(null);
      }
    };
    this._onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        this.shiftHeld = false;
        this.emitPreview();
      }
    };
  }

  setSize(n: number) { rectStore.setState({ size: n }); }
  setColor(c: string) { rectStore.setState({ color: c }); }
  getOptions() { return rectStore.getState(); }
  subscribeOptions(cb: () => void) { return rectStore.subscribe(cb); }

  activate(): void {
    this.phase = "idle";
    this.anchor = null;
    this.shiftHeld = false;
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  deactivate(): void {
    this.phase = "idle";
    this.anchor = null;
    this.onDrawing(null);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }

  onPointerDown(e: PointerEventData): void {
    if (this.phase === "idle") {
      this.anchor = { x: e.x, y: e.y };
      this.cursor = { x: e.x, y: e.y };
      this.phase = "pressing";
      return;
    }

    if (this.phase === "anchored" && this.anchor) {
      const { x, y, w, h } = this.getDisplayRect();
      if (w >= 3 && h >= 3) {
        this.commit(x, y, w, h);
      } else {
        this.cancel();
      }
    }
  }

  onPointerMove(e: PointerEventData): void {
    this.cursor = { x: e.x, y: e.y };
    if (this.phase === "pressing") {
      const dx = e.x - this.anchor!.x;
      const dy = e.y - this.anchor!.y;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        this.phase = "dragging";
      }
    }
    if (this.phase !== "idle") {
      this.emitPreview();
    }
  }

  onPointerUp(_e: PointerEventData): void {
    if (this.phase === "pressing") {
      // Short click — enter two-click mode
      this.phase = "anchored";
      this.emitPreview();
      return;
    }

    if (this.phase === "dragging") {
      const { x, y, w, h } = this.getDisplayRect();
      if (w >= 3 && h >= 3) {
        this.commit(x, y, w, h);
      } else {
        this.cancel();
      }
    }
  }

  getActiveElement(): RectElement | null {
    if (this.phase === "idle" || !this.anchor) return null;
    const { x, y, w, h } = this.getDisplayRect();
    const el: RectElement & { _preview?: true } = {
      id: "__rect_preview__",
      type: "rect",
      owner: this.owner,
      createdAt: Date.now(),
      zIndex: 0,
      x,
      y,
      width: w,
      height: h,
      color: rectStore.getState().color,
      strokeWidth: rectStore.getState().size,
    };
    el._preview = true;
    return el;
  }

  private commit(x: number, y: number, w: number, h: number): void {
    const { size: strokeWidth, color } = rectStore.getState();
    const element: RectElement = {
      id: generateId(),
      type: "rect",
      owner: this.owner,
      createdAt: Date.now(),
      zIndex: 0,
      x,
      y,
      width: w,
      height: h,
      color,
      strokeWidth,
    };
    const op: AddElementOp = {
      id: generateId(),
      type: "addElement",
      boardToken: this.boardToken,
      owner: this.owner,
      timestamp: Date.now(),
      seqNum: 0,
      element,
    };
    this.onCommit(op);
    this.cancel();
  }

  private cancel(): void {
    this.phase = "idle";
    this.anchor = null;
    this.onDrawing(null);
  }

  private getDisplayRect(): { x: number; y: number; w: number; h: number } {
    const anchor = this.anchor!;
    const rawW = this.cursor.x - anchor.x;
    const rawH = this.cursor.y - anchor.y;

    let w = Math.abs(rawW);
    let h = Math.abs(rawH);

    if (this.shiftHeld) {
      const side = Math.min(w, h);
      w = side;
      h = side;
    }

    const x = rawW >= 0 ? anchor.x : anchor.x - w;
    const y = rawH >= 0 ? anchor.y : anchor.y - h;
    return { x, y, w, h };
  }

  private emitPreview(): void {
    this.onDrawing(this.getActiveElement());
  }
}
