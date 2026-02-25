import { useState } from "react";

const SHORTCUTS: { group: string; rows: { keys: string[]; label: string }[] }[] = [
  {
    group: "History",
    rows: [
      { keys: ["Ctrl", "Z"],           label: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"],  label: "Redo" },
    ],
  },
  {
    group: "Navigation",
    rows: [
      { keys: ["Mouse Wheel"],              label: "Zoom in / out" },
      { keys: ["Space", "drag"],       label: "Pan canvas" },
      { keys: ["Middle", "drag"],      label: "Pan canvas" },
      { keys: ["Pinch"],               label: "Zoom (touch)" },
      { keys: ["Two-finger", "drag"],  label: "Pan (touch)" },
    ],
  },
  {
    group: "Text tool",
    rows: [
      { keys: ["Enter"],               label: "Commit text" },
      { keys: ["Esc"],                 label: "Cancel text" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 5px",
      background: "#f3f4f6",
      border: "1px solid #d1d5db",
      borderBottomWidth: 2,
      borderRadius: 4,
      fontSize: 11,
      fontFamily: "system-ui, sans-serif",
      fontWeight: 500,
      color: "#374151",
      lineHeight: 1.5,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* ? icon */}
      <div style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: "1.5px solid #9ca3af",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
        color: "#6b7280",
        fontSize: 13,
        fontWeight: 700,
        userSelect: "none",
        flexShrink: 0,
      }}>
        ?
      </div>

      {/* Shortcut panel */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          width: 260,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          padding: "12px 14px",
          zIndex: 2000,
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute",
            top: -6,
            right: 8,
            width: 10,
            height: 10,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderBottom: "none",
            borderRight: "none",
            transform: "rotate(45deg)",
          }} />

          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
            Keyboard shortcuts
          </div>

          {SHORTCUTS.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: gi < SHORTCUTS.length - 1 ? 10 : 0 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#9ca3af",
                marginBottom: 5,
              }}>
                {group.group}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {group.rows.map((row) => (
                  <div key={row.label} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                      {row.keys.map((k, i) => (
                        <span key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          {i > 0 && <span style={{ color: "#9ca3af", fontSize: 10 }}>+</span>}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: "#4b5563" }}>{row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
