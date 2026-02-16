import { useEffect, useRef } from "react";
import { socket } from "./socket-client";
import { useBoardStore } from "../store/board-store";
import { useConnectionStore } from "../store/connection-store";
import { useCursorStore } from "../store/cursor-store";
import { useDrawingStore } from "../store/drawing-store";
import { useSaveStore } from "../store/save-store";

export function useSocketConnection(token: string, displayName: string) {
  const joined = useRef(false);

  useEffect(() => {
    if (!token || !displayName) return;

    const { setInitialState, applyOp } = useBoardStore.getState();
    const { setConnected, setUsers } = useConnectionStore.getState();
    const { updateCursor, removeCursor } = useCursorStore.getState();
    const { setRemoteDrawing } = useDrawingStore.getState();
    const { onSaveStart, onSaveEnd, onSaveError } = useSaveStore.getState();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("board:join", { token, displayName });
      joined.current = true;
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("board:state", ({ elements, seqNum }) => {
      setInitialState(elements, seqNum);
    });

    socket.on("board:operation", (op) => {
      applyOp(op);
    });

    socket.on("board:user-list", (users) => {
      setUsers(users);
    });

    socket.on("board:user-joined", ({ displayName: name, users }) => {
      setUsers(users);
    });

    socket.on("board:user-left", ({ displayName: name, users }) => {
      setUsers(users);
      removeCursor(name);
      setRemoteDrawing(name, null);
    });

    socket.on("board:drawing", ({ displayName: name, element }) => {
      setRemoteDrawing(name, element);
    });

    socket.on("cursor:update", ({ displayName: name, x, y, color }) => {
      updateCursor(name, x, y, color);
    });

    socket.on("board:save-start", () => {
      onSaveStart();
    });

    socket.on("board:save-end", () => {
      onSaveEnd();
    });

    socket.on("board:save-error", (message) => {
      console.error("Board save error:", message);
      onSaveError(message);
    });

    socket.on("board:error", (message) => {
      console.error("Board error:", message);
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("board:state");
      socket.off("board:operation");
      socket.off("board:user-list");
      socket.off("board:user-joined");
      socket.off("board:user-left");
      socket.off("board:drawing");
      socket.off("cursor:update");
      socket.off("board:save-start");
      socket.off("board:save-end");
      socket.off("board:save-error");
      socket.off("board:error");
      socket.disconnect();
      joined.current = false;
    };
  }, [token, displayName]);
}
