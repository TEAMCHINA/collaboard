import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import { getCommits } from "./commits.js";

export const app: Express = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/commits", (_req, res) => res.json(getCommits()));

// In production, serve the client build
const clientDist = path.resolve(import.meta.dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: serve index.html for any non-API, non-static route
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
