import type { Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, ConnectedUser, Operation } from "shared";
import { generateId, invertOperation } from "shared";
import { getOrCreateBoard, applyOp, getBoardElements, getBoard } from "../board/board-manager.js";
import { pushOp, popUndo, popRedo } from "../board/undo-manager.js";
import { getNextCursorColor } from "../utils/colors.js";
import type { TypedServer } from "./index.js";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Track connected users per room: Map<room, Map<socketId, ConnectedUser>>
const roomUsers = new Map<string, Map<string, ConnectedUser>>();

function getRoomUsers(token: string): ConnectedUser[] {
  const users = roomUsers.get(token);
  if (!users) return [];
  return Array.from(users.values());
}

export function getRoomUserMap(): Map<string, Map<string, ConnectedUser>> {
  return roomUsers;
}

export function registerHandlers(io: TypedServer, socket: TypedSocket): void {
  let currentRoom: string | null = null;
  let currentUser: ConnectedUser | null = null;

  function safe<T extends unknown[]>(handler: (...args: T) => void) {
    return (...args: T) => {
      try {
        handler(...args);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Handler error [${socket.id}]: ${msg}`);
        socket.emit("board:error", msg);
      }
    };
  }

  socket.on("board:join", safe(({ token, displayName }) => {
    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      const users = roomUsers.get(currentRoom);
      if (users) {
        users.delete(socket.id);
        if (users.size === 0) {
          roomUsers.delete(currentRoom);
          const board = getBoard(currentRoom);
          if (board) board.empty = true;
        }
        io.to(currentRoom).emit("board:user-left", {
          displayName: currentUser!.displayName,
          users: getRoomUsers(currentRoom),
        });
      }
    }

    currentRoom = token;
    currentUser = {
      displayName,
      cursorColor: getNextCursorColor(),
    };

    socket.join(token);

    // Track user in room
    if (!roomUsers.has(token)) {
      roomUsers.set(token, new Map());
    }
    roomUsers.get(token)!.set(socket.id, currentUser);

    // Cancel pending eviction if someone rejoins before next snapshot cycle
    const existingBoard = getBoard(token);
    if (existingBoard) existingBoard.empty = false;

    // Initialize board
    const board = getOrCreateBoard(token);

    // Send current state to joining user
    const elements = getBoardElements(token);
    socket.emit("board:state", { elements, seqNum: board.seqNum });

    // Send full user list to joining user
    socket.emit("board:user-list", getRoomUsers(token));

    // Notify others
    socket.to(token).emit("board:user-joined", {
      displayName,
      users: getRoomUsers(token),
    });
  }));

  socket.on("board:operation", safe((op: Operation) => {
    if (!currentRoom || !currentUser) return;

    const board = getOrCreateBoard(currentRoom);
    const stamped = applyOp(board, op);

    // Track in undo stack
    pushOp(currentRoom, currentUser.displayName, stamped);

    // Broadcast to all in room (including sender for confirmation)
    io.to(currentRoom).emit("board:operation", stamped);
  }));

  socket.on("board:undo", safe(() => {
    if (!currentRoom || !currentUser) return;

    const lastOp = popUndo(currentRoom, currentUser.displayName);
    if (!lastOp) return;

    const board = getOrCreateBoard(currentRoom);
    const inverse = invertOperation(lastOp);
    const inverseOp: Operation = {
      ...inverse,
      id: generateId(),
      seqNum: 0,
      timestamp: Date.now(),
    } as Operation;

    const stamped = applyOp(board, inverseOp);
    io.to(currentRoom).emit("board:operation", stamped);
  }));

  socket.on("board:redo", safe(() => {
    if (!currentRoom || !currentUser) return;

    const redoOp = popRedo(currentRoom, currentUser.displayName);
    if (!redoOp) return;

    const board = getOrCreateBoard(currentRoom);
    const reapplied: Operation = {
      ...redoOp,
      id: generateId(),
      seqNum: 0,
      timestamp: Date.now(),
    } as Operation;

    const stamped = applyOp(board, reapplied);
    io.to(currentRoom).emit("board:operation", stamped);
  }));

  socket.on("board:clear", safe(() => {
    if (!currentRoom || !currentUser) return;

    const board = getOrCreateBoard(currentRoom);
    const elements = getBoardElements(currentRoom);
    if (elements.length === 0) return;

    for (const el of elements) {
      const removeOp: Operation = {
        id: generateId(),
        type: "removeElement",
        boardToken: currentRoom,
        owner: currentUser.displayName,
        timestamp: Date.now(),
        seqNum: 0,
        elementId: el.id,
        removedElement: el,
      } as Operation;

      const stamped = applyOp(board, removeOp);
      pushOp(currentRoom, currentUser.displayName, stamped);
      io.to(currentRoom).emit("board:operation", stamped);
    }
  }));

  socket.on("board:drawing", safe((element) => {
    if (!currentRoom || !currentUser) return;
    socket.to(currentRoom).emit("board:drawing", {
      displayName: currentUser.displayName,
      element,
    });
  }));

  socket.on("cursor:move", safe(({ x, y }) => {
    if (!currentRoom || !currentUser) return;
    socket.to(currentRoom).emit("cursor:update", {
      displayName: currentUser.displayName,
      x,
      y,
      color: currentUser.cursorColor,
    });
  }));

  socket.on("user:update-color", safe((color: string) => {
    if (!currentRoom || !currentUser) return;
    currentUser.cursorColor = color;
    const users = roomUsers.get(currentRoom);
    if (users) {
      users.set(socket.id, currentUser);
    }
    io.to(currentRoom).emit("board:user-list", getRoomUsers(currentRoom));
  }));

  socket.on("user:update-name", safe((newName: string) => {
    if (!currentRoom || !currentUser) return;
    currentUser.displayName = newName;
    const users = roomUsers.get(currentRoom);
    if (users) {
      users.set(socket.id, currentUser);
    }
    io.to(currentRoom).emit("board:user-list", getRoomUsers(currentRoom));
  }));

  // disconnect is not wrapped in safe() — it must always run cleanup
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      const users = roomUsers.get(currentRoom);
      if (users) {
        users.delete(socket.id);
        if (users.size === 0) {
          roomUsers.delete(currentRoom);
          const board = getBoard(currentRoom);
          if (board) board.empty = true;
        }
      }
      io.to(currentRoom).emit("board:user-left", {
        displayName: currentUser.displayName,
        users: getRoomUsers(currentRoom),
      });
    }
  });
}
