import type { ReactNode } from "react";
import { theme } from "../../styles/theme";

interface Props {
  children: ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}

export function ToolButton({ children, title, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "6px 10px",
        fontSize: 14,
        border: active ? `2px solid ${theme.accentBlue}` : `1px solid ${theme.borderControl}`,
        borderRadius: 6,
        background: active ? "#eff6ff" : "white",
        color: active ? theme.accentBlue : "#333",
        cursor: "pointer",
        fontWeight: active ? 600 : 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
      }}
    >
      {children}
    </button>
  );
}
