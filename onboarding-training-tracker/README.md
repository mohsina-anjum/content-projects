# Onboarding Training Tracker

An internal tool for managers to assign onboarding agendas (sets of training modules) to
new hires, track their progress on a Kanban-style board, and evaluate completion on each
module (status, 1-5 score, notes, evaluator).

No authentication — this is a trusted single-machine internal tool.

## Requirements

- Node.js 18+ and npm

## Install

From the repo root:

```bash
npm install
```

This installs the root's own tiny dependency (`concurrently`) and then automatically runs
`npm install` inside both `/server` and `/client` via a `postinstall` script. If you ever
need to install the two sides independently instead, you can run:

```bash
npm install --prefix server
npm install --prefix client
```

## Run

From the repo root:

```bash
npm run dev
```

This starts both processes concurrently:

- API server on **http://localhost:4000** (Express + TypeScript, via `tsx watch`)
- Client dev server on **http://localhost:5173** (Vite + React), which proxies `/api/*`
  requests to the server

Open **http://localhost:5173** in your browser.

On first boot, the server creates a SQLite database at `server/data/tracker.db` (gitignored),
runs its schema migrations, and seeds a default "General Onboarding" agenda with 8 sample
modules plus 3 sample new hires in different stages. Subsequent boots reuse the existing
database and skip seeding.

To reset to a fresh seeded state, stop the server and delete `server/data/tracker.db`
(and any `-wal`/`-shm` files next to it), then restart.

## Build (production bundles)

```bash
npm run build
```

Compiles the server to `server/dist` and builds the client to `client/dist`. This project
is set up for local/dev use; wiring up a production start script (serving the built client
from the Express server, etc.) was left out as out of scope for an internal dev tool.

## Project structure

```
/server   Express + TypeScript API, SQLite via better-sqlite3
  src/db          schema + migrations + seed data
  src/routes      /api/agendas, /api/new-hires, /api/assignments
  data/           tracker.db lives here (gitignored)
/client   Vite + React + TypeScript
  src/api         typed fetch client
  src/components  NewHireCard, NewHireDrawer, AssignmentRow, ModuleEditor, etc.
  src/pages       BoardPage (Kanban), ManageAgendasPage
```

## API overview

All endpoints are under `/api`.

- `GET/POST /agendas`, `GET/PATCH/DELETE /agendas/:id`
- `POST/PATCH/DELETE /agendas/:id/modules[/​:moduleId]`
- `GET/POST /new-hires`, `GET/PATCH/DELETE /new-hires/:id`
  (create auto-generates one `assignments` row per module in the chosen agenda)
- `GET /assignments/new-hire/:newHireId`, `PATCH /assignments/:id`
  (setting `status: "completed"` stamps `completed_at`; any other status clears it)

## Notes / deliberate simplifications

- No auth, no multi-user concurrency handling, no soft-deletes.
- Deleting an agenda is blocked (409) while any new hire is still assigned to it.
- The "reorder modules" UI uses up/down buttons that swap `order_index` with the
  neighboring module, rather than drag-and-drop — this was simpler to make reliable and
  the spec only required drag-and-drop on the Kanban board.
- No production server (`server/dist`) is wired to serve the built client — `npm run dev`
  is the supported way to run this tool.
