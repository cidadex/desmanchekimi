# Central dos Desmanches

A marketplace/leads platform connecting accredited vehicle dismantling facilities (ferro-velhos) with customers, workshops, and other dismantling businesses for automotive, nautical, and aeronautic parts.

## Architecture

- **Frontend**: React 19 + TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, TanStack Query, wouter routing
- **Backend**: Express.js 5 + TypeScript (tsx in dev), JWT auth, WebSockets (ws)
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
- `server/routes.ts` — API routes (auth, users, orders, proposals, negotiations, reviews, auctions, invoices, documents)
- `server/storage.ts` — Drizzle ORM + SQLite database logic + seed data
- `client/src/App.tsx` — React app root with routes: `/`, `/cliente`, `/admin`, `/desmanche`
- `client/src/pages/ClientDashboard.tsx` — Client panel (profile, orders, proposals, negotiations)
- `client/src/components/client/` — Client panel tab components (OverviewTab, ProfileTab, OrdersTab, ProposalsTab, NegotiationsTab)
- `vite.config.ts` — Vite configuration (root: `client/`, host: `0.0.0.0`, allowedHosts: true)
- `shared/schema.ts` — Drizzle + Zod schemas shared between client and server

## Database Tables

users, addresses, desmanches, desmanche_addresses, documents, orders, order_images, proposals, negotiations, auctions, invoices, reviews

## Client Panel Features (Fully Connected to API)

- Profile completion (name, phone, whatsapp, address with CEP auto-fill)
- Profile completeness check (whatsapp + address required to create orders)
- Create/list/cancel orders
- View/accept/reject proposals from desmanches
- WhatsApp unlock for contacting desmanches
- Negotiations pipeline (negotiating -> shipped -> delivered -> completed)
- Review/rate desmanches after delivery

## Default Credentials (seeded)

- Admin: `admin@centraldesmanches.com` / `admin123`
- Desmanche: `contato@irmaossilva.com` / `desmanche123`
- Cliente: `cliente@email.com` / `cliente123`

## Deployment

- Target: autoscale
- Build: `npm run build`
- Run: `node dist/index.cjs`
