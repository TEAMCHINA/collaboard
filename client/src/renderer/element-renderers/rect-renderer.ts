import type { RectElement } from "shared";
import { registerRenderer } from "./index";

function renderRect(ctx: CanvasRenderingContext2D, element: RectElement): void {
  const { x, y, width, height, color, strokeWidth } = element;
  const preview = (element as any)._preview as true | undefined;

  ctx.save();
  ctx.lineJoin = "miter";

  if (preview) {
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    const s = 8;
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x + width - s / 2, y + height - s / 2, s, s);
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(x, y, width, height);
  }

  ctx.restore();
}

registerRenderer("rect", (ctx, el) => renderRect(ctx, el as RectElement));
