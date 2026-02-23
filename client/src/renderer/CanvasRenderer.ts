import type { BoardElement } from "shared";
import type { IRenderer } from "./Renderer";
import { getRenderer } from "./element-renderers";
import "./element-renderers/stroke-renderer";
import "./element-renderers/text-renderer";

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

  render(elements: BoardElement[]): void {
    this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    for (const el of elements) {
      const renderFn = getRenderer(el.type);
      if (renderFn) {
        renderFn(this.bgCtx, el);
      }
    }
  }

  renderActiveElement(localElement: BoardElement | null, remoteElements: BoardElement[] = []): void {
    this.activeCtx.clearRect(0, 0, this.activeCanvas.width, this.activeCanvas.height);
    for (const el of remoteElements) {
      const renderFn = getRenderer(el.type);
      if (renderFn) {
        renderFn(this.activeCtx, el);
      }
    }
    if (localElement) {
      const renderFn = getRenderer(localElement.type);
      if (renderFn) {
        renderFn(this.activeCtx, localElement);
      }
    }
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
