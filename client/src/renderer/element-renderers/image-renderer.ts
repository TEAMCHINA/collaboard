import type { ImageElement } from "shared";
import { registerRenderer } from "./index";

export const imageCache = new Map<string, HTMLImageElement>();

function getOrLoad(dataUrl: string): HTMLImageElement {
  if (!imageCache.has(dataUrl)) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
    imageCache.set(dataUrl, img);
  }
  return imageCache.get(dataUrl)!;
}

function renderImage(ctx: CanvasRenderingContext2D, element: ImageElement): void {
  const img = getOrLoad(element.dataUrl);
  const { x, y, width, height } = element;
  ctx.save();
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, width, height);
  } else {
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(x, y, width, height);
  }
  const preview = (element as any)._preview;
  if (preview) {
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    if (preview === "anchored") {
      const s = 8;
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(x + width - s / 2, y + height - s / 2, s, s);
    }
  }
  ctx.restore();
}

registerRenderer("image", (ctx, el) => renderImage(ctx, el as ImageElement));
