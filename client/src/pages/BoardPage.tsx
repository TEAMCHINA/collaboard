import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useUserStore } from "../store/user-store";
import { useSocketConnection } from "../socket/socket-hooks";
import { useBoard } from "../hooks/useBoard";
import { socket } from "../socket/socket-client";
import { Canvas } from "../components/Canvas/Canvas";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { CursorOverlay } from "../components/CursorOverlay/CursorOverlay";
import { UserNamePrompt } from "../components/UserNamePrompt/UserNamePrompt";
import { TextInput } from "../components/TextOverlay/TextInput";
import { SaveIndicator } from "../components/SaveIndicator/SaveIndicator";

export function BoardPage() {
  const { token } = useParams<{ token: string }>();
  const [displayName, setDisplayName] = useState<string>("");
  const getName = useUserStore((s) => s.getName);
  const setName = useUserStore((s) => s.setName);

  // Check for saved name
  useEffect(() => {
    if (!token) return;
    const saved = getName(token);
    if (saved) setDisplayName(saved);
  }, [token, getName]);

  const handleNameSubmit = (name: string) => {
    if (!token) return;
    setName(token, name);
    setDisplayName(name);
  };

  if (!token) return null;

  if (!displayName) {
    return <UserNamePrompt onSubmit={handleNameSubmit} />;
  }

  return <BoardPageInner token={token} displayName={displayName} onNameChange={handleNameSubmit} />;
}

function BoardPageInner({ token, displayName, onNameChange }: { token: string; displayName: string; onNameChange: (name: string) => void }) {
  const lastCursorEmit = useRef(0);

  useSocketConnection(token, displayName);
  const { toolManager, handleToolChange, textPlacement, commitText, cancelText, onTextChange } = useBoard(token, displayName);

  // Emit cursor position (throttled)
  const handleMouseMove = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastCursorEmit.current > 50) {
      lastCursorEmit.current = now;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      socket.emit("cursor:move", {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar
        onToolChange={handleToolChange}
        onClear={() => socket.emit("board:clear")}
        displayName={displayName}
        onNameChange={onNameChange}
      />
      <div
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
        onMouseMove={handleMouseMove}
      >
        <Canvas toolManager={toolManager} />
        <CursorOverlay />
        {textPlacement && (
          <TextInput
            x={textPlacement.x}
            y={textPlacement.y}
            onCommit={commitText}
            onCancel={cancelText}
            onChange={onTextChange}
          />
        )}
      </div>
      <SaveIndicator />
    </div>
  );
}
