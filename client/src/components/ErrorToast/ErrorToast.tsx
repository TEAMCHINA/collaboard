import { useErrorStore } from "../../store/error-store";

export function ErrorToast() {
  const message = useErrorStore((s) => s.message);
  const clearError = useErrorStore((s) => s.clearError);
  if (!message) return null;
  return (
    <div style={{
      position: "fixed",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#fef2f2",
      border: "1px solid #fca5a5",
      borderRadius: 6,
      padding: "8px 14px",
      fontSize: 13,
      color: "#b91c1c",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: 8,
      pointerEvents: "auto",
    }}>
      {message}
      <button
        onClick={clearError}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#b91c1c",
          fontWeight: 700,
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
