import { useState } from "react";

interface Props {
  onSubmit: (name: string) => void;
}

export function UserNamePrompt({ onSubmit }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "white",
        borderRadius: 12,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minWidth: 320,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Enter your display name</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          maxLength={30}
          style={{
            padding: "10px 14px",
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 6,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 6,
            border: "none",
            background: name.trim() ? "#2563eb" : "#ccc",
            color: "white",
            cursor: name.trim() ? "pointer" : "default",
            fontWeight: 600,
          }}
        >
          Join board
        </button>
      </form>
    </div>
  );
}
