import { useRef, useEffect, useCallback } from "react";
import { useBoardStore } from "../../store/board-store";
import { useDrawingStore } from "../../store/drawing-store";
import { CanvasRenderer } from "../../renderer/CanvasRenderer";
import { useCanvasSize } from "../../hooks/useCanvasSize";
import type { ToolManager } from "../../tools/ToolManager";

interface Props {
  toolManager: ToolManager;
}

export function Canvas({ toolManager }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const rafRef = useRef<number>(0);

  const size = useCanvasSize(containerRef);

  // Initialize renderer
  useEffect(() => {
    if (bgCanvasRef.current && activeCanvasRef.current) {
      rendererRef.current = new CanvasRenderer(bgCanvasRef.current, activeCanvasRef.current);
    }
  }, []);

  // Resize canvases
  useEffect(() => {
    if (rendererRef.current && size.width > 0 && size.height > 0) {
      rendererRef.current.resize(size.width, size.height);
    }
  }, [size]);

  // Animation loop: render committed elements + active element
  useEffect(() => {
    let running = true;

    const loop = () => {
      if (!running || !rendererRef.current) return;

      const elements = useBoardStore.getState().getElementsSorted();
      rendererRef.current.render(elements);

      const localActive = toolManager.getActiveElement();
      const remoteActive = Array.from(useDrawingStore.getState().remoteDrawing.values());
      rendererRef.current.renderActiveElement(localActive, remoteActive);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [toolManager]);

  // Pointer event handlers
  const getCanvasPoint = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const rect = activeCanvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const point = getCanvasPoint(e);
    toolManager.onPointerDown({ ...point, pressure: e.pressure });
    activeCanvasRef.current?.setPointerCapture(e.pointerId);
  }, [toolManager, getCanvasPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const point = getCanvasPoint(e);
    toolManager.onPointerMove({ ...point, pressure: e.pressure });
  }, [toolManager, getCanvasPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const point = getCanvasPoint(e);
    toolManager.onPointerUp({ ...point, pressure: e.pressure });
  }, [toolManager, getCanvasPoint]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <canvas
        ref={bgCanvasRef}
        style={{ position: "absolute", inset: 0 }}
      />
      <canvas
        ref={activeCanvasRef}
        style={{ position: "absolute", inset: 0, cursor: "crosshair" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
