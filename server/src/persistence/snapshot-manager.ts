import { getBoardElements, getBoard, getActiveBoards, removeBoard } from "../board/board-manager.js";
import { saveSnapshot } from "./sqlite-snapshots.js";
import { persistToFile } from "./sqlite-client.js";
import type { TypedServer } from "../socket/index.js";

const SNAPSHOT_INTERVAL = parseInt(process.env.SNAPSHOT_INTERVAL || "10000", 10);

let intervalId: ReturnType<typeof setInterval> | null = null;
let io: TypedServer | null = null;

export function startSnapshotManager(server: TypedServer): void {
  io = server;
  intervalId = setInterval(() => {
    snapshotAll();
  }, SNAPSHOT_INTERVAL);
  console.log(`Snapshot manager started (interval: ${SNAPSHOT_INTERVAL}ms)`);
}

export function stopSnapshotManager(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function snapshotAll(): void {
  const tokens = getActiveBoards();
  if (tokens.length === 0) return;

  const dirtyTokens: string[] = [];
  for (const token of tokens) {
    const board = getBoard(token);
    if (board?.dirty) dirtyTokens.push(token);
  }

  if (dirtyTokens.length === 0) return;

  if (io) {
    for (const token of dirtyTokens) {
      io.to(token).emit("board:save-start");
    }
  }

  try {
    for (const token of dirtyTokens) {
      const board = getBoard(token);
      if (!board) continue;
      const elements = getBoardElements(token);
      saveSnapshot(token, elements, board.seqNum);
      board.dirty = false;
    }

    persistToFile();

    if (io) {
      for (const token of dirtyTokens) {
        io.to(token).emit("board:save-end");
      }
    }

    console.log(`Snapshot saved for ${dirtyTokens.length} dirty board(s)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown snapshot error";
    console.error(`Snapshot error: ${message}`);

    if (io) {
      for (const token of dirtyTokens) {
        io.to(token).emit("board:save-error", message);
      }
    }
  }
}

export function snapshotBoard(token: string): void {
  const board = getBoard(token);
  if (!board) return;

  try {
    const elements = getBoardElements(token);
    saveSnapshot(token, elements, board.seqNum);
    board.dirty = false;
    persistToFile();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown snapshot error";
    console.error(`Snapshot error for board ${token}: ${message}`);
  }
}
