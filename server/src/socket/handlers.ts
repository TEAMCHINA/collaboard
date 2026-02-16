import type { Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, ConnectedUser, Operation } from "shared";
import { generateId, invertOperation } from "shared";
import { getOrCreateBoard, applyOp, getBoardElements } from "../board/board-manager.js";
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

  socket.on("board:join", ({ token, displayName }) => {
    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      const users = roomUsers.get(currentRoom);
      if (users) {
        users.delete(socket.id);
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
  });

  socket.on("board:operation", (op: Operation) => {
    if (!currentRoom || !currentUser) return;

    const board = getOrCreateBoard(currentRoom);
    const stamped = applyOp(board, op);

    // Track in undo stack
    pushOp(currentRoom, currentUser.displayName, stamped);

    // Broadcast to all in room (including sender for confirmation)
    io.to(currentRoom).emit("board:operation", stamped);
  });

  socket.on("board:undo", () => {
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
  });

  socket.on("board:redo", () => {
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
  });

  socket.on("board:drawing", (element) => {
    if (!currentRoom || !currentUser) return;
    socket.to(currentRoom).emit("board:drawing", {
      displayName: currentUser.displayName,
      element,
    });
  });

  socket.on("cursor:move", ({ x, y }) => {
    if (!currentRoom || !currentUser) return;
    socket.to(currentRoom).emit("cursor:update", {
      displayName: currentUser.displayName,
      x,
      y,
      color: currentUser.cursorColor,
    });
  });

  socket.on("user:update-color", (color: string) => {
    if (!currentRoom || !currentUser) return;
    currentUser.cursorColor = color;
    const users = roomUsers.get(currentRoom);
    if (users) {
      users.set(socket.id, currentUser);
    }
    io.to(currentRoom).emit("board:user-list", getRoomUsers(currentRoom));
  });

  socket.on("user:update-name", (newName: string) => {
    if (!currentRoom || !currentUser) return;
    currentUser.displayName = newName;
    const users = roomUsers.get(currentRoom);
    if (users) {
      users.set(socket.id, currentUser);
    }
    io.to(currentRoom).emit("board:user-list", getRoomUsers(currentRoom));
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      const users = roomUsers.get(currentRoom);
      if (users) {
        users.delete(socket.id);
        if (users.size === 0) {
          roomUsers.delete(currentRoom);
        }
      }
      io.to(currentRoom).emit("board:user-left", {
        displayName: currentUser.displayName,
        users: getRoomUsers(currentRoom),
      });
    }
  });
}
