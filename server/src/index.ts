import http from "node:http";
import { app } from "./app.js";
import { setupSocketServer } from "./socket/index.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

const server = http.createServer(app);
const io = setupSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export { server, io };
