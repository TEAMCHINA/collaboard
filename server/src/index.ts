import http from "node:http";
import { app } from "./app.js";
import { setupSocketServer } from "./socket/index.js";
import { initSqlite } from "./persistence/sqlite-client.js";
import { startSnapshotManager, stopSnapshotManager, snapshotAll } from "./persistence/snapshot-manager.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

const server = http.createServer(app);
const io = setupSocketServer(server);

async function start() {
  await initSqlite();

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  startSnapshotManager(io);
}

// Graceful shutdown: stop accepting connections, snapshot, then exit
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("Shutting down...");
  stopSnapshotManager();

  try {
    snapshotAll();
    console.log("Final snapshot saved.");
  } catch (err) {
    console.error("Error during shutdown snapshot:", err);
  }

  io.close();
  server.close(() => {
    process.exit(0);
  });

  // Force exit after 5s if server.close hangs
  setTimeout(() => process.exit(0), 5000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

start();

export { server, io };
