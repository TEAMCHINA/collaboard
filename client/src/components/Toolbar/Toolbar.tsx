import { useState, useRef, useEffect } from "react";
import { useToolStore } from "../../store/tool-store";
import { useConnectionStore } from "../../store/connection-store";
import { useViewportStore } from "../../store/viewport-store";
import { ToolButton } from "./ToolButton";
import { HelpButton } from "./HelpButton";

interface Props {
  onToolChange: (tool: string) => void;
  onClear: () => void;
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

export function Toolbar({ onToolChange, onClear, displayName, onNameChange }: Props) {
  const activeTool = useToolStore((s) => s.activeTool);
  const penColor = useToolStore((s) => s.penColor);
  const penWidth = useToolStore((s) => s.penWidth);
  const setPenColor = useToolStore((s) => s.setPenColor);
  const setPenWidth = useToolStore((s) => s.setPenWidth);
  const fontSize = useToolStore((s) => s.fontSize);
  const setFontSize = useToolStore((s) => s.setFontSize);
  const textColor = useToolStore((s) => s.textColor);
  const setTextColor = useToolStore((s) => s.setTextColor);
  const recentColors = useToolStore((s) => s.recentColors);
  const addRecentColor = useToolStore((s) => s.addRecentColor);
  const connected = useConnectionStore((s) => s.connected);
  const users = useConnectionStore((s) => s.users);
  const scale = useViewportStore((s) => s.scale);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);
  const penColorRef = useRef<HTMLInputElement>(null);
  const textColorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Native "change" fires when the picker dialog closes — add to recents
  useEffect(() => {
    const input = penColorRef.current;
    if (!input) return;
    const onCommit = () => addRecentColor(input.value);
    input.addEventListener("change", onCommit);
    return () => input.removeEventListener("change", onCommit);
  }, [activeTool]);

  useEffect(() => {
    const input = textColorRef.current;
    if (!input) return;
    const onCommit = () => addRecentColor(input.value);
    input.addEventListener("change", onCommit);
    return () => input.removeEventListener("change", onCommit);
  }, [activeTool]);

  const commitName = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== displayName) {
      onNameChange(trimmed);
    } else {
      setDraft(displayName);
    }
    setEditing(false);
  };

  const handleToolSelect = (tool: string) => {
    useToolStore.getState().setActiveTool(tool);
    onToolChange(tool);
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
      <ToolButton title="Pen" active={activeTool === "pen"} onClick={() => handleToolSelect("pen")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </ToolButton>
      <ToolButton title="Text" active={activeTool === "text"} onClick={() => handleToolSelect("text")}>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>T</span>
      </ToolButton>

      {activeTool === "pen" && (
        <>
          <div style={{ width: 1, height: 24, background: "#d1d5db" }} />
          <div style={{ position: "relative" }}>
            <input
              ref={penColorRef}
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              title="Pen color"
              style={{ width: 32, height: 32, border: "none", cursor: "pointer", padding: 0, display: "block" }}
            />
            {recentColors.length > 0 && (
              <div style={recentPanelStyle}>
                {recentColors.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => { setPenColor(c); addRecentColor(c); }}
                    style={recentSwatchStyle(c, c === penColor)}
                  />
                ))}
              </div>
            )}
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={penWidth}
            onChange={(e) => setPenWidth(Number(e.target.value))}
            title={`Width: ${penWidth}`}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 12, color: "#666", minWidth: 20 }}>{penWidth}px</span>
        </>
      )}

      {activeTool === "text" && (
        <>
          <div style={{ width: 1, height: 24, background: "#d1d5db" }} />
          <div style={{ position: "relative" }}>
            <input
              ref={textColorRef}
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              title="Text color"
              style={{ width: 32, height: 32, border: "none", cursor: "pointer", padding: 0, display: "block" }}
            />
            {recentColors.length > 0 && (
              <div style={recentPanelStyle}>
                {recentColors.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => { setTextColor(c); addRecentColor(c); }}
                    style={recentSwatchStyle(c, c === textColor)}
                  />
                ))}
              </div>
            )}
          </div>
          <input
            type="range"
            min={12}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            title={`Font size: ${fontSize}`}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 12, color: "#666", minWidth: 28 }}>{fontSize}px</span>
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
