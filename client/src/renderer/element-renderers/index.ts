import type { BoardElement } from "shared";
import { renderStroke } from "./stroke-renderer";
import { renderText } from "./text-renderer";

export type RenderFn = (ctx: CanvasRenderingContext2D, element: BoardElement) => void;

const registry = new Map<string, RenderFn>();

registry.set("stroke", (ctx, el) => renderStroke(ctx, el as any));
registry.set("text", (ctx, el) => renderText(ctx, el as any));

export function getRenderer(type: string): RenderFn | undefined {
  return registry.get(type);
}

export function registerRenderer(type: string, fn: RenderFn): void {
  registry.set(type, fn);
}
