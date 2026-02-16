import { useRef, useEffect, useMemo } from "react";
import type { Operation, BoardElement } from "shared";
import { socket } from "../socket/socket-client";
import { useToolStore } from "../store/tool-store";
import { ToolManager } from "../tools/ToolManager";
import { PenTool } from "../tools/PenTool";

export function useBoard(token: string, displayName: string) {
  const toolManagerRef = useRef<ToolManager | null>(null);

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
    tm.setActiveTool("pen");

    toolManagerRef.current = tm;
    return tm;
  }, [token, displayName]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        socket.emit("board:undo");
        return;
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
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

  const handleToolChange = (toolName: string) => {
    toolManager.setActiveTool(toolName);
  };

  return { toolManager, handleToolChange };
}
