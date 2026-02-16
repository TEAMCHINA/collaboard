import { useSaveStore, type SaveDisplay } from "../../store/save-store";

export function SaveIndicator() {
  const display = useSaveStore((s) => s.display);
  const errorMessage = useSaveStore((s) => s.errorMessage);

  if (display === "idle") return null;

  const styles: Record<Exclude<SaveDisplay, "idle">, { bg: string; color: string; text: string }> = {
    saving: { bg: "#f0f0f0", color: "#555", text: "Saving..." },
    saved: { bg: "#ecfdf5", color: "#16a34a", text: "Saved" },
    error: { bg: "#fef2f2", color: "#dc2626", text: `Save error: ${errorMessage || "unknown"}` },
  };

  const { bg, color, text } = styles[display];

  return (
    <div style={{
      position: "fixed",
      bottom: 16,
      left: "50%",
      transform: "translateX(-50%)",
      background: bg,
      color,
      padding: "6px 16px",
      borderRadius: 6,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 2000,
      pointerEvents: "none",
    }}>
      {text}
    </div>
  );
}
