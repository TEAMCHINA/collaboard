import { useRef, useEffect, useCallback } from "react";
import { useBoardStore } from "../../store/board-store";
import { useDrawingStore } from "../../store/drawing-store";
import { useViewportStore } from "../../store/viewport-store";
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

  // Pan/zoom gesture state (refs — no re-renders needed)
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const isPanning = useRef(false);
  const panOrigin = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const spaceHeld = useRef(false);
  const cursorRef = useRef<"crosshair" | "grab">("crosshair");

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

      const vp = useViewportStore.getState();
      const elements = useBoardStore.getState().getElementsSorted();
      rendererRef.current.render(elements, vp);

      const localActive = toolManager.getActiveElement();
      const remoteActive = Array.from(useDrawingStore.getState().remoteDrawing.values());
      rendererRef.current.renderActiveElement(localActive, remoteActive, vp);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [toolManager]);

  // Wheel → zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      useViewportStore.getState().zoom(factor, cx, cy);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // Space key → pan cursor
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const el = document.activeElement as HTMLInputElement;
        const tag = el?.tagName;
        // Don't intercept space when the user is typing in a text field
        if (tag === "TEXTAREA") return;
        if (tag === "INPUT" && el.type !== "color" && el.type !== "range") return;
        // For non-text inputs (color picker, range slider), prevent their default
        // space behavior and remove focus so pan takes over cleanly
        e.preventDefault();
        if (tag === "INPUT") el.blur();
        spaceHeld.current = true;
        if (activeCanvasRef.current) {
          activeCanvasRef.current.style.cursor = "grab";
          cursorRef.current = "grab";
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeld.current = false;
        if (!isPanning.current && activeCanvasRef.current) {
          activeCanvasRef.current.style.cursor = "crosshair";
          cursorRef.current = "crosshair";
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Coordinate conversion: screen → world
  const getCanvasPoint = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const rect = activeCanvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const { panX, panY, scale } = useViewportStore.getState();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return { x: (screenX - panX) / scale, y: (screenY - panY) / scale };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = activeCanvasRef.current?.getBoundingClientRect();
    const cx = rect ? e.clientX - rect.left : e.clientX;
    const cy = rect ? e.clientY - rect.top : e.clientY;

    activePointers.current.set(e.pointerId, { x: cx, y: cy });

    // Middle mouse button or space+drag → start pan
    if (e.button === 1 || spaceHeld.current) {
      e.preventDefault();
      isPanning.current = true;
      const { panX, panY } = useViewportStore.getState();
      panOrigin.current = { clientX: e.clientX, clientY: e.clientY, panX, panY };
      if (activeCanvasRef.current) activeCanvasRef.current.style.cursor = "grabbing";
      activeCanvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    // Two-finger gesture already active — don't pass to tool
    if (activePointers.current.size >= 2) return;

    const point = getCanvasPoint(e);
    toolManager.onPointerDown({ ...point, pressure: e.pressure });
    activeCanvasRef.current?.setPointerCapture(e.pointerId);
  }, [toolManager, getCanvasPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = activeCanvasRef.current?.getBoundingClientRect();
    const cx = rect ? e.clientX - rect.left : e.clientX;
    const cy = rect ? e.clientY - rect.top : e.clientY;

    activePointers.current.set(e.pointerId, { x: cx, y: cy });

    // Pan gesture
    if (isPanning.current) {
      const { panX: originPanX, panY: originPanY, clientX: originClientX, clientY: originClientY } = panOrigin.current;
      const dx = e.clientX - originClientX;
      const dy = e.clientY - originClientY;
      useViewportStore.setState({ panX: originPanX + dx, panY: originPanY + dy });
      return;
    }

    // Two-finger pinch/pan
    if (activePointers.current.size === 2) {
      const [p1, p2] = Array.from(activePointers.current.values());
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (lastPinchDist.current !== null && lastPinchCenter.current !== null) {
        const dMidX = midX - lastPinchCenter.current.x;
        const dMidY = midY - lastPinchCenter.current.y;
        useViewportStore.getState().pan(dMidX, dMidY);

        if (dist > 0 && lastPinchDist.current > 0) {
          const factor = dist / lastPinchDist.current;
          useViewportStore.getState().zoom(factor, midX, midY);
        }
      }

      lastPinchDist.current = dist;
      lastPinchCenter.current = { x: midX, y: midY };
      return;
    }

    const point = getCanvasPoint(e);
    toolManager.onPointerMove({ ...point, pressure: e.pressure });
  }, [toolManager, getCanvasPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (isPanning.current && activePointers.current.size === 0) {
      isPanning.current = false;
      if (activeCanvasRef.current) {
        activeCanvasRef.current.style.cursor = spaceHeld.current ? "grab" : "crosshair";
      }
      return;
    }

    // Reset pinch state when fingers lift
    if (activePointers.current.size < 2) {
      lastPinchDist.current = null;
      lastPinchCenter.current = null;
    }

    if (activePointers.current.size >= 1) return;

    const point = getCanvasPoint(e);
    toolManager.onPointerUp({ ...point, pressure: e.pressure });
  }, [toolManager, getCanvasPoint]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, overflow: "hidden", touchAction: "none" }}
    >
      <canvas
        ref={bgCanvasRef}
        style={{ position: "absolute", inset: 0 }}
      />
      <canvas
        ref={activeCanvasRef}
        style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseDown={(e) => e.preventDefault()}
      />
    </div>
  );
}
