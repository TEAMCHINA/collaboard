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
docker buildx build --platform linux/amd64,linux/arm64 -t <dockerhub-user>/collaboard:latest --push .
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

Collaboard uses an event-driven architecture built around Socket.IO. Clients emit operations to the server, which maintains an authoritative, ordered log of committed operations and broadcasts updates to connected clients. This event log represents the board's state and supports rendering, replay, and per-user undo/redo.

Active boards are maintained in memory, with their event logs periodically persisted to SQLite. When the last user leaves a board, its event log is saved and evicted from memory. When someone rejoins, the board is restored from the persisted log.

Undo/redo is also server-authoritative and scoped per user, allowing users to reverse their own actions without affecting other participants' history.

The renderer uses dual HTML canvases: a background canvas for committed elements and an active canvas for in-progress drawing, both using Canvas 2D. The tool and renderer systems are registered in a Map for extensibility - adding new tools is just a matter of registering a render function.

## Design Decisions and Tradeoffs

### Event log persistence

Rather than persisting every operation as it arrives, I chose to periodically snapshot the event log. This reduces database writes and keeps the persistence mechanism simple, at the cost of potentially losing recent operations if the server crashes before the next snapshot.

Collaboard was primarily designed for casual collaboration, like playing Pictionary with friends or discussing raid strategies in World of Warcraft. Most sessions aren't expected to be revisited, so stronger durability guarantees weren't a priority. Persisting individual events as they arrive would be a reasonable extension if those requirements change.

The event history is also mutable: undo removes the corresponding operation rather than appending a compensating event. This supports the application's current needs without requiring the additional complexity of a fully immutable, event-sourced model.
