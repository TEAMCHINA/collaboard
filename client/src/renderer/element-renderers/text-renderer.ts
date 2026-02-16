import type { TextElement } from "shared";

export function renderText(ctx: CanvasRenderingContext2D, element: TextElement): void {
  const { x, y, content, fontSize, fontFamily, color } = element;
  if (!content) return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";
  ctx.fillText(content, x, y);
  ctx.restore();
}
