import { useConnectionStore } from "../../store/connection-store";

export function ConnectionOverlay() {
  const connected = useConnectionStore((s) => s.connected);
  const reconnecting = useConnectionStore((s) => s.reconnecting);

  if (connected) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      pointerEvents: "none",
    }}>
      <div style={{
        background: "#fff",
        padding: "20px 32px",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
          Disconnected
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          {reconnecting ? "Reconnecting..." : "Waiting for connection..."}
        </div>
      </div>
    </div>
  );
}
