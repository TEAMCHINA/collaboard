import type { TextElement } from "shared";
import { registerRenderer } from "./index";

function renderText(ctx: CanvasRenderingContext2D, element: TextElement): void {
  const { x, y, content, fontSize, fontFamily, color, bold, italic, underline } = element;
  if (!content) return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";
  ctx.fillText(content, x, y);

  if (underline) {
    const w = ctx.measureText(content).width;
    const lineY = y + fontSize + 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, fontSize / 16);
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + w, lineY);
    ctx.stroke();
  }

  ctx.restore();
}

registerRenderer("text", (ctx, el) => renderText(ctx, el as TextElement));
