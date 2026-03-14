import { create } from "zustand";
import { useSyncExternalStore } from "react";
import type { FC } from "react";
import type { TextElement } from "shared";
import type { ITool, PointerEventData, ToolOption } from "./Tool";
import { theme } from "../styles/theme";

export interface TextToolOption extends ToolOption {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const textStore = create<TextToolOption>(() => ({ size: 24, color: "#000000", bold: false, italic: false, underline: false }));

const TextIcon: FC = () => (
  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>T</span>
);

function StyleToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? theme.borderControl : "transparent",
        border: "1px solid",
        borderColor: active ? theme.textMuted : theme.borderControl,
        borderRadius: 4,
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

const TextControls: FC = () => {
  const { bold, italic, underline } = useSyncExternalStore(
    (cb) => textStore.subscribe(cb),
    () => textStore.getState(),
  );
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <StyleToggleBtn active={bold} onClick={() => textStore.setState({ bold: !bold })}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M3 2h4.5a3 3 0 0 1 0 6H3V2zm0 6h5a3 3 0 0 1 0 6H3V8z" />
        </svg>
      </StyleToggleBtn>
      <StyleToggleBtn active={italic} onClick={() => textStore.setState({ italic: !italic })}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M6 2h5v2H9.3L7.2 10H9v2H4v-2h1.7L7.8 4H6V2z" />
        </svg>
      </StyleToggleBtn>
      <StyleToggleBtn active={underline} onClick={() => textStore.setState({ underline: !underline })}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M3 2h2v5a2 2 0 0 0 4 0V2h2v5a4 4 0 0 1-8 0V2zM2 12h10v2H2v-2z" />
        </svg>
      </StyleToggleBtn>
    </div>
  );
};

export function useTextOptions(): TextToolOption {
  return useSyncExternalStore(
    (cb) => textStore.subscribe(cb),
    () => textStore.getState(),
  );
}

export interface TextPlacement {
  id: string;
  x: number;       // world
  y: number;       // world
  screenX: number;
  screenY: number;
}

export class TextTool implements ITool {
  name = "text";
  label = "Text";
  icon = TextIcon;
  controls = TextControls;
  keybinds = ["t", "T"];
  sizeConfig = { min: 12, max: 72 };
  hasColor = true;
  selectTool: () => void = () => {};

  private onClick: (x: number, y: number) => void;

  constructor(onClick: (x: number, y: number) => void) {
    this.onClick = onClick;
  }

  setSize(n: number) { textStore.setState({ size: n }); }
  setColor(c: string) { textStore.setState({ color: c }); }
  getOptions() { return textStore.getState(); }
  subscribeOptions(cb: () => void) { return textStore.subscribe(cb); }
  getStyle() { const { bold, italic, underline } = textStore.getState(); return { bold, italic, underline }; }

  onPointerDown(e: PointerEventData): void {
    this.onClick(e.x, e.y);
  }

  onPointerMove(_e: PointerEventData): void {}
  onPointerUp(_e: PointerEventData): void {}

  getActiveElement(): TextElement | null {
    return null;
  }

  activate(): void {}
  deactivate(): void {}
}
