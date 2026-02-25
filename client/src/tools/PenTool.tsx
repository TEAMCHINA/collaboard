import { create } from "zustand";
import type { FC } from "react";
import type { StrokeElement, AddElementOp, BoardElement } from "shared";
import { generateId } from "shared";
import type { ITool, PointerEventData, ToolOption } from "./Tool";

const penStore = create<ToolOption>(() => ({ size: 3, color: "#000000" }));

const PenIcon: FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

export class PenTool implements ITool {
  name = "pen";
  label = "Pen";
  icon = PenIcon;
  keybinds = ["p", "P"];
  sizeConfig = { min: 1, max: 20 };
  hasColor = true;
  selectTool: () => void = () => {};

  private activeElement: StrokeElement | null = null;
  private drawing = false;
  private owner: string;
  private boardToken: string;
  private onCommit: (op: AddElementOp) => void;
  private onDrawing: (element: BoardElement | null) => void;
  private lastEmit = 0;

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
  }

  setSize(n: number) { penStore.setState({ size: n }); }
  setColor(c: string) { penStore.setState({ color: c }); }
  getOptions() { return penStore.getState(); }
  subscribeOptions(cb: () => void) { return penStore.subscribe(cb); }

  onPointerDown(e: PointerEventData): void {
    const { size: width, color } = penStore.getState();
    this.drawing = true;
    this.activeElement = {
      id: generateId(),
      type: "stroke",
      owner: this.owner,
      createdAt: Date.now(),
      zIndex: 0,
      points: [{ x: e.x, y: e.y }],
      color,
      width,
    };
    this.emitDrawing();
  }

  onPointerMove(e: PointerEventData): void {
    if (!this.drawing || !this.activeElement) return;
    this.activeElement.points.push({ x: e.x, y: e.y });
    this.throttledEmitDrawing();
  }

  onPointerUp(_e: PointerEventData): void {
    if (!this.drawing || !this.activeElement) return;
    this.drawing = false;

    if (this.activeElement.points.length === 1) {
      this.activeElement.points.push({ ...this.activeElement.points[0] });
    }

    if (this.activeElement.points.length >= 2) {
      const op: AddElementOp = {
        id: generateId(),
        type: "addElement",
        boardToken: this.boardToken,
        owner: this.owner,
        timestamp: Date.now(),
        seqNum: 0,
        element: this.activeElement,
      };
      this.onCommit(op);
    }

    this.activeElement = null;
    this.onDrawing(null);
  }

  getActiveElement(): StrokeElement | null {
    return this.activeElement;
  }

  activate(): void {}
  deactivate(): void {
    if (this.drawing) {
      this.onDrawing(null);
    }
    this.drawing = false;
    this.activeElement = null;
  }

  private emitDrawing(): void {
    if (this.activeElement) {
      this.onDrawing({ ...this.activeElement, points: [...this.activeElement.points] });
    }
    this.lastEmit = Date.now();
  }

  private throttledEmitDrawing(): void {
    const now = Date.now();
    if (now - this.lastEmit > 30) {
      this.emitDrawing();
    }
  }
}
