import express, { type Express } from "express";

export const app: Express = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
