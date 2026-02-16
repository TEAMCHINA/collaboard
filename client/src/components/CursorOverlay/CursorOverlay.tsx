import { useCursorStore } from "../../store/cursor-store";

export function CursorOverlay() {
  const cursors = useCursorStore((s) => s.cursors);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1000,
    }}>
      {Array.from(cursors.entries()).map(([name, { x, y, color }]) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: "translate(-2px, -2px)",
            transition: "left 50ms linear, top 50ms linear",
          }}
        >
          {/* Cursor arrow */}
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path
              d="M0 0L16 12L8 12L6 20L0 0Z"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          {/* Name label */}
          <span style={{
            position: "absolute",
            left: 14,
            top: 12,
            background: color,
            color: "white",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}
