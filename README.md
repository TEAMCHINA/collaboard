# Collaboard

Real-time collaborative whiteboard. Users join boards by navigating to `/<token>` — any string works, and non-existent tokens create blank boards. A landing page at `/` generates random board links.

## Features

- **Freehand drawing** with configurable color and stroke width
- **Text placement** with configurable color and font size
- **Real-time sync** — strokes and text appear on other clients as they're drawn/typed
- **Live cursors** — see other users' cursor positions with name labels
- **Per-user undo/redo** — Ctrl+Z / Ctrl+Shift+Z only affect your own actions
- **Persistent storage** — boards are saved to SQLite and survive server restarts
- **Per-room identity** — choose a different display name for each board, editable from the toolbar

## Tech Stack

- **Monorepo**: pnpm workspaces (`shared`, `server`, `client`)
- **Server**: Node.js, Express 5, socket.io, sql.js (WASM SQLite)
- **Client**: React 19, Vite, socket.io-client, Zustand
- **Language**: TypeScript throughout

## Development

```bash
pnpm install
pnpm dev
```

This starts both the server (port 3001) and the Vite dev server (port 5173) with hot reload. Open http://localhost:5173.

## Testing

```bash
pnpm test
```

## Production

```bash
pnpm build
pnpm start
```

The server serves the client build as static files. Open http://localhost:3001.

## Docker

Build and run locally:

```bash
docker compose up --build
```

Build and push for deployment (e.g. Raspberry Pi):

```bash
docker build -t <dockerhub-user>/collaboard:latest .
docker push <dockerhub-user>/collaboard:latest
```

A deployment compose file is in `deploy/docker-compose.yml` — update the image name and pull on your server:

```bash
docker compose pull
docker compose up -d
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP server port |
| `DB_PATH` | `collaboard.db` | SQLite database file path |
| `SNAPSHOT_INTERVAL` | `10000` | How often to save dirty boards to disk (ms) |

## Architecture

The server holds board state in memory and periodically snapshots dirty boards to SQLite. When all users leave a board, it's immediately saved and evicted from memory. On the next join, state is restored from the snapshot.

Operations flow through the server — clients emit ops, the server applies them, stamps a sequence number, and broadcasts to all room members. Undo/redo is server-authoritative and scoped per user.

The renderer uses dual HTML canvases: a background canvas for committed elements and an active canvas for in-progress drawing, both using Canvas 2D. The tool and renderer systems are registered in a Map for extensibility - adding new tools is just a matter of registering a render function.
