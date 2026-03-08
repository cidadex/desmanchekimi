# Central dos Desmanches

A marketplace/leads platform connecting accredited vehicle dismantling facilities (ferro-velhos) with customers, workshops, and other dismantling businesses for automotive, nautical, and aeronautic parts.

## Architecture

- **Frontend**: React 19 + TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, TanStack Query, wouter routing
- **Backend**: Express.js 5 + TypeScript (tsx in dev), Passport.js auth, WebSockets (ws)
- **Database**: SQLite via Drizzle ORM (better-sqlite3)
- **Monorepo layout**: `client/` (frontend), `server/` (backend), `shared/` (shared schemas/types)

## Running the App

The Express server serves both the API and the Vite dev client on **port 5000** via a single process.

```bash
npm run dev       # Development (tsx server/index.ts)
npm run build     # Production build (esbuild + Vite)
npm start         # Run production build
```

## Key Files

- `server/index.ts` — Express app entry point
- `server/routes.ts` — API routes
- `server/storage.ts` — Drizzle ORM + SQLite database logic + seed data
- `client/src/App.tsx` — React app root
- `vite.config.ts` — Vite configuration (root: `client/`, host: `0.0.0.0`, allowedHosts: true)
- `shared/schema.ts` — Zod schemas shared between client and server
- `drizzle.config.ts` — Drizzle Kit config

## Default Credentials (seeded)

- Admin: `admin@centraldesmanches.com` / `admin123`
- Desmanche: `contato@irmaossilva.com` / `desmanche123`
- Cliente: `cliente@email.com` / `cliente123`

## Deployment

- Target: autoscale
- Build: `npm run build`
- Run: `node dist/index.cjs`
