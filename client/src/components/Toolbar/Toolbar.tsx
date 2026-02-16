import { useToolStore } from "../../store/tool-store";
import { useConnectionStore } from "../../store/connection-store";
import { ToolButton } from "./ToolButton";

interface Props {
  onToolChange: (tool: string) => void;
}

export function Toolbar({ onToolChange }: Props) {
  const activeTool = useToolStore((s) => s.activeTool);
  const penColor = useToolStore((s) => s.penColor);
  const penWidth = useToolStore((s) => s.penWidth);
  const setPenColor = useToolStore((s) => s.setPenColor);
  const setPenWidth = useToolStore((s) => s.setPenWidth);
  const fontSize = useToolStore((s) => s.fontSize);
  const setFontSize = useToolStore((s) => s.setFontSize);
  const textColor = useToolStore((s) => s.textColor);
  const setTextColor = useToolStore((s) => s.setTextColor);
  const connected = useConnectionStore((s) => s.connected);
  const users = useConnectionStore((s) => s.users);

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
      <ToolButton label="Pen" active={activeTool === "pen"} onClick={() => handleToolSelect("pen")} />
      <ToolButton label="Text" active={activeTool === "text"} onClick={() => handleToolSelect("text")} />

      {activeTool === "pen" && (
        <>
          <div style={{ width: 1, height: 24, background: "#d1d5db" }} />
          <input
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            title="Pen color"
            style={{ width: 32, height: 32, border: "none", cursor: "pointer", padding: 0 }}
          />
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
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            title="Text color"
            style={{ width: 32, height: 32, border: "none", cursor: "pointer", padding: 0 }}
          />
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

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: 12,
          color: connected ? "#16a34a" : "#dc2626",
          display: "flex",
          alignItems: "center",
          gap: 4,
          position: "relative",
          cursor: "default",
        }}
        title={users.map((u) => u.displayName).join("\n")}
      >
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: connected ? "#16a34a" : "#dc2626",
          display: "inline-block",
        }} />
        {users.length} online
      </span>
    </div>
  );
}
