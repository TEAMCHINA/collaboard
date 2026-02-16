import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../socket/socket-client";
import { useBoardStore } from "../store/board-store";
import { useConnectionStore } from "../store/connection-store";
import { useCursorStore } from "../store/cursor-store";
import { useUserStore } from "../store/user-store";
import { useSocketConnection } from "../socket/socket-hooks";
import { generateId } from "shared";
import type { Operation, StrokeElement, AddElementOp } from "shared";

export function TestPage() {
  const { token } = useParams<{ token: string }>();
  const [logs, setLogs] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [nameInput, setNameInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const elements = useBoardStore((s) => s.elements);
  const users = useConnectionStore((s) => s.users);
  const connected = useConnectionStore((s) => s.connected);
  const cursors = useCursorStore((s) => s.cursors);

  // Set display name from store or prompt
  useEffect(() => {
    if (!token) return;
    const saved = useUserStore.getState().getName(token);
    if (saved) setDisplayName(saved);
  }, [token]);

  useSocketConnection(token!, displayName);

  const log = (msg: string) => {
    setLogs((prev) => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Log socket events
  useEffect(() => {
    if (!displayName) return;

    const onState = (data: { elements: unknown[]; seqNum: number }) =>
      log(`board:state - ${data.elements.length} elements, seqNum=${data.seqNum}`);
    const onOp = (op: Operation) =>
      log(`board:operation - ${op.type} by ${op.owner} (seq=${op.seqNum})`);
    const onJoin = (data: { displayName: string }) =>
      log(`user-joined: ${data.displayName}`);
    const onLeave = (data: { displayName: string }) =>
      log(`user-left: ${data.displayName}`);
    const onCursor = (data: { displayName: string; x: number; y: number }) =>
      log(`cursor: ${data.displayName} at (${Math.round(data.x)}, ${Math.round(data.y)})`);

    socket.on("board:state", onState);
    socket.on("board:operation", onOp);
    socket.on("board:user-joined", onJoin);
    socket.on("board:user-left", onLeave);
    socket.on("cursor:update", onCursor);

    return () => {
      socket.off("board:state", onState);
      socket.off("board:operation", onOp);
      socket.off("board:user-joined", onJoin);
      socket.off("board:user-left", onLeave);
      socket.off("cursor:update", onCursor);
    };
  }, [displayName]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSetName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && token) {
      useUserStore.getState().setName(token, trimmed);
      setDisplayName(trimmed);
    }
  };

  const handleAddStroke = () => {
    if (!token || !displayName) return;
    const element: StrokeElement = {
      id: generateId(),
      type: "stroke",
      owner: displayName,
      createdAt: Date.now(),
      zIndex: 0,
      points: [
        { x: Math.random() * 500, y: Math.random() * 500 },
        { x: Math.random() * 500, y: Math.random() * 500 },
        { x: Math.random() * 500, y: Math.random() * 500 },
      ],
      color: "#000000",
      width: 3,
    };

    const op: AddElementOp = {
      id: generateId(),
      type: "addElement",
      boardToken: token,
      owner: displayName,
      timestamp: Date.now(),
      seqNum: 0,
      element,
    };

    socket.emit("board:operation", op);
    log(`Sent addElement op`);
  };

  const handleUndo = () => {
    socket.emit("board:undo");
    log(`Sent undo`);
  };

  const handleRedo = () => {
    socket.emit("board:redo");
    log(`Sent redo`);
  };

  // Track mouse for cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    socket.emit("cursor:move", { x: e.clientX, y: e.clientY });
  };

  if (!displayName) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Test Page - Board: {token}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Display name"
            onKeyDown={(e) => e.key === "Enter" && handleSetName()}
          />
          <button onClick={handleSetName}>Join</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}
      onMouseMove={handleMouseMove}>
      <h2>Test Page - Board: {token} | User: {displayName} | {connected ? "Connected" : "Disconnected"}</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={handleAddStroke}>Add Stroke</button>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleRedo}>Redo</button>
      </div>

      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1 }}>
          <h3>Connected Users ({users.length})</h3>
          <ul>
            {users.map((u) => (
              <li key={u.displayName}>
                <span style={{ color: u.cursorColor, fontWeight: 700 }}>{u.displayName}</span>
              </li>
            ))}
          </ul>

          <h3>Elements ({elements.size})</h3>
          <ul>
            {Array.from(elements.values()).map((el) => (
              <li key={el.id}>{el.type} by {el.owner} (z={el.zIndex})</li>
            ))}
          </ul>

          <h3>Remote Cursors</h3>
          <ul>
            {Array.from(cursors.entries()).map(([name, pos]) => (
              <li key={name}>{name}: ({Math.round(pos.x)}, {Math.round(pos.y)})</li>
            ))}
          </ul>
        </div>

        <div
          ref={logRef}
          style={{
            flex: 1,
            background: "#1a1a2e",
            color: "#0f0",
            fontFamily: "monospace",
            fontSize: 12,
            padding: 12,
            overflow: "auto",
            borderRadius: 8,
          }}
        >
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
