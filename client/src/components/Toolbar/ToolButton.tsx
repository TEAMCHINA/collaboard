interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function ToolButton({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        fontSize: 14,
        border: active ? "2px solid #2563eb" : "1px solid #ccc",
        borderRadius: 6,
        background: active ? "#eff6ff" : "white",
        color: active ? "#2563eb" : "#333",
        cursor: "pointer",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}
