import { useState, useRef, useEffect } from "react";
import { useCommits } from "../../hooks/useCommits";

const SEE_ALL_URL = "https://github.com/teamchina/collaboard/commits/main";
const TAB_LABEL = "NEWS";

export function NewsTab() {
  const { commits, hasNew, markSeen } = useCommits();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const toggle = () => {
    if (!open) markSeen();
    setOpen((v) => !v);
  };

  return (
    <div ref={containerRef} style={{ position: "fixed", bottom: 0, right: 24, zIndex: 1000 }}>
      {/* Slide-up panel */}
      <div
        style={{
          width: 280,
          background: "#fff",
          borderRadius: "8px 8px 0 0",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
          border: "1px solid #e5e7eb",
          borderBottom: "none",
          padding: 14,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.2s ease",
          // Keep rendered so transition works; hide from a11y when closed
          visibility: open ? "visible" : "hidden",
        }}
        aria-hidden={!open}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 10 }}>
          What's new
        </div>

        {commits.slice(0, 3).map((c) => (
          <div key={c.sha} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "#9ca3af",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                {c.sha.slice(0, 7)}
              </a>
              <span style={{ fontSize: 12, color: "#111827" }}>{c.message}</span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, paddingLeft: 46 }}>
              {c.date}
            </div>
          </div>
        ))}

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4, paddingTop: 8 }}>
          <a
            href={SEE_ALL_URL}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}
          >
            See all on GitHub →
          </a>
        </div>
      </div>

      {/* Tab handle */}
      <button
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#1f2937",
          color: "#fff",
          border: "none",
          borderRadius: "6px 6px 0 0",
          padding: "5px 12px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          cursor: "pointer",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {hasNew && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#22c55e",
              flexShrink: 0,
              display: "inline-block",
            }}
          />
        )}
        {TAB_LABEL}
      </button>
    </div>
  );
}
