import type { BoardElement } from "shared";

export interface IRenderer {
  render(elements: BoardElement[]): void;
  renderActiveElement(localElement: BoardElement | null, remoteElements?: BoardElement[]): void;
  clear(): void;
  resize(width: number, height: number): void;
  getBackgroundCanvas(): HTMLCanvasElement;
  getActiveCanvas(): HTMLCanvasElement;
}
