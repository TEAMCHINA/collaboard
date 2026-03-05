import type { FC } from "react";
import type { ImageElement, AddElementOp } from "shared";
import { generateId } from "shared";
import type { ITool, PointerEventData, ToolOption } from "./Tool";
import { imageCache } from "../renderer/element-renderers/image-renderer";

// Placeholder icon — hidden tool, never rendered in toolbar
const ImageIcon: FC = () => null;

const MAX_PREVIEW_W = 800;
const MAX_PREVIEW_H = 600;

type Phase = "idle" | "following" | "anchored";

export class ImageTool implements ITool {
  name = "image";
  label = "Image";
  icon = ImageIcon;
  keybinds: string[] = [];
  sizeConfig = null;
  hasColor = false;
  hidden = true;
  selectTool: () => void = () => {};

  private phase: Phase = "idle";
  private dataUrl = "";
  private naturalW = 0;
  private naturalH = 0;
  private cursor = { x: 0, y: 0 };
  private anchor: { x: number; y: number } | null = null;
  // Cursor position and image dims captured at the moment of anchoring
  private anchorCursor = { x: 0, y: 0 };
  private anchorW = 0;
  private anchorH = 0;
  private shiftHeld = false;

  private owner: string;
  private boardToken: string;
  private onCommit: (op: AddElementOp) => void;
  private onComplete: () => void;

  // Bound listeners stored for cleanup
  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onKeyUp: (e: KeyboardEvent) => void;

  constructor(
    owner: string,
    boardToken: string,
    onCommit: (op: AddElementOp) => void,
    onComplete: () => void,
  ) {
    this.owner = owner;
    this.boardToken = boardToken;
    this.onCommit = onCommit;
    this.onComplete = onComplete;

    this._onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") this.shiftHeld = true;
      if (e.key === "Escape") {
        this.onComplete();
      }
    };
    this._onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") this.shiftHeld = false;
    };
  }

  setPendingImage(dataUrl: string, naturalW: number, naturalH: number): void {
    this.dataUrl = dataUrl;
    this.naturalW = naturalW;
    this.naturalH = naturalH;
  }

  getCursor(): string {
    if (this.phase === "anchored") return "nwse-resize";
    return "crosshair";
  }

  private static readonly OPTIONS: ToolOption = { size: 0, color: "#000000" };
  setSize(_n: number) {}
  setColor(_c: string) {}
  getOptions(): ToolOption { return ImageTool.OPTIONS; }
  subscribeOptions(_cb: () => void) { return () => {}; }

  activate(): void {
    this.phase = "following";
    this.anchor = null;
    this.shiftHeld = false;
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  deactivate(): void {
    this.phase = "idle";
    this.anchor = null;
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }

  onPointerDown(e: PointerEventData): void {
    if (this.phase === "following") {
      const { w, h } = this.getPreviewDims();
      this.anchor = { x: e.x, y: e.y };
      this.anchorCursor = { x: e.x, y: e.y };
      this.anchorW = w;
      this.anchorH = h;
      this.cursor = { x: e.x, y: e.y };
      this.phase = "anchored";
      return;
    }

    if (this.phase === "anchored" && this.anchor) {
      const { x, y, w, h } = this.getDisplayRect();
      if (w < 1 || h < 1) {
        this.onComplete();
        return;
      }

      let finalDataUrl = this.dataUrl;
      if (!this.dataUrl.startsWith("http")) {
        const temp = document.createElement("canvas");
        temp.width = Math.round(w);
        temp.height = Math.round(h);
        const img = imageCache.get(this.dataUrl);
        if (img) {
          temp.getContext("2d")!.drawImage(img, 0, 0, temp.width, temp.height);
        }
        const rendered = temp.toDataURL("image/jpeg", 0.85);
        finalDataUrl = rendered.length < this.dataUrl.length ? rendered : this.dataUrl;
      }

      const element: ImageElement = {
        id: generateId(),
        type: "image",
        owner: this.owner,
        createdAt: Date.now(),
        zIndex: 0,
        x,
        y,
        width: w,
        height: h,
        dataUrl: finalDataUrl,
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
      this.onComplete();
    }
  }

  onPointerMove(e: PointerEventData): void {
    this.cursor = { x: e.x, y: e.y };
  }

  onPointerUp(_e: PointerEventData): void {}

  getActiveElement(): ImageElement | null {
    if (this.phase === "idle") return null;
    const { x, y, w, h } = this.getDisplayRect();
    const el: ImageElement & { _preview?: string } = {
      id: "__image_preview__",
      type: "image",
      owner: this.owner,
      createdAt: Date.now(),
      zIndex: 0,
      x,
      y,
      width: w,
      height: h,
      dataUrl: this.dataUrl,
    };
    el._preview = this.phase;
    return el;
  }

  // Preview dims for following phase: natural size capped to 800×600
  private getPreviewDims(): { w: number; h: number } {
    let w = this.naturalW;
    let h = this.naturalH;
    if (w > 0 && h > 0) {
      const scale = Math.min(1, MAX_PREVIEW_W / w, MAX_PREVIEW_H / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    } else {
      w = MAX_PREVIEW_W;
      h = MAX_PREVIEW_H;
    }
    return { w, h };
  }

  private getDisplayRect(): { x: number; y: number; w: number; h: number } {
    if (this.phase === "following" || !this.anchor) {
      const { w, h } = this.getPreviewDims();
      return { x: this.cursor.x, y: this.cursor.y, w, h };
    }

    // Anchored: top-left is fixed; cursor delta from click adjusts bottom-right
    const dx = this.cursor.x - this.anchorCursor.x;
    const dy = this.cursor.y - this.anchorCursor.y;
    let w = Math.max(1, this.anchorW + dx);
    let h = Math.max(1, this.anchorH + dy);

    if (this.shiftHeld && this.naturalW > 0 && this.naturalH > 0) {
      const aspect = this.naturalW / this.naturalH;
      if (w / h > aspect) {
        h = w / aspect;
      } else {
        w = h * aspect;
      }
    }

    return { x: this.anchor.x, y: this.anchor.y, w, h };
  }
}
