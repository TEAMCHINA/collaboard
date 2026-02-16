import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import { registerHandlers } from "./handlers.js";

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketServer(httpServer: HttpServer): TypedServer {
  const io: TypedServer = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    registerHandlers(io, socket);
  });

  return io;
}
