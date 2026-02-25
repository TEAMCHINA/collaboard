import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import type { Operation, BoardElement, TextElement, AddElementOp } from "shared";
import { generateId } from "shared";
import { socket } from "../socket/socket-client";
import { useToolStore } from "../store/tool-store";
import { useViewportStore } from "../store/viewport-store";
import { ToolManager } from "../tools/ToolManager";
import { PenTool } from "../tools/PenTool";
import { TextTool, type TextPlacement } from "../tools/TextTool";

export function useBoard(token: string, displayName: string) {
  const [textPlacement, setTextPlacement] = useState<TextPlacement | null>(null);
  const placementRef = useRef<TextPlacement | null>(null);

  const toolManager = useMemo(() => {
    const tm = new ToolManager();

    const commitOp = (op: Operation) => {
      socket.emit("board:operation", op);
    };

    const emitDrawing = (element: BoardElement | null) => {
      socket.emit("board:drawing", element);
    };

    const pen = new PenTool(displayName, token, commitOp, emitDrawing);
    tm.register(pen);

    const text = new TextTool((x: number, y: number) => {
      // If there's an active text input, let blur handle commit — don't overwrite
      if (placementRef.current) return;
      const { panX, panY, scale } = useViewportStore.getState();
      const placement: TextPlacement = {
        id: generateId(),
        x,
        y,
        screenX: x * scale + panX,
        screenY: y * scale + panY,
      };
      placementRef.current = placement;
      setTextPlacement(placement);
    });
    tm.register(text);

    tm.setActiveTool("pen");
    return tm;
  }, [token, displayName]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        socket.emit("board:undo");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || e.key === "y")) {
        e.preventDefault();
        socket.emit("board:redo");
        return;
      }
      toolManager.onKeyDown(e);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toolManager]);

  const handleToolChange = useCallback((toolName: string) => {
    // Cancel any open text input when switching tools
    placementRef.current = null;
    setTextPlacement(null);
    toolManager.setActiveTool(toolName);
  }, [toolManager]);

  const commitText = useCallback((content: string) => {
    const placement = placementRef.current;
    if (!placement) return;

    // Clear immediately so blur can't double-fire
    placementRef.current = null;
    setTextPlacement(null);
    socket.emit("board:drawing", null);

    if (!content.trim()) return;

    const { fontSize, fontFamily, textColor } = useToolStore.getState();
    const element: TextElement = {
      id: placement.id,
      type: "text",
      owner: displayName,
      createdAt: Date.now(),
      zIndex: 0,
      x: placement.x,
      y: placement.y,
      content: content.trim(),
      fontSize,
      fontFamily,
      color: textColor,
    };

    const op: AddElementOp = {
      id: generateId(),
      type: "addElement",
      boardToken: token,
      owner: displayName,
      timestamp: Date.now(),
      seqNum: 0,
      element,
    };

    socket.emit("board:operation", op);
  }, [token, displayName]);

  const cancelText = useCallback(() => {
    placementRef.current = null;
    setTextPlacement(null);
    socket.emit("board:drawing", null);
  }, []);

  const onTextChange = useCallback((content: string) => {
    const placement = placementRef.current;
    if (!placement) return;

    const { fontSize, fontFamily, textColor } = useToolStore.getState();
    const element: TextElement = {
      id: placement.id,
      type: "text",
      owner: displayName,
      createdAt: Date.now(),
      zIndex: 0,
      x: placement.x,
      y: placement.y,
      content,
      fontSize,
      fontFamily,
      color: textColor,
    };
    socket.emit("board:drawing", element);
  }, [displayName]);

  return { toolManager, handleToolChange, textPlacement, commitText, cancelText, onTextChange };
}
