import { useParams } from "react-router-dom";

export function BoardPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 16px", background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        Board: {token}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        Canvas will render here
      </div>
    </div>
  );
}
