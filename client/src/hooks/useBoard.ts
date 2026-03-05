import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import type { Operation, BoardElement, TextElement, AddElementOp } from "shared";
import { generateId } from "shared";
import { socket } from "../socket/socket-client";
import { useToolStore } from "../store/tool-store";
import { useViewportStore } from "../store/viewport-store";
import { useErrorStore } from "../store/error-store";
import { ToolManager } from "../tools/ToolManager";
import { PenTool } from "../tools/PenTool";
import { TextTool, type TextPlacement } from "../tools/TextTool";
import { ImageTool } from "../tools/ImageTool";

const SOFT_LIMIT = 1_000_000;
const HARD_LIMIT = 5_000_000;

async function compressImage(dataUrl: string): Promise<string> {
  let cur = dataUrl;
  const img = await new Promise<HTMLImageElement>((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = dataUrl;
  });
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  for (let n = 0; n < 8 && cur.length > SOFT_LIMIT && w > 100 && h > 100; n++) {
    w = Math.round(w * 0.75);
    h = Math.round(h * 0.75);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    cur = c.toDataURL("image/jpeg", 0.85);
  }
  return cur;
}

export function useBoard(token: string, displayName: string) {
  const [textPlacement, setTextPlacement] = useState<TextPlacement | null>(null);
  const placementRef = useRef<TextPlacement | null>(null);
  const previousToolRef = useRef("pen");

  const { toolManager, textTool, imgTool } = useMemo(() => {
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

    const img = new ImageTool(displayName, token, commitOp, () => {
      tm.setActiveTool(previousToolRef.current);
    });
    tm.register(img);

    tm.setActiveTool("pen");
    return { toolManager: tm, textTool: text, imgTool: img };
  }, [token, displayName]);

  useEffect(() => {
    toolManager.setOnActivate((name) => {
      if (name !== "image") previousToolRef.current = name;
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

  // Paste handler: binary images and image URLs
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const imgItem = Array.from(e.clipboardData?.items ?? []).find(
        (i) => i.type.startsWith("image/"),
      );
      if (imgItem) {
        e.preventDefault();
        const file = imgItem.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const raw = ev.target?.result as string;
          if (raw.length > HARD_LIMIT) {
            useErrorStore.getState().setError("Image is too large to paste (max ~3.7 MB).");
            return;
          }
          const dataUrl = raw.length > SOFT_LIMIT ? await compressImage(raw) : raw;
          const probe = new Image();
          probe.onload = () => {
            imgTool.setPendingImage(dataUrl, probe.naturalWidth, probe.naturalHeight);
            imgTool.selectTool();
          };
          probe.src = dataUrl;
        };
        reader.readAsDataURL(file);
        return;
      }

      const textItem = Array.from(e.clipboardData?.items ?? []).find(
        (i) => i.type === "text/plain",
      );
      if (textItem) {
        textItem.getAsString((text) => {
          const url = text.trim();
          if (!/^https?:\/\//i.test(url)) return;
          const probe = new Image();
          probe.crossOrigin = "anonymous";
          probe.onload = () => {
            if (probe.naturalWidth > 0) {
              imgTool.setPendingImage(url, probe.naturalWidth, probe.naturalHeight);
              imgTool.selectTool();
            }
          };
          probe.src = url;
        });
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [imgTool]);

  return { toolManager, textPlacement, commitText, cancelText, onTextChange };
}
