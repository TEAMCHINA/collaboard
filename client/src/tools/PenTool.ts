import type { StrokeElement, AddElementOp, BoardElement } from "shared";
import { generateId } from "shared";
import type { ITool, PointerEventData } from "./Tool";
import { useToolStore } from "../store/tool-store";

export class PenTool implements ITool {
  name = "pen";
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

  onPointerDown(e: PointerEventData): void {
    const { penColor, penWidth } = useToolStore.getState();
    this.drawing = true;
    this.activeElement = {
      id: generateId(),
      type: "stroke",
      owner: this.owner,
      createdAt: Date.now(),
      zIndex: 0,
      points: [{ x: e.x, y: e.y }],
      color: penColor,
      width: penWidth,
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
