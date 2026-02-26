import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { useToolStore } from "../../store/tool-store";
import { useConnectionStore } from "../../store/connection-store";
import { useViewportStore } from "../../store/viewport-store";
import { ToolButton } from "./ToolButton";
import { HelpButton } from "./HelpButton";
import type { ToolManager } from "../../tools/ToolManager";

interface Props {
  toolManager: ToolManager;
  onClear: () => void;
  onDownload: () => void;
  displayName: string;
  onNameChange: (name: string) => void;
}

const recentSwatchStyle = (color: string, active: boolean): React.CSSProperties => ({
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: color,
  border: "none",
  outline: active ? "2px solid #374151" : "1px solid #d1d5db",
  outlineOffset: "1px",
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
});

const recentPanelStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: "5px 6px",
  display: "flex",
  gap: 4,
  zIndex: 50,
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

export function Toolbar({ toolManager, onClear, onDownload, displayName, onNameChange }: Props) {
  const activeToolName = useToolStore((s) => s.activeTool);
  const recentColors = useToolStore((s) => s.recentColors);
  const addRecentColor = useToolStore((s) => s.addRecentColor);
  const connected = useConnectionStore((s) => s.connected);
  const users = useConnectionStore((s) => s.users);
  const scale = useViewportStore((s) => s.scale);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const activeTool = toolManager.getActiveTool();
  const activeOptions = useSyncExternalStore(
    useCallback(
      (notify) => activeTool?.subscribeOptions(notify) ?? (() => {}),
      [activeTool],
    ),
    () => activeTool?.getOptions() ?? { size: 0, color: "#000000" },
  );

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Native "change" fires when the picker dialog closes — add to recents
  useEffect(() => {
    const input = colorInputRef.current;
    if (!input) return;
    const onCommit = () => addRecentColor(input.value);
    input.addEventListener("change", onCommit);
    return () => input.removeEventListener("change", onCommit);
  }, [activeToolName, addRecentColor]);

  const commitName = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== displayName) {
      onNameChange(trimmed);
    } else {
      setDraft(displayName);
    }
    setEditing(false);
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 16px",
      background: "#f9fafb",
      borderBottom: "1px solid #e5e7eb",
      flexShrink: 0,
    }}>
      {toolManager.getTools().map(tool => (
        <ToolButton
          key={tool.name}
          title={tool.label}
          active={tool.name === activeToolName}
          onClick={() => tool.selectTool()}
        >
          <tool.icon />
        </ToolButton>
      ))}

      {activeTool?.hasColor && (
        <>
          <div style={{ width: 1, height: 24, background: "#d1d5db" }} />
          <div style={{ position: "relative" }}>
            <input
              ref={colorInputRef}
              type="color"
              value={activeOptions.color}
              onChange={(e) => activeTool.setColor(e.target.value)}
              title="Color"
              style={{ width: 32, height: 32, border: "none", cursor: "pointer", padding: 0, display: "block" }}
            />
            {recentColors.length > 0 && (
              <div style={recentPanelStyle}>
                {recentColors.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => { activeTool.setColor(c); addRecentColor(c); }}
                    style={recentSwatchStyle(c, c === activeOptions.color)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTool?.sizeConfig && (
        <>
          <input
            type="range"
            min={activeTool.sizeConfig.min}
            max={activeTool.sizeConfig.max}
            value={activeOptions.size}
            onChange={(e) => activeTool.setSize(Number(e.target.value))}
            title={`Size: ${activeOptions.size}`}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 12, color: "#666", minWidth: 28 }}>{activeOptions.size}px</span>
        </>
      )}

      <div style={{ width: 1, height: 24, background: "#d1d5db" }} />
      <button
        onClick={onClear}
        title="Clear all elements"
        style={{
          padding: "4px 10px",
          fontSize: 13,
          background: "transparent",
          border: "1px solid #d1d5db",
          borderRadius: 4,
          cursor: "pointer",
          color: "#dc2626",
        }}
      >
        Clear
      </button>

      <div style={{ flex: 1 }} />

      {/* Zoom controls */}
      <span style={{ fontSize: 12, color: "#374151", minWidth: 40, textAlign: "right" }}>
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={() => useViewportStore.getState().reset()}
        title="Reset view (100%, centered)"
        style={{
          padding: "4px 8px",
          fontSize: 12,
          background: "transparent",
          border: "1px solid #d1d5db",
          borderRadius: 4,
          cursor: "pointer",
          color: "#374151",
        }}
      >
        Reset View
      </button>
      <button
        onClick={onDownload}
        title="Download as JPG"
        style={{
          padding: "4px 8px",
          fontSize: 12,
          background: "transparent",
          border: "1px solid #d1d5db",
          borderRadius: 4,
          cursor: "pointer",
          color: "#374151",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v8" />
          <path d="M5 7l3 3 3-3" />
          <path d="M3 13h10" />
        </svg>
      </button>
      <div style={{ width: 1, height: 24, background: "#d1d5db" }} />

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitName();
            if (e.key === "Escape") { setDraft(displayName); setEditing(false); }
          }}
          onBlur={commitName}
          style={{
            fontSize: 13,
            padding: "2px 6px",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            outline: "none",
            width: 120,
          }}
        />
      ) : (
        <span
          onClick={() => { setDraft(displayName); setEditing(true); }}
          style={{
            fontSize: 13,
            color: "#374151",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid transparent",
          }}
          title="Click to change your name"
        >
          {displayName}
        </span>
      )}

      <div style={{ width: 1, height: 24, background: "#d1d5db" }} />

      <HelpButton />

      <div style={{ width: 1, height: 24, background: "#d1d5db" }} />

      <span
        style={{
          fontSize: 12,
          color: connected ? "#16a34a" : "#dc2626",
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: "default",
        }}
        title={connected ? users.map((u) => u.displayName).join("\n") : ""}
      >
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: connected ? "#16a34a" : "#dc2626",
          display: "inline-block",
        }} />
        {connected ? `${users.length} online` : "Offline"}
      </span>
    </div>
  );
}
