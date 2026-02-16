import http from "node:http";
import { app } from "./app.js";
import { setupSocketServer } from "./socket/index.js";
import { initSqlite } from "./persistence/sqlite-client.js";
import { startSnapshotManager, snapshotAll } from "./persistence/snapshot-manager.js";

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

// Snapshot on graceful shutdown
function shutdown() {
  console.log("Shutting down — saving final snapshot...");
  try {
    snapshotAll();
  } catch (err) {
    console.error("Error during shutdown snapshot:", err);
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();

export { server, io };
