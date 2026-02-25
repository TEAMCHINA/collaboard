import type { BoardElement } from "shared";
import type { IRenderer } from "./Renderer";
import { getRenderer } from "./element-renderers";
import "./element-renderers/stroke-renderer";
import "./element-renderers/text-renderer";

export interface Viewport {
  panX: number;
  panY: number;
  scale: number;
}

const IDENTITY: Viewport = { panX: 0, panY: 0, scale: 1 };

export class CanvasRenderer implements IRenderer {
  private bgCanvas: HTMLCanvasElement;
  private activeCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContext2D;
  private activeCtx: CanvasRenderingContext2D;

  constructor(bgCanvas: HTMLCanvasElement, activeCanvas: HTMLCanvasElement) {
    this.bgCanvas = bgCanvas;
    this.activeCanvas = activeCanvas;
    this.bgCtx = bgCanvas.getContext("2d")!;
    this.activeCtx = activeCanvas.getContext("2d")!;
  }

  render(elements: BoardElement[], viewport: Viewport = IDENTITY): void {
    const ctx = this.bgCtx;
    ctx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.scale, viewport.scale);
    for (const el of elements) {
      const renderFn = getRenderer(el.type);
      if (renderFn) {
        renderFn(ctx, el);
      }
    }
    ctx.restore();
  }

  renderActiveElement(localElement: BoardElement | null, remoteElements: BoardElement[] = [], viewport: Viewport = IDENTITY): void {
    const ctx = this.activeCtx;
    ctx.clearRect(0, 0, this.activeCanvas.width, this.activeCanvas.height);
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.scale, viewport.scale);
    for (const el of remoteElements) {
      const renderFn = getRenderer(el.type);
      if (renderFn) {
        renderFn(ctx, el);
      }
    }
    if (localElement) {
      const renderFn = getRenderer(localElement.type);
      if (renderFn) {
        renderFn(ctx, localElement);
      }
    }
    ctx.restore();
  }

  clear(): void {
    this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    this.activeCtx.clearRect(0, 0, this.activeCanvas.width, this.activeCanvas.height);
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    for (const canvas of [this.bgCanvas, this.activeCanvas]) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
    }
  }

  getBackgroundCanvas(): HTMLCanvasElement {
    return this.bgCanvas;
  }

  getActiveCanvas(): HTMLCanvasElement {
    return this.activeCanvas;
  }
}
