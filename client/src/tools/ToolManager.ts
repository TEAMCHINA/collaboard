import type { ITool, PointerEventData } from "./Tool";
import type { BoardElement } from "shared";

export class ToolManager {
  private tools = new Map<string, ITool>();
  private activeTool: ITool | null = null;

  register(tool: ITool): void {
    this.tools.set(tool.name, tool);
  }

  setActiveTool(name: string): void {
    if (this.activeTool) {
      this.activeTool.deactivate();
    }
    const tool = this.tools.get(name);
    if (tool) {
      this.activeTool = tool;
      tool.activate();
    }
  }

  onPointerDown(e: PointerEventData): void {
    this.activeTool?.onPointerDown(e);
  }

  onPointerMove(e: PointerEventData): void {
    this.activeTool?.onPointerMove(e);
  }

  onPointerUp(e: PointerEventData): void {
    this.activeTool?.onPointerUp(e);
  }

  onKeyDown(e: KeyboardEvent): void {
    this.activeTool?.onKeyDown?.(e);
  }

  getActiveElement(): BoardElement | null {
    return this.activeTool?.getActiveElement() ?? null;
  }

  getActiveTool(): ITool | null {
    return this.activeTool;
  }
}
