import type { BoardElement } from "shared";

export type RenderFn = (ctx: CanvasRenderingContext2D, element: BoardElement) => void;

const registry = new Map<string, RenderFn>();

export function registerRenderer(type: string, fn: RenderFn): void {
  registry.set(type, fn);
}

export function getRenderer(type: string): RenderFn | undefined {
  return registry.get(type);
}
