import { useNavigate } from "react-router-dom";
import { theme } from "../styles/theme";
import { generateToken } from "shared";
import { PatchNotes } from "../components/PatchNotes/PatchNotes";

export function LandingPage() {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate(`/${generateToken()}`);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: 24,
    }}>
      <h1 style={{ fontSize: 48, fontWeight: 700 }}>Collaboard</h1>
      <p style={{ color: "#666", fontSize: 18 }}>Real-time collaborative whiteboard</p>
      <button
        onClick={handleCreate}
        style={{
          padding: "12px 32px",
          fontSize: 18,
          borderRadius: 8,
          border: "none",
          background: theme.accentBlue,
          color: "white",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Generate new board
      </button>
      <PatchNotes />
    </div>
  );
}
