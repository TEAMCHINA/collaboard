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

  const { toolManager, textTool } = useMemo(() => {
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
    return { toolManager: tm, textTool: text };
  }, [token, displayName]);

  useEffect(() => {
    toolManager.setOnActivate((name) => {
      placementRef.current = null;
      setTextPlacement(null);
      useToolStore.getState().setActiveTool(name);
    });
  }, [toolManager]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't steal keys when typing in an input
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

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
      if (!inInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        for (const tool of toolManager.getTools()) {
          if (tool.keybinds.includes(e.key)) {
            tool.selectTool();
            return;
          }
        }
        if (e.key === "[" || e.key === "]") {
          const tool = toolManager.getActiveTool();
          if (!tool?.sizeConfig) return;
          const { size } = tool.getOptions();
          const delta = e.key === "[" ? -1 : 1;
          const newSize = Math.max(tool.sizeConfig.min, Math.min(tool.sizeConfig.max, size + delta));
          tool.setSize(newSize);
          return;
        }
      }
      toolManager.onKeyDown(e);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toolManager]);

  const commitText = useCallback((content: string) => {
    const placement = placementRef.current;
    if (!placement) return;

    // Clear immediately so blur can't double-fire
    placementRef.current = null;
    setTextPlacement(null);
    socket.emit("board:drawing", null);

    if (!content.trim()) return;

    const { size: fontSize, color: textColor } = textTool.getOptions();
    const { fontFamily } = useToolStore.getState();
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
  }, [token, displayName, textTool]);

  const cancelText = useCallback(() => {
    placementRef.current = null;
    setTextPlacement(null);
    socket.emit("board:drawing", null);
  }, []);

  const onTextChange = useCallback((content: string) => {
    const placement = placementRef.current;
    if (!placement) return;

    const { size: fontSize, color: textColor } = textTool.getOptions();
    const { fontFamily } = useToolStore.getState();
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
  }, [displayName, textTool]);

  return { toolManager, textPlacement, commitText, cancelText, onTextChange };
}
